/**
 * Utility functions for Stock Gain Tracker application
 * Helper functions for data manipulation, validation, and formatting
 */

import type { StockEntry, StockEntryFormData, ValidationError, TransactionType } from '../types';

/**
 * Generate a unique ID for stock entries
 */
export const generateId = (): string => {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Format currency values
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: currency,
	}).format(amount);
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number): string => {
	return new Intl.NumberFormat('en-US', {
		style: 'percent',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value / 100);
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
	const date = new Date(dateString);
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).format(date);
};

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toISOString().split('T')[0];
};

/**
 * Get current date in ISO format
 */
export const getCurrentDate = (): string => {
	return new Date().toISOString();
};

/**
 * Validate stock symbol format
 */
export const validateSymbol = (symbol: string): boolean => {
	// More flexible validation: 1-20 characters, letters, numbers, spaces, dots, and hyphens allowed
	// Examples: AAPL, BRK.A, BRK-B, "BRK B", "ALPHABET INC"
	const symbolRegex = /^[A-Z0-9\s.-]{1,20}$/i;
	return symbolRegex.test(symbol.trim());
};

/**
 * Validate stock entry form data
 */
export const validateStockEntry = (data: StockEntryFormData): ValidationError[] => {
	const errors: ValidationError[] = [];

	// Validate symbol
	if (!data.symbol.trim()) {
		errors.push({ field: 'symbol', message: 'Stock symbol is required' });
	} else if (!validateSymbol(data.symbol)) {
		errors.push({ field: 'symbol', message: 'Invalid stock symbol format' });
	}

	// Validate quantity
	if (data.quantity <= 0) {
		errors.push({ field: 'quantity', message: 'Quantity must be greater than 0' });
	}

	// Validate price
	if (data.price <= 0) {
		errors.push({ field: 'price', message: 'Price must be greater than 0' });
	}

	// Validate date
	if (!data.date) {
		errors.push({ field: 'date', message: 'Date is required' });
	} else {
		const selectedDate = new Date(data.date);
		const currentDate = new Date();
		if (selectedDate > currentDate) {
			errors.push({ field: 'date', message: 'Date cannot be in the future' });
		}
	}

	// Validate fees
	if (data.fees < 0) {
		errors.push({ field: 'fees', message: 'Fees cannot be negative' });
	}

	return errors;
};

/**
 * Create a new stock entry from form data
 */
export const createStockEntry = (formData: StockEntryFormData): StockEntry => {
	const now = getCurrentDate();

	return {
		id: generateId(),
		symbol: formData.symbol.trim(), // Preserve original format including spaces
		type: formData.type,
		quantity: formData.quantity,
		price: formData.price,
		date: formData.date,
		fees: formData.fees || 0,
		notes: formData.notes?.trim() || undefined,
		createdAt: now,
		updatedAt: now,
	};
};

/**
 * Update an existing stock entry
 */
export const updateStockEntry = (entry: StockEntry, updates: Partial<StockEntryFormData>): StockEntry => {
	return {
		...entry,
		...updates,
		symbol: updates.symbol ? updates.symbol.trim() : entry.symbol, // Preserve original format including spaces
		notes: updates.notes?.trim() || entry.notes,
		updatedAt: getCurrentDate(),
	};
};

/**
 * Calculate total transaction amount (quantity * price + fees)
 */
export const calculateTransactionAmount = (entry: StockEntry): number => {
	return entry.quantity * entry.price + entry.fees;
};

/**
 * Calculate total amount for multiple entries
 */
export const calculateTotalAmount = (entries: StockEntry[]): number => {
	return entries.reduce((total, entry) => total + calculateTransactionAmount(entry), 0);
};

/**
 * Filter entries by symbol
 */
export const filterEntriesBySymbol = (entries: StockEntry[], symbol: string): StockEntry[] => {
	return entries.filter(entry =>
		entry.symbol.toLowerCase().includes(symbol.toLowerCase()),
	);
};

/**
 * Filter entries by transaction type
 */
export const filterEntriesByType = (entries: StockEntry[], type: TransactionType): StockEntry[] => {
	return entries.filter(entry => entry.type === type);
};

/**
 * Filter entries by date range
 */
export const filterEntriesByDateRange = (
	entries: StockEntry[],
	startDate: string,
	endDate: string,
): StockEntry[] => {
	return entries.filter(entry => {
		const entryDate = new Date(entry.date);
		const start = new Date(startDate);
		const end = new Date(endDate);
		return entryDate >= start && entryDate <= end;
	});
};

/**
 * Sort entries by field
 */
export const sortEntries = (
	entries: StockEntry[],
	field: keyof StockEntry,
	direction: 'asc' | 'desc' = 'desc',
): StockEntry[] => {
	return [...entries].sort((a, b) => {
		let aValue = a[field];
		let bValue = b[field];

		// Handle date comparison
		if (field === 'date' || field === 'createdAt' || field === 'updatedAt') {
			aValue = new Date(aValue as string).getTime();
			bValue = new Date(bValue as string).getTime();
		}

		// Handle string comparison
		if (typeof aValue === 'string' && typeof bValue === 'string') {
			aValue = aValue.toLowerCase();
			bValue = bValue.toLowerCase();
		}

		// Handle possible undefined values for aValue and bValue
		if (aValue === undefined && bValue === undefined) {
			return 0;
		}
		if (aValue === undefined) {
			return direction === 'asc' ? 1 : -1;
		}
		if (bValue === undefined) {
			return direction === 'asc' ? -1 : 1;
		}

		if (direction === 'asc') {
			return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
		} else {
			return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		}
	});
};

/**
 * Get unique symbols from entries
 */
export const getUniqueSymbols = (entries: StockEntry[]): string[] => {
	const symbols = entries.map(entry => entry.symbol);
	return [...new Set(symbols)].sort();
};

/**
 * Calculate total shares owned for a symbol
 */
export const calculateSharesOwned = (entries: StockEntry[], symbol: string): number => {
	return entries
		.filter(entry => entry.symbol === symbol)
		.reduce((total, entry) => {
			if (entry.type === 'buy') {
				return total + entry.quantity;
			} else {
				return total - entry.quantity;
			}
		}, 0);
};

/**
 * Calculate average cost per share for a symbol
 */
export const calculateAverageCost = (entries: StockEntry[], symbol: string): number => {
	const buyEntries = entries.filter(entry =>
		entry.symbol === symbol && entry.type === 'buy',
	);

	if (buyEntries.length === 0) {
		return 0;
	}

	const totalCost = buyEntries.reduce((total, entry) =>
		total + (entry.quantity * entry.price), 0,
	);
	const totalShares = buyEntries.reduce((total, entry) =>
		total + entry.quantity, 0,
	);

	return totalCost / totalShares;
};

/**
 * Deep clone an object (for immutable updates)
 */
export const deepClone = <T>(obj: T): T => {
	return JSON.parse(JSON.stringify(obj));
};
