/* eslint-disable no-console */
/**
 * Local storage utilities for Stock Gain Tracker application
 * Handles saving and loading data from browser local storage
 */

import type { StockEntry, Portfolio, AppSettings, ExportData } from '../types';

// Storage keys
const STORAGE_KEYS = {
	STOCK_ENTRIES: 'stock_gain_tracker_entries',
	PORTFOLIO: 'stock_gain_tracker_portfolio',
	SETTINGS: 'stock_gain_tracker_settings',
	EXPORT_DATA: 'stock_gain_tracker_export',
} as const;

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
	currency: 'USD',
	dateFormat: 'MMM dd, yyyy',
	numberFormat: 'en-US',
	theme: 'light',
	autoSave: true,
	notifications: true,
};

/**
 * Check if local storage is available
 */
export const isLocalStorageAvailable = (): boolean => {
	try {
		const test = 'test';
		localStorage.setItem(test, test);
		localStorage.removeItem(test);
		return true;
	} catch {
		return false;
	}
};

/**
 * Save stock entries to local storage
 */
export const saveStockEntries = (entries: StockEntry[]): boolean => {
	try {
		if (!isLocalStorageAvailable()) {
			console.warn('Local storage is not available');
			return false;
		}

		localStorage.setItem(STORAGE_KEYS.STOCK_ENTRIES, JSON.stringify(entries));
		return true;
	} catch (error) {
		console.error('Error saving stock entries:', error);
		return false;
	}
};

/**
 * Load stock entries from local storage
 */
export const loadStockEntries = (): StockEntry[] => {
	try {
		if (!isLocalStorageAvailable()) {
			console.warn('Local storage is not available');
			return [];
		}

		const stored = localStorage.getItem(STORAGE_KEYS.STOCK_ENTRIES);
		if (!stored) {
			return [];
		}

		const entries = JSON.parse(stored) as StockEntry[];

		// Validate the loaded data
		if (!Array.isArray(entries)) {
			console.warn('Invalid stock entries data in storage');
			return [];
		}

		// Migrate existing entries to include stockName field if missing
		const migratedEntries = entries.map(entry => {
			if (!entry.stockName) {
				// Set stockName to symbol if missing (for backward compatibility)
				return {
					...entry,
					stockName: entry.symbol,
				};
			}
			return entry;
		});

		return migratedEntries;
	} catch (error) {
		console.error('Error loading stock entries:', error);
		return [];
	}
};

/**
 * Save portfolio data to local storage
 */
export const savePortfolio = (portfolio: Portfolio): boolean => {
	try {
		if (!isLocalStorageAvailable()) {
			console.warn('Local storage is not available');
			return false;
		}

		localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(portfolio));
		return true;
	} catch (error) {
		console.error('Error saving portfolio:', error);
		return false;
	}
};

/**
 * Load portfolio data from local storage
 */
export const loadPortfolio = (): Portfolio | null => {
	try {
		if (!isLocalStorageAvailable()) {
			console.warn('Local storage is not available');
			return null;
		}

		const stored = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
		if (!stored) {
			return null;
		}

		const portfolio = JSON.parse(stored) as Portfolio;

		// Validate the loaded data
		if (!portfolio || typeof portfolio !== 'object') {
			console.warn('Invalid portfolio data in storage');
			return null;
		}

		return portfolio;
	} catch (error) {
		console.error('Error loading portfolio:', error);
		return null;
	}
};

/**
 * Save application settings to local storage
 */
export const saveSettings = (settings: AppSettings): boolean => {
	try {
		if (!isLocalStorageAvailable()) {
			console.warn('Local storage is not available');
			return false;
		}

		localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
		return true;
	} catch (error) {
		console.error('Error saving settings:', error);
		return false;
	}
};

/**
 * Load application settings from local storage
 */
export const loadSettings = (): AppSettings => {
	try {
		if (!isLocalStorageAvailable()) {
			console.warn('Local storage is not available');
			return DEFAULT_SETTINGS;
		}

		const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
		if (!stored) {
			return DEFAULT_SETTINGS;
		}

		const settings = JSON.parse(stored) as AppSettings;

		// Validate and merge with defaults
		return {
			...DEFAULT_SETTINGS,
			...settings,
		};
	} catch (error) {
		console.error('Error loading settings:', error);
		return DEFAULT_SETTINGS;
	}
};

/**
 * Clear all stored data
 */
export const clearAllData = (): boolean => {
	try {
		if (!isLocalStorageAvailable()) {
			console.warn('Local storage is not available');
			return false;
		}

		Object.values(STORAGE_KEYS).forEach(key => {
			localStorage.removeItem(key);
		});

		return true;
	} catch (error) {
		console.error('Error clearing data:', error);
		return false;
	}
};

/**
 * Export data to JSON file
 */
export const exportData = (entries: StockEntry[]): void => {
	try {
		const exportData: ExportData = {
			entries,
			exportDate: new Date().toISOString(),
			version: '1.0.0',
		};

		const dataStr = JSON.stringify(exportData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });

		const link = document.createElement('a');
		link.href = URL.createObjectURL(dataBlob);
		link.download = `stock-gain-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
		link.click();

		URL.revokeObjectURL(link.href);
	} catch (error) {
		console.error('Error exporting data:', error);
		throw new Error('Failed to export data');
	}
};

/**
 * Import data from JSON file
 */
export const importData = (file: File): Promise<StockEntry[]> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (event) => {
			try {
				const content = event.target?.result as string;
				const data = JSON.parse(content) as ExportData;

				// Validate imported data
				if (!data.entries || !Array.isArray(data.entries)) {
					throw new Error('Invalid data format');
				}

				// Validate each entry
				const validEntries = data.entries.filter(entry => {
					return (
						entry.id
						&& entry.symbol
						&& entry.type
						&& entry.quantity
						&& entry.price
						&& entry.date
					);
				});

				if (validEntries.length === 0) {
					throw new Error('No valid entries found in imported data');
				}

				resolve(validEntries);
			} catch {
				reject(new Error('Failed to parse imported data'));
			}
		};

		reader.onerror = () => {
			reject(new Error('Failed to read file'));
		};

		reader.readAsText(file);
	});
};

/**
 * Get storage usage information
 */
export const getStorageInfo = (): { used: number; available: number; percentage: number } => {
	try {
		if (!isLocalStorageAvailable()) {
			return { used: 0, available: 0, percentage: 0 };
		}

		let used = 0;
		Object.values(STORAGE_KEYS).forEach(key => {
			const item = localStorage.getItem(key);
			if (item) {
				used += new Blob([item]).size;
			}
		});

		// Estimate available storage (most browsers have 5-10MB limit)
		const available = 5 * 1024 * 1024; // 5MB estimate
		const percentage = (used / available) * 100;

		return { used, available, percentage };
	} catch (error) {
		console.error('Error getting storage info:', error);
		return { used: 0, available: 0, percentage: 0 };
	}
};

/**
 * Backup data to localStorage with timestamp
 */
export const createBackup = (entries: StockEntry[]): boolean => {
	try {
		if (!isLocalStorageAvailable()) {
			return false;
		}

		const backupKey = `backup_${Date.now()}`;
		const backupData = {
			entries,
			timestamp: new Date().toISOString(),
		};

		localStorage.setItem(backupKey, JSON.stringify(backupData));

		// Keep only the last 5 backups
		const backupKeys = Object.keys(localStorage)
			.filter(key => key.startsWith('backup_'))
			.sort()
			.reverse();

		if (backupKeys.length > 5) {
			backupKeys.slice(5).forEach(key => {
				localStorage.removeItem(key);
			});
		}

		return true;
	} catch (error) {
		console.error('Error creating backup:', error);
		return false;
	}
};
