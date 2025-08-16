/**
 * Calculation utilities for Stock Gain Tracker application
 * Handles portfolio analysis, gain/loss calculations, and financial metrics
 *
 * FIFO (First In, First Out) Implementation:
 * - Buy transactions are added to a queue in chronological order
 * - Sell transactions consume shares from the beginning of the queue
 * - This ensures the oldest shares are sold first, providing accurate cost basis
 * - Average cost and unrealized gains/losses are calculated only on remaining shares
 * - More accurate than simple average cost when dealing with partial sales
 */

import type { StockEntry, PortfolioStats, StockPosition } from '../types';
import {
	calculateSharesOwned,
	// calculateAverageCost,
	getUniqueSymbols,
} from './helpers';

/**
 * Calculate current portfolio value (simplified - uses last transaction price)
 * In a real application, this would fetch current market prices
 */
export const calculateCurrentPortfolioValue = (entries: StockEntry[]): number => {
	const uniqueStocks = getUniqueSymbols(entries);
	let totalValue = 0;

	uniqueStocks.forEach(symbol => {
		const sharesOwned = calculateSharesOwned(entries, symbol);
		if (sharesOwned > 0) {
			// Use the most recent buy price for this stock, or last known price if no buy entries
			const buyEntries = entries
				.filter(entry => entry.symbol === symbol && entry.type === 'buy')
				.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

			let priceToUse = 0;
			if (buyEntries.length > 0) {
				// Use the most recent buy price
				priceToUse = buyEntries[0].price;
			} else {
				// Fallback to last known price (shouldn't happen if sharesOwned > 0)
				const lastEntry = entries
					.filter(entry => entry.symbol === symbol)
					.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
				priceToUse = lastEntry?.price || 0;
			}

			if (priceToUse > 0) {
				totalValue += sharesOwned * priceToUse;
			}
		}
	});

	return totalValue;
};

/**
 * Calculate realized profit/loss for a specific stock using FIFO method
 * Only considers shares that have been sold, matching with earliest bought shares
 * Handles sell-before-buy scenarios by using future buy transactions
 */
export const calculateRealizedProfitLossForStock = (stockEntries: StockEntry[]): number => {
	// Sort entries by date
	const sortedEntries = stockEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	let totalRealizedProfitLoss = 0;
	const buyQueue: Array<{quantity: number, price: number, fees: number}> = [];
	const pendingSells: Array<{quantity: number, price: number, fees: number, date: string}> = [];

	sortedEntries.forEach(entry => {
		if (entry.type === 'buy') {
			// Add to buy queue
			buyQueue.push({
				quantity: entry.quantity,
				price: entry.price,
				fees: entry.fees,
			});

			// Process any pending sells that can now be matched
			let i = 0;
			while (i < pendingSells.length) {
				const pendingSell = pendingSells[i];
				let sharesToSell = pendingSell.quantity;
				let costBasis = 0;

				// Try to match with available buy lots
				while (sharesToSell > 0 && buyQueue.length > 0) {
					const buyLot = buyQueue[0];
					const sharesFromThisLot = Math.min(sharesToSell, buyLot.quantity);

					// Calculate cost basis for these shares
					const costPerShare = buyLot.price + (buyLot.fees / buyLot.quantity);
					costBasis += sharesFromThisLot * costPerShare;

					// Update shares to sell and buy queue
					sharesToSell -= sharesFromThisLot;
					buyLot.quantity -= sharesFromThisLot;

					// Remove buy lot if completely used
					if (buyLot.quantity === 0) {
						buyQueue.shift();
					}
				}

				// If we can fully process this pending sell
				if (sharesToSell === 0) {
					const sellProceeds = pendingSell.quantity * pendingSell.price - pendingSell.fees;
					const realizedProfitLoss = sellProceeds - costBasis;
					totalRealizedProfitLoss += realizedProfitLoss;

					// Remove the processed pending sell
					pendingSells.splice(i, 1);
				} else {
					// Update remaining shares to sell
					pendingSells[i] = { ...pendingSell, quantity: sharesToSell };
					i++;
				}
			}
		} else if (entry.type === 'sell') {
			// Process sell transaction
			let sharesToSell = entry.quantity;
			let costBasis = 0;

			// First, try to match with existing buy lots (FIFO)
			while (sharesToSell > 0 && buyQueue.length > 0) {
				const buyLot = buyQueue[0];
				const sharesFromThisLot = Math.min(sharesToSell, buyLot.quantity);

				// Calculate cost basis for these shares
				const costPerShare = buyLot.price + (buyLot.fees / buyLot.quantity);
				costBasis += sharesFromThisLot * costPerShare;

				// Update shares to sell and buy queue
				sharesToSell -= sharesFromThisLot;
				buyLot.quantity -= sharesFromThisLot;

				// Remove buy lot if completely used
				if (buyLot.quantity === 0) {
					buyQueue.shift();
				}
			}

			// If we still have shares to sell, add to pending sells
			if (sharesToSell > 0) {
				pendingSells.push({
					quantity: sharesToSell,
					price: entry.price,
					fees: entry.fees * (sharesToSell / entry.quantity), // Proportional fees
					date: entry.date,
				});
			}

			// Calculate realized profit/loss for the shares we could process immediately
			if (costBasis > 0) {
				const sharesProcessed = entry.quantity - sharesToSell;
				const sellProceeds = sharesProcessed * entry.price - (entry.fees * (sharesProcessed / entry.quantity));
				const realizedProfitLoss = sellProceeds - costBasis;
				totalRealizedProfitLoss += realizedProfitLoss;
			}
		}
	});

	// Process any remaining pending sells (these would be short sales or invalid scenarios)
	// For now, we'll calculate them using the average cost of all buy transactions
	if (pendingSells.length > 0) {
		const allBuyEntries = stockEntries.filter(entry => entry.type === 'buy');
		if (allBuyEntries.length > 0) {
			const totalBuyCost = allBuyEntries.reduce((total, entry) =>
				total + (entry.quantity * entry.price) + entry.fees, 0);
			const totalBuyShares = allBuyEntries.reduce((total, entry) =>
				total + entry.quantity, 0);

			if (totalBuyShares > 0) {
				const averageCostPerShare = totalBuyCost / totalBuyShares;

				pendingSells.forEach(pendingSell => {
					const costBasis = pendingSell.quantity * averageCostPerShare;
					const sellProceeds = pendingSell.quantity * pendingSell.price - pendingSell.fees;
					const realizedProfitLoss = sellProceeds - costBasis;
					totalRealizedProfitLoss += realizedProfitLoss;
				});
			}
		}
	}

	return totalRealizedProfitLoss;
};

/**
 * Calculate FIFO-based average cost for remaining shares
 * This provides more accurate cost basis by tracking which shares remain after sales
 */
export const calculateFIFOAverageCost = (entries: StockEntry[]): number => {
	// Sort entries by date to ensure proper FIFO order
	const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	let totalCostBasis = 0;
	let totalShares = 0;
	const buyQueue: Array<{quantity: number, price: number, fees: number}> = [];

	sortedEntries.forEach(entry => {
		if (entry.type === 'buy') {
			// Add buy transaction to the queue
			buyQueue.push({
				quantity: entry.quantity,
				price: entry.price,
				fees: entry.fees,
			});
		} else if (entry.type === 'sell') {
			// Remove sold shares from the beginning of the queue (FIFO)
			let sharesToSell = entry.quantity;

			while (sharesToSell > 0 && buyQueue.length > 0) {
				const buyLot = buyQueue[0];
				const sharesFromThisLot = Math.min(sharesToSell, buyLot.quantity);

				sharesToSell -= sharesFromThisLot;
				buyLot.quantity -= sharesFromThisLot;

				// Remove buy lot if completely used
				if (buyLot.quantity === 0) {
					buyQueue.shift();
				}
			}
		}
	});

	// Calculate average cost from remaining buy lots
	buyQueue.forEach(lot => {
		totalCostBasis += (lot.quantity * lot.price) + lot.fees;
		totalShares += lot.quantity;
	});

	return totalShares > 0 ? totalCostBasis / totalShares : 0;
};

/**
 * Calculate total cost basis for remaining shares using FIFO method
 * Returns the total amount invested in remaining shares
 */
export const calculateFIFOCostBasis = (entries: StockEntry[]): number => {
	// Sort entries by date to ensure proper FIFO order
	const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	let totalCostBasis = 0;
	const buyQueue: Array<{quantity: number, price: number, fees: number}> = [];

	sortedEntries.forEach(entry => {
		if (entry.type === 'buy') {
			// Add buy transaction to the queue
			buyQueue.push({
				quantity: entry.quantity,
				price: entry.price,
				fees: entry.fees,
			});
		} else if (entry.type === 'sell') {
			// Remove sold shares from the beginning of the queue (FIFO)
			let sharesToSell = entry.quantity;

			while (sharesToSell > 0 && buyQueue.length > 0) {
				const buyLot = buyQueue[0];
				const sharesFromThisLot = Math.min(sharesToSell, buyLot.quantity);

				sharesToSell -= sharesFromThisLot;
				buyLot.quantity -= sharesFromThisLot;

				// Remove buy lot if completely used
				if (buyLot.quantity === 0) {
					buyQueue.shift();
				}
			}
		}
	});

	// Calculate total cost basis from remaining buy lots
	buyQueue.forEach(lot => {
		totalCostBasis += (lot.quantity * lot.price) + lot.fees;
	});

	return totalCostBasis;
};

/**
 * Calculate individual stock positions with enhanced analysis
 */
export const calculateStockPositions = (
	entries: StockEntry[],
	currentMarketPrices?: Record<string, number>,
): StockPosition[] => {
	const uniqueStocks = getUniqueSymbols(entries);

	return uniqueStocks
		.map(symbol => {
			const stockEntries = entries.filter(entry => entry.symbol === symbol);

			// Get stock name from the first entry (all entries for a symbol should have the same stock name)
			const stockName = stockEntries[0]?.stockName || symbol;

			// Calculate bought and sold shares
			const buyEntries = stockEntries.filter(entry => entry.type === 'buy');
			const sellEntries = stockEntries.filter(entry => entry.type === 'sell');

			const totalSharesBought = buyEntries.reduce((total, entry) => total + entry.quantity, 0);
			const totalSharesSold = sellEntries.reduce((total, entry) => total + entry.quantity, 0);
			const sharesOwned = totalSharesBought - totalSharesSold;

			// Calculate total invested and received
			const totalInvested = buyEntries.reduce((total, entry) =>
				total + (entry.quantity * entry.price) + entry.fees, 0);
			const totalReceived = sellEntries.reduce((total, entry) =>
				total + (entry.quantity * entry.price) - entry.fees, 0);

			// Calculate realized profit/loss using FIFO method
			const realizedProfitLoss = calculateRealizedProfitLossForStock(stockEntries);

			// Calculate average cost for remaining shares using FIFO method
			const averageCost = calculateFIFOAverageCost(stockEntries);

			// Calculate cost basis for remaining shares using FIFO method
			const remainingSharesCostBasis = calculateFIFOCostBasis(stockEntries);

			// Calculate current value using provided market prices or 0 if not available
			const currentMarketPrice = currentMarketPrices?.[symbol] || 0;
			const currentValue = sharesOwned > 0 && currentMarketPrice > 0
				? sharesOwned * currentMarketPrice
				: 0;

			// Calculate unrealized gain/loss on remaining shares
			const unrealizedGainLoss = sharesOwned > 0 && currentMarketPrice > 0
				? currentValue - remainingSharesCostBasis
				: 0;

			// Calculate total gain/loss
			const totalGainLoss = realizedProfitLoss + unrealizedGainLoss;

			return {
				symbol,
				stockName,
				totalSharesBought,
				totalSharesSold,
				sharesOwned,
				averageCost,
				totalInvested,
				totalReceived,
				realizedProfitLoss,
				currentValue,
				unrealizedGainLoss,
				totalGainLoss,
				remainingSharesCostBasis,
				transactions: stockEntries,
			};
		}); // Show all stocks traded, including those with remaining shares
};

/**
 * Calculate all stock positions (including those with remaining shares)
 */
export const calculateAllStockPositions = (
	entries: StockEntry[],
	currentMarketPrices?: Record<string, number>,
): StockPosition[] => {
	const uniqueStocks = getUniqueSymbols(entries);

	return uniqueStocks.map(symbol => {
		const stockEntries = entries.filter(entry => entry.symbol === symbol);

		// Get stock name from the first entry (all entries for a symbol should have the same stock name)
		const stockName = stockEntries[0]?.stockName || symbol;

		// Calculate bought and sold shares
		const buyEntries = stockEntries.filter(entry => entry.type === 'buy');
		const sellEntries = stockEntries.filter(entry => entry.type === 'sell');

		const totalSharesBought = buyEntries.reduce((total, entry) => total + entry.quantity, 0);
		const totalSharesSold = sellEntries.reduce((total, entry) => total + entry.quantity, 0);
		const sharesOwned = totalSharesBought - totalSharesSold;

		// Calculate total invested and received
		const totalInvested = buyEntries.reduce((total, entry) =>
			total + (entry.quantity * entry.price) + entry.fees, 0);
		const totalReceived = sellEntries.reduce((total, entry) =>
			total + (entry.quantity * entry.price) - entry.fees, 0);

		// Calculate realized profit/loss using FIFO method
		const realizedProfitLoss = calculateRealizedProfitLossForStock(stockEntries);

		// Calculate average cost for remaining shares using FIFO method
		const averageCost = calculateFIFOAverageCost(stockEntries);

		// Calculate cost basis for remaining shares using FIFO method
		const remainingSharesCostBasis = calculateFIFOCostBasis(stockEntries);

		// Calculate current value using provided market prices or 0 if not available
		const currentMarketPrice = currentMarketPrices?.[symbol] || 0;
		const currentValue = sharesOwned > 0 && currentMarketPrice > 0
			? sharesOwned * currentMarketPrice
			: 0;

		// Calculate unrealized gain/loss on remaining shares
		const unrealizedGainLoss = sharesOwned > 0 && currentMarketPrice > 0
			? currentValue - (sharesOwned * averageCost)
			: 0;

		// Calculate total gain/loss
		const totalGainLoss = realizedProfitLoss + unrealizedGainLoss;

		return {
			symbol,
			stockName,
			totalSharesBought,
			totalSharesSold,
			sharesOwned,
			averageCost,
			totalInvested,
			totalReceived,
			realizedProfitLoss,
			currentValue,
			unrealizedGainLoss,
			totalGainLoss,
			remainingSharesCostBasis,
			transactions: stockEntries,
		};
	});
};

/**
 * Calculate portfolio statistics from stock entries
 */

export const calculatePortfolioStats = (entries: StockEntry[]): PortfolioStats => {
	const uniqueStocks = getUniqueSymbols(entries);
	const totalTransactions = entries.length;

	// Calculate total invested and received
	const buyEntries = entries.filter(entry => entry.type === 'buy');
	const sellEntries = entries.filter(entry => entry.type === 'sell');

	const totalInvested = buyEntries.reduce((total, entry) => {
		return total + (entry.quantity * entry.price) + entry.fees;
	}, 0);

	const totalReceived = sellEntries.reduce((total, entry) => {
		return total + (entry.quantity * entry.price) - entry.fees;
	}, 0);

	// Calculate current value of remaining holdings
	const currentValue = calculateCurrentPortfolioValue(entries);

	// Calculate realized profit/loss from all stocks (FIFO method handles sold shares only)
	const allStockPositions = calculateStockPositions(entries);
	const realizedProfitLoss = allStockPositions.reduce((total, position) =>
		total + position.realizedProfitLoss, 0);

	// Calculate unrealized gain/loss on remaining holdings
	const allPositions = calculateAllStockPositions(entries);
	const unrealizedGainLoss = allPositions
		.filter(position => position.sharesOwned > 0) // Only include stocks with remaining shares
		.reduce((total, position) => total + position.unrealizedGainLoss, 0);

	// Calculate total gain/loss
	const totalGainLoss = realizedProfitLoss + unrealizedGainLoss;
	const gainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

	// Count stocks with current holdings
	const stocksWithHoldings = allPositions.filter(position => position.sharesOwned > 0).length;

	return {
		totalInvested,
		totalReceived,
		realizedProfitLoss,
		currentValue,
		unrealizedGainLoss,
		totalGainLoss,
		gainLossPercentage,
		uniqueStocks: uniqueStocks.length,
		stocksWithHoldings,
		totalTransactions,
	};
};

/**
 * Calculate realized gain/loss from completed transactions
 */
export const calculateRealizedGainLoss = (entries: StockEntry[]): number => {
	const sellEntries = entries.filter(entry => entry.type === 'sell');
	let totalRealizedGainLoss = 0;

	sellEntries.forEach(sellEntry => {
		// Find all buy entries for this stock before the sell date
		const buyEntries = entries.filter(entry =>
			entry.symbol === sellEntry.symbol
			&& entry.type === 'buy'
			&& new Date(entry.date) <= new Date(sellEntry.date),
		);

		// Calculate average cost basis for sold shares
		const totalBuyCost = buyEntries.reduce((total, entry) =>
			total + (entry.quantity * entry.price), 0,
		);
		const totalBuyShares = buyEntries.reduce((total, entry) =>
			total + entry.quantity, 0,
		);

		if (totalBuyShares > 0) {
			const averageCost = totalBuyCost / totalBuyShares;
			const sellProceeds = sellEntry.quantity * sellEntry.price;
			const costBasis = sellEntry.quantity * averageCost;
			const realizedGainLoss = sellProceeds - costBasis;

			totalRealizedGainLoss += realizedGainLoss;
		}
	});

	return totalRealizedGainLoss;
};

/**
 * Calculate total fees paid
 */
export const calculateTotalFees = (entries: StockEntry[]): number => {
	return entries.reduce((total, entry) => total + entry.fees, 0);
};

/**
 * Calculate portfolio performance over time
 */
export const calculatePerformanceOverTime = (
	entries: StockEntry[],
	currentMarketPrices?: Record<string, number>,
): Array<{
	date: string;
	value: number;
	gainLoss: number;
}> => {
	// Get unique dates and sort them
	const dates = [...new Set(entries.map(e => e.date.split('T')[0]))].sort();

	const performance: Array<{
		date: string;
		value: number;
		gainLoss: number;
	}> = [];

	dates.forEach(date => {
		// Get all entries up to this date
		const entriesUpToDate = entries.filter(e => e.date.split('T')[0] <= date);

		// Calculate positions as of this date
		const positions = calculateStockPositions(entriesUpToDate, currentMarketPrices);

		// Calculate total portfolio value and investment
		const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
		const totalInvested = positions.reduce((sum, pos) => sum + pos.totalInvested, 0);

		performance.push({
			date,
			value: totalValue,
			gainLoss: totalValue - totalInvested,
		});
	});

	return performance;
};

/**
 * Calculate best and worst performing stocks
 */
export const calculateBestWorstPerformers = (entries: StockEntry[]): {
	best: StockPosition[];
	worst: StockPosition[];
} => {
	const positions = calculateStockPositions(entries);

	// Sort by total gain/loss
	const sortedPositions = positions.sort((a, b) =>
		b.totalGainLoss - a.totalGainLoss,
	);

	const best = sortedPositions.slice(0, 3);
	const worst = sortedPositions.slice(-3).reverse();

	return { best, worst };
};

/**
 * Calculate portfolio diversification metrics
 */
export const calculateDiversificationMetrics = (entries: StockEntry[]): {
	totalStocks: number;
	largestPosition: StockPosition | null;
	concentrationRisk: number;
} => {
	const positions = calculateStockPositions(entries);

	if (positions.length === 0) {
		return {
			totalStocks: 0,
			largestPosition: null,
			concentrationRisk: 0,
		};
	}

	// Find largest position by current value
	const largestPosition = positions.reduce((largest, current) =>
		current.currentValue > largest.currentValue ? current : largest,
	);

	// Calculate concentration risk (percentage of portfolio in largest position)
	const totalPortfolioValue = positions.reduce((total, position) =>
		total + position.currentValue, 0,
	);

	const concentrationRisk = totalPortfolioValue > 0
		? (largestPosition.currentValue / totalPortfolioValue) * 100
		: 0;

	return {
		totalStocks: positions.length,
		largestPosition,
		concentrationRisk,
	};
};

/**
 * Calculate monthly/yearly returns
 */
export const calculatePeriodicReturns = (entries: StockEntry[]): {
	monthly: Array<{ month: string; return: number }>;
	yearly: Array<{ year: string; return: number }>;
} => {
	const performance = calculatePerformanceOverTime(entries);

	// Group by month and year
	const monthlyData: Record<string, number[]> = {};
	const yearlyData: Record<string, number[]> = {};

	performance.forEach(point => {
		const date = new Date(point.date);
		const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		const yearKey = date.getFullYear().toString();

		if (!monthlyData[monthKey]) {
			monthlyData[monthKey] = [];
		}
		if (!yearlyData[yearKey]) {
			yearlyData[yearKey] = [];
		}

		monthlyData[monthKey].push(point.gainLoss);
		yearlyData[yearKey].push(point.gainLoss);
	});

	const monthly = Object.entries(monthlyData).map(([month, returns]) => ({
		month,
		return: returns[returns.length - 1] || 0, // Use last value of the month
	}));

	const yearly = Object.entries(yearlyData).map(([year, returns]) => ({
		year,
		return: returns[returns.length - 1] || 0, // Use last value of the year
	}));

	return { monthly, yearly };
};

/**
 * Calculate risk metrics (simplified)
 */
export const calculateRiskMetrics = (entries: StockEntry[]): {
	volatility: number;
	maxDrawdown: number;
	sharpeRatio: number;
} => {
	const performance = calculatePerformanceOverTime(entries);

	if (performance.length < 2) {
		return { volatility: 0, maxDrawdown: 0, sharpeRatio: 0 };
	}

	// Calculate daily returns
	const returns = performance.slice(1).map((point, index) => {
		const previousValue = performance[index].value;
		return previousValue > 0 ? (point.value - previousValue) / previousValue : 0;
	});

	// Calculate volatility (standard deviation of returns)
	const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
	const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
	const volatility = Math.sqrt(variance);

	// Calculate maximum drawdown
	let maxDrawdown = 0;
	let peak = performance[0].value;

	performance.forEach(point => {
		if (point.value > peak) {
			peak = point.value;
		}
		const drawdown = peak > 0 ? (peak - point.value) / peak : 0;
		maxDrawdown = Math.max(maxDrawdown, drawdown);
	});

	// Calculate Sharpe ratio (simplified - assuming risk-free rate of 0)
	const sharpeRatio = meanReturn > 0 && volatility > 0 ? meanReturn / volatility : 0;

	return { volatility, maxDrawdown, sharpeRatio };
};
