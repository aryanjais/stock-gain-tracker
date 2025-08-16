/**
 * React Context for Stock Gain Tracker application
 * Provides centralized state management for stock data and operations
 */

import React, { createContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { StockEntry, Portfolio, StockEntryFormData, ValidationError } from '../types';
import { loadStockEntries, saveStockEntries, loadSettings, saveSettings } from '../utils/storage';
import { createStockEntry, updateStockEntry, validateStockEntry } from '../utils/helpers';
import { calculatePortfolioStats, calculateStockPositions } from '../utils/calculations';

// Context state interface
interface StockContextState {
	entries: StockEntry[];
	portfolio: Portfolio | null;
	loading: boolean;
	error: string | null;
	settings: {
		currency: string;
		dateFormat: string;
		numberFormat: string;
		theme: 'light' | 'dark';
		autoSave: boolean;
		notifications: boolean;
	};
}

// Context actions
type StockContextAction =
	| { type: 'SET_LOADING'; payload: boolean }
	| { type: 'SET_ERROR'; payload: string | null }
	| { type: 'LOAD_ENTRIES'; payload: StockEntry[] }
	| { type: 'ADD_ENTRY'; payload: StockEntry }
	| { type: 'UPDATE_ENTRY'; payload: { id: string; entry: StockEntry } }
	| { type: 'DELETE_ENTRY'; payload: string }
	| { type: 'CLEAR_ENTRIES' }
	| { type: 'UPDATE_PORTFOLIO'; payload: Portfolio }
	| { type: 'UPDATE_SETTINGS'; payload: Partial<StockContextState['settings']> };

// Context interface
export interface StockContextType {
	state: StockContextState;
	addEntry: (formData: StockEntryFormData) => Promise<{ success: boolean; errors?: ValidationError[] }>;
	updateEntry: (id: string, formData: StockEntryFormData) => Promise<{ success: boolean; errors?: ValidationError[] }>;
	deleteEntry: (id: string) => void;
	clearEntries: () => void;
	updateSettings: (settings: Partial<StockContextState['settings']>) => void;
	validateEntry: (formData: StockEntryFormData) => ValidationError[];
}

// Initial state
const initialState: StockContextState = {
	entries: [],
	portfolio: null,
	loading: false,
	error: null,
	settings: {
		currency: 'USD',
		dateFormat: 'MMM dd, yyyy',
		numberFormat: 'en-US',
		theme: 'light',
		autoSave: true,
		notifications: true,
	},
};

// Reducer function
const stockReducer = (state: StockContextState, action: StockContextAction): StockContextState => {
	switch (action.type) {
	case 'SET_LOADING':
		return { ...state, loading: action.payload };
	case 'SET_ERROR':
		return { ...state, error: action.payload };
	case 'LOAD_ENTRIES':
		return { ...state, entries: action.payload };
	case 'ADD_ENTRY':
		return { ...state, entries: [...state.entries, action.payload] };
	case 'UPDATE_ENTRY':
		return {
			...state,
			entries: state.entries.map(entry =>
				entry.id === action.payload.id ? action.payload.entry : entry,
			),
		};
	case 'DELETE_ENTRY':
		return {
			...state,
			entries: state.entries.filter(entry => entry.id !== action.payload),
		};
	case 'CLEAR_ENTRIES':
		return { ...state, entries: [] };
	case 'UPDATE_PORTFOLIO':
		return { ...state, portfolio: action.payload };
	case 'UPDATE_SETTINGS':
		return { ...state, settings: { ...state.settings, ...action.payload } };
	default:
		return state;
	}
};

// Create context
const StockContext = createContext<StockContextType | undefined>(undefined);

// Provider component
interface StockProviderProps {
	children: ReactNode;
}

export const StockProvider: React.FC<StockProviderProps> = ({ children }) => {
	const [state, dispatch] = useReducer(stockReducer, initialState);

	// Load initial data on mount
	useEffect(() => {
		const loadInitialData = async() => {
			try {
				dispatch({ type: 'SET_LOADING', payload: true });
				dispatch({ type: 'SET_ERROR', payload: null });

				// Load settings
				const settings = loadSettings();
				dispatch({ type: 'UPDATE_SETTINGS', payload: settings });

				// Load stock entries
				const entries = loadStockEntries();
				dispatch({ type: 'LOAD_ENTRIES', payload: entries });
			} catch {
				dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
			} finally {
				dispatch({ type: 'SET_LOADING', payload: false });
			}
		};

		loadInitialData();
	}, []);

	// Update portfolio when entries change
	useEffect(() => {
		if (state.entries.length > 0) {
			try {
				const stats = calculatePortfolioStats(state.entries);
				const positions = calculateStockPositions(state.entries);

				const portfolio: Portfolio = {
					entries: state.entries,
					stats,
					positions,
					lastUpdated: new Date().toISOString(),
				};

				dispatch({ type: 'UPDATE_PORTFOLIO', payload: portfolio });
			} catch {
				dispatch({ type: 'SET_ERROR', payload: 'Failed to calculate portfolio' });
			}
		} else {
			// dispatch({ type: 'UPDATE_PORTFOLIO', payload: null });
		}
	}, [state.entries]);

	// Auto-save entries when they change
	useEffect(() => {
		if (state.settings.autoSave && state.entries.length > 0) {
			saveStockEntries(state.entries);
		}
	}, [state.entries, state.settings.autoSave]);

	// Save settings when they change
	useEffect(() => {
		saveSettings(state.settings);
	}, [state.settings]);

	// Add new stock entry
	const addEntry = async(formData: StockEntryFormData): Promise<{ success: boolean; errors?: ValidationError[] }> => {
		try {
			// Validate form data
			const errors = validateStockEntry(formData);
			if (errors.length > 0) {
				return { success: false, errors };
			}

			// Create new entry
			const newEntry = createStockEntry(formData);

			// Add to state
			dispatch({ type: 'ADD_ENTRY', payload: newEntry });

			// Save to storage
			const updatedEntries = [...state.entries, newEntry];
			saveStockEntries(updatedEntries);

			return { success: true };
		} catch {
			dispatch({ type: 'SET_ERROR', payload: 'Failed to add entry' });
			return { success: false };
		}
	};

	// Update existing stock entry
	const updateEntry = async(id: string, formData: StockEntryFormData): Promise<{ success: boolean; errors?: ValidationError[] }> => {
		try {
			// Validate form data
			const errors = validateStockEntry(formData);
			if (errors.length > 0) {
				return { success: false, errors };
			}

			// Find existing entry
			const existingEntry = state.entries.find(entry => entry.id === id);
			if (!existingEntry) {
				return { success: false };
			}

			// Update entry
			const updatedEntry = updateStockEntry(existingEntry, formData);

			// Update state
			dispatch({ type: 'UPDATE_ENTRY', payload: { id, entry: updatedEntry } });

			// Save to storage
			const updatedEntries = state.entries.map(entry =>
				entry.id === id ? updatedEntry : entry,
			);
			saveStockEntries(updatedEntries);

			return { success: true };
		} catch {
			dispatch({ type: 'SET_ERROR', payload: 'Failed to update entry' });
			return { success: false };
		}
	};

	// Delete stock entry
	const deleteEntry = (id: string) => {
		try {
			// Remove from state
			dispatch({ type: 'DELETE_ENTRY', payload: id });

			// Save to storage
			const updatedEntries = state.entries.filter(entry => entry.id !== id);
			saveStockEntries(updatedEntries);
		} catch {
			dispatch({ type: 'SET_ERROR', payload: 'Failed to delete entry' });
		}
	};

	// Clear all entries
	const clearEntries = () => {
		try {
			dispatch({ type: 'CLEAR_ENTRIES' });
			saveStockEntries([]);
		} catch {
			dispatch({ type: 'SET_ERROR', payload: 'Failed to clear entries' });
		}
	};

	// Update settings
	const updateSettings = (newSettings: Partial<StockContextState['settings']>) => {
		dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
	};

	// Validate entry form data
	const validateEntry = (formData: StockEntryFormData): ValidationError[] => {
		return validateStockEntry(formData);
	};

	const contextValue: StockContextType = {
		state,
		addEntry,
		updateEntry,
		deleteEntry,
		clearEntries,
		updateSettings,
		validateEntry,
	};

	return (
		<StockContext.Provider value={contextValue}>
			{children}
		</StockContext.Provider>
	);
};

// Export context for testing purposes
export { StockContext };
