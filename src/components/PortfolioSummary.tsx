/**
 * Portfolio Summary Component
 * Displays comprehensive portfolio analysis with realized and unrealized gains/losses
 */

import React, { useMemo } from 'react';
import { useStockContext } from '../context/useStockContext';
import { calculatePortfolioStats, calculateStockPositions } from '../utils/calculations';
import { formatCurrency, formatDate } from '../utils/helpers';

export const PortfolioSummary: React.FC = () => {
	const { state } = useStockContext();

	const portfolioStats = useMemo(() => {
		return calculatePortfolioStats(state.entries);
	}, [state.entries]);

	const stockPositions = useMemo(() => {
		return calculateStockPositions(state.entries);
	}, [state.entries]);

	if (state.loading) {
		return (
			<div className="portfolio-summary">
				<div className="loading-state">
					<p>Loading portfolio summary...</p>
				</div>
			</div>
		);
	}

	if (state.entries.length === 0) {
		return (
			<div className="portfolio-summary">
				<div className="empty-state">
					<h3>No Transactions Yet</h3>
					<p>Add your first stock transaction to see portfolio analysis!</p>
				</div>
			</div>
		);
	}

	return (
		<div className="portfolio-summary">
			<div className="summary-header">
				<h2>Portfolio Summary</h2>
				<p>Comprehensive analysis of your stock trading performance</p>
			</div>

			{/* Portfolio Overview */}
			<div className="portfolio-overview">
				<div className="overview-grid">
					<div className="overview-item">
						<span className="label">Total Invested in stocks</span>
						<span className="value">{formatCurrency(portfolioStats.totalInvested)}</span>
					</div>
					<div className="overview-item">
						<span className="label">Total Received from sold stocks</span>
						<span className="value">{formatCurrency(portfolioStats.totalReceived)}</span>
					</div>
					<div className="overview-item highlight">
						<span className="label">Realized Profit/Loss from sold stocks</span>
						<span className={`value ${portfolioStats.realizedProfitLoss >= 0 ? 'positive' : 'negative'}`}>
							{formatCurrency(portfolioStats.realizedProfitLoss)}
						</span>
					</div>
					<div className="overview-item">
						<span className="label">Current Holdings Value (not sold stocks)</span>
						<span className="value">{formatCurrency(portfolioStats.currentValue)}</span>
					</div>
					<div className="overview-item">
						<span className="label">Stocks with Holdings (not sold)</span>
						<span className="value">{portfolioStats.stocksWithHoldings}</span>
					</div>
					<div className="overview-item">
						<span className="label">Total Transactions (buy and sell)</span>
						<span className="value">{portfolioStats.totalTransactions}</span>
					</div>
				</div>
			</div>

			{/* Stock Positions Analysis */}
			<div className="stock-positions">
				<div className="section-header">
					<h3>Stock Positions Analysis</h3>
					<p>{stockPositions.length} stocks traded</p>
				</div>

				<div className="positions-grid">
					{stockPositions.map((position) => {
						// Get individual transactions for this stock
						const stockTransactions = state.entries
							.filter(entry => entry.symbol === position.symbol)
							.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

						return (
							<div key={position.symbol} className="position-card">
								<div className="position-header">
									<h4 className="symbol">{position.symbol}</h4>
									<span className="shares-owned">
										{position.sharesOwned > 0
											? `${position.sharesOwned.toLocaleString()} shares owned`
											: 'Fully sold'
										}
									</span>
								</div>

								{/* Transaction History */}
								<div className="transaction-history">
									<h5>Transaction History</h5>
									<div className="transactions-list">
										{stockTransactions.map((transaction) => (
											<div key={transaction.id} className={`transaction-item ${transaction.type}`}>
												<div className="transaction-header">
													<span className="transaction-type">{transaction.type.toUpperCase()}</span>
													<span className="transaction-date">{formatDate(transaction.date)}</span>
												</div>
												<div className="transaction-details">
													<span className="quantity">{transaction.quantity.toLocaleString()} shares</span>
													<span className="price">at {formatCurrency(transaction.price)}</span>
													<span className="total">Total: {formatCurrency(transaction.quantity * transaction.price)}</span>
												</div>
											</div>
										))}
									</div>
								</div>

								{/* Position Summary */}
								<div className="position-summary">
									<h5>Position Summary</h5>
									<div className="summary-details">
										<div className="summary-row">
											<span className="label">Total Bought:</span>
											<span className="value">{position.totalSharesBought.toLocaleString()} shares</span>
										</div>
										<div className="summary-row">
											<span className="label">Total Sold:</span>
											<span className="value">{position.totalSharesSold.toLocaleString()} shares</span>
										</div>
										<div className="summary-row">
											<span className="label">Total Invested:</span>
											<span className="value">{formatCurrency(position.totalInvested)}</span>
										</div>
										<div className="summary-row">
											<span className="label">Total Received:</span>
											<span className="value">{formatCurrency(position.totalReceived)}</span>
										</div>
										{position.realizedProfitLoss !== 0 && (
											<div className="summary-row highlight">
												<span className="label">Realized P/L:</span>
												<span className={`value ${position.realizedProfitLoss >= 0 ? 'positive' : 'negative'}`}>
													{formatCurrency(position.realizedProfitLoss)}
												</span>
											</div>
										)}
										{position.sharesOwned > 0 && (
											<>
												<div className="summary-row">
													<span className="label">Shares Owned:</span>
													<span className="value">{position.sharesOwned.toLocaleString()} shares</span>
												</div>
												<div className="summary-row">
													<span className="label">Average Cost:</span>
													<span className="value">{formatCurrency(position.averageCost)}</span>
												</div>
											</>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Portfolio Statistics */}
			<div className="portfolio-stats">
				<div className="stats-grid">
					<div className="stat-item">
						<span className="label">Total Transactions</span>
						<span className="value">{portfolioStats.totalTransactions}</span>
					</div>
					<div className="stat-item">
						<span className="label">Unique Stocks</span>
						<span className="value">{portfolioStats.uniqueStocks}</span>
					</div>
					<div className="stat-item">
						<span className="label">Stocks with Holdings</span>
						<span className="value">{portfolioStats.stocksWithHoldings}</span>
					</div>
					<div className="stat-item">
						<span className="label">Fully Sold Stocks</span>
						<span className="value">{portfolioStats.uniqueStocks - portfolioStats.stocksWithHoldings}</span>
					</div>
				</div>
			</div>
		</div>
	);
};
