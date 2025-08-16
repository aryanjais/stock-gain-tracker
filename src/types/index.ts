/**
 * TypeScript interfaces for Stock Gain Tracker application
 * Defines all data structures used throughout the application
 */

// Stock transaction types
export type TransactionType = 'buy' | 'sell';

// Stock entry interface - represents a single stock transaction
export interface StockEntry {
	// Unique identifier for the entry
	id: string;

	// Stock symbol (e.g., 'AAPL', 'GOOGL', 'TSLA')
	symbol: string;

	// Type of transaction (buy or sell)
	type: TransactionType;

	// Number of shares traded
	quantity: number;

	// Price per share at the time of transaction
	price: number;

	// Date of the transaction (ISO string format)
	date: string;

	// Transaction fees (brokerage fees, commissions, etc.)
	fees: number;

	// Optional notes about the transaction
	notes?: string;

	// Timestamp when the entry was created
	createdAt: string;

	// Timestamp when the entry was last modified
	updatedAt: string;
}

// Portfolio statistics interface
export interface PortfolioStats {
	// Total amount invested (sum of all buy transactions)
	totalInvested: number;

	// Total amount received from sales
	totalReceived: number;

	// Realized profit/loss from completed trades
	realizedProfitLoss: number;

	// Current estimated value of remaining holdings
	currentValue: number;

	// Unrealized gain/loss on remaining holdings
	unrealizedGainLoss: number;

	// Total gain/loss (realized + unrealized)
	totalGainLoss: number;

	// Gain/loss as a percentage
	gainLossPercentage: number;

	// Number of different stocks in portfolio
	uniqueStocks: number;

	// Number of stocks with current holdings
	stocksWithHoldings: number;

	// Total number of transactions
	totalTransactions: number;
}

// Individual stock position interface
export interface StockPosition {
	// Stock symbol
	symbol: string;

	// Total shares bought
	totalSharesBought: number;

	// Total shares sold
	totalSharesSold: number;

	// Current shares owned (bought - sold)
	sharesOwned: number;

	// Average cost per share for bought shares
	averageCost: number;

	// Total amount invested in this stock (buy transactions)
	totalInvested: number;

	// Total amount received from sales
	totalReceived: number;

	// Realized profit/loss from completed trades
	realizedProfitLoss: number;

	// Current estimated value of remaining shares
	currentValue: number;

	// Unrealized gain/loss on remaining shares
	unrealizedGainLoss: number;

	// Total gain/loss (realized + unrealized)
	totalGainLoss: number;

	// All transactions for this stock
	transactions: StockEntry[];
}

// Portfolio interface - represents the complete portfolio
export interface Portfolio {
	// All stock entries (transactions)
	entries: StockEntry[];

	// Calculated portfolio statistics
	stats: PortfolioStats;

	// Individual stock positions
	positions: StockPosition[];

	// Last updated timestamp
	lastUpdated: string;
}

// Form data interface for adding/editing stock entries
export interface StockEntryFormData {
	symbol: string;
	type: TransactionType;
	quantity: number;
	price: number;
	date: string;
	fees: number;
	notes?: string;
}

// Validation error interface
export interface ValidationError {
	field: string;
	message: string;
}

// API response interface for stock data (future use)
export interface StockApiResponse {
	symbol: string;
	price: number;
	change: number;
	changePercent: number;
	volume: number;
	marketCap: number;
	lastUpdated: string;
}

// Filter and sort options interface
export interface FilterOptions {
	symbol?: string;
	type?: TransactionType;
	dateFrom?: string;
	dateTo?: string;
	minAmount?: number;
	maxAmount?: number;
}

export interface SortOptions {
	field: keyof StockEntry;
	direction: 'asc' | 'desc';
}

// Current holdings interface
export interface CurrentHoldings {
	symbol: string;
	sharesOwned: number;
	averageCost: number;
	totalInvested: number;
	currentValue: number;
	unrealizedGainLoss: number;
}

// Realized profit/loss interface
export interface RealizedProfitLoss {
	symbol: string;
	totalBought: number;
	totalSold: number;
	totalInvested: number;
	totalReceived: number;
	realizedProfitLoss: number;
	realizedProfitLossPercentage: number;
}

// Export/import data interface
export interface ExportData {
	entries: StockEntry[];
	exportDate: string;
	version: string;
}

// Application settings interface
export interface AppSettings {
	currency: string;
	dateFormat: string;
	numberFormat: string;
	theme: 'light' | 'dark';
	autoSave: boolean;
	notifications: boolean;
}
