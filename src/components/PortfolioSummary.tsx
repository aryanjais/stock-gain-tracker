/**
 * Portfolio Summary Component
 * Displays comprehensive portfolio analysis with realized and unrealized gains/losses
 */

import React, { useMemo, useState } from 'react';
import { useStockContext } from '../context/useStockContext';
import { calculatePortfolioStats, calculateStockPositions } from '../utils/calculations';
import { formatCurrency, formatDate } from '../utils/helpers';

interface PortfolioSummaryProps {
	onBack?: () => void;
}

type SortField = 'symbol' | 'stockName' | 'sharesOwned' | 'averageCost' | 'realizedProfitLoss' | 'totalInvested' | 'totalReceived';
type SortDirection = 'asc' | 'desc';

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ onBack }) => {
	const { state } = useStockContext();
	const [sortField, setSortField] = useState<SortField>('symbol');
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
	const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

	const portfolioStats = useMemo(() => {
		return calculatePortfolioStats(state.entries);
	}, [state.entries]);

	const stockPositions = useMemo(() => {
		const positions = calculateStockPositions(state.entries);

		// Sort positions based on current sort settings
		return positions.sort((a, b) => {
			let aValue: string | number;
			let bValue: string | number;

			switch (sortField) {
			case 'symbol':
				aValue = a.symbol.toLowerCase();
				bValue = b.symbol.toLowerCase();
				break;
			case 'stockName':
				aValue = a.stockName.toLowerCase();
				bValue = b.stockName.toLowerCase();
				break;
			case 'sharesOwned':
				aValue = a.sharesOwned;
				bValue = b.sharesOwned;
				break;
			case 'averageCost':
				aValue = a.averageCost;
				bValue = b.averageCost;
				break;
			case 'realizedProfitLoss':
				aValue = a.realizedProfitLoss;
				bValue = b.realizedProfitLoss;
				break;
			case 'totalInvested':
				aValue = a.totalInvested;
				bValue = b.totalInvested;
				break;
			case 'totalReceived':
				aValue = a.totalReceived;
				bValue = b.totalReceived;
				break;
			default:
				aValue = a.symbol.toLowerCase();
				bValue = b.symbol.toLowerCase();
			}

			if (typeof aValue === 'string' && typeof bValue === 'string') {
				return sortDirection === 'asc'
					? aValue.localeCompare(bValue)
					: bValue.localeCompare(aValue);
			} else {
				return sortDirection === 'asc'
					? (aValue as number) - (bValue as number)
					: (bValue as number) - (aValue as number);
			}
		});
	}, [state.entries, sortField, sortDirection]);

	const handleBack = () => {
		if (onBack) {
			onBack();
		} else {
			// Fallback to browser back if no onBack prop provided
			window.history.back();
		}
	};

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
					<button
						className="btn btn-primary"
						onClick={handleBack}
					>
						← Back to Main View
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="portfolio-summary">
			<div className="summary-header">
				<div className="header-content">
					<h2>Portfolio Summary</h2>
					<p>Comprehensive analysis of your stock trading performance</p>
				</div>
				<div className="header-actions">
					<button
						className="btn btn-secondary"
						onClick={handleBack}
					>
						← Back to Main View
					</button>
				</div>
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
					<div className="view-toggle">
						<button
							className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
							onClick={() => setViewMode('cards')}
							title="Card View"
						>
							📱 Cards
						</button>
						<button
							className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
							onClick={() => setViewMode('list')}
							title="List View"
						>
							📋 List
						</button>
					</div>
					<div className="sort-controls">
						<div className="sort-info">
							<span className="sort-label">Sort by:</span>
							<span className="current-sort">
								{sortField === 'symbol' && 'Symbol'}
								{sortField === 'stockName' && 'Stock Name'}
								{sortField === 'sharesOwned' && 'Shares Owned'}
								{sortField === 'averageCost' && 'Average Cost'}
								{sortField === 'realizedProfitLoss' && 'Realized P/L'}
								{sortField === 'totalInvested' && 'Total Invested'}
								{sortField === 'totalReceived' && 'Total Received'}
							</span>
							<span className="sort-direction-indicator">
								{sortDirection === 'asc' ? '↑' : '↓'}
							</span>
						</div>
						<div className="sort-actions">
							<select
								id="sortField"
								value={sortField}
								onChange={(e) => setSortField(e.target.value as SortField)}
								className="sort-field-select"
							>
								<option value="symbol">Symbol (A-Z)</option>
								<option value="stockName">Stock Name (A-Z)</option>
								<option value="sharesOwned">Shares Owned</option>
								<option value="averageCost">Average Cost</option>
								<option value="realizedProfitLoss">Realized P/L</option>
								<option value="totalInvested">Total Invested</option>
								<option value="totalReceived">Total Received</option>
							</select>
							<button
								onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
								className="sort-direction-btn"
								title={`Currently ${sortDirection === 'asc' ? 'ascending' : 'descending'}. Click to reverse.`}
							>
								{sortDirection === 'asc' ? '↑' : '↓'}
							</button>
						</div>
					</div>
				</div>

				{viewMode === 'cards' ? (
					<div className="positions-grid">
						{stockPositions.map((position) => {
							// Get individual transactions for this stock
							const stockTransactions = state.entries
								.filter(entry => entry.symbol === position.symbol)
								.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

							return (
								<div key={position.symbol} className="position-card">
									<div className="position-header">
										<div className="position-title">
											<h4 className="symbol">{position.symbol}</h4>
											<span className="stock-name">{position.stockName}</span>
										</div>
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
				) : (
					<div className="positions-list">
						<div className="list-header-row">
							<div className="list-cell symbol">Symbol</div>
							<div className="list-cell stock-name">Stock Name</div>
							<div className="list-cell shares">Shares Owned</div>
							<div className="list-cell avg-cost">Avg Cost</div>
							<div className="list-cell realized">Realized P/L</div>
							<div className="list-cell invested">Total Invested</div>
							<div className="list-cell received">Total Received</div>
						</div>
						{stockPositions.map((position) => (
							<div key={position.symbol} className="list-row">
								<div className="list-cell symbol">
									<strong>{position.symbol}</strong>
								</div>
								<div className="list-cell stock-name">
									{position.stockName}
								</div>
								<div className="list-cell shares">
									{position.sharesOwned > 0
										? `${position.sharesOwned.toLocaleString()}`
										: 'Fully sold'
									}
								</div>
								<div className="list-cell avg-cost">
									{position.sharesOwned > 0 ? formatCurrency(position.averageCost) : '-'}
								</div>
								<div className={`list-cell realized ${position.realizedProfitLoss >= 0 ? 'positive' : 'negative'}`}>
									{position.realizedProfitLoss !== 0 ? formatCurrency(position.realizedProfitLoss) : '-'}
								</div>
								<div className="list-cell invested">
									{formatCurrency(position.totalInvested)}
								</div>
								<div className="list-cell received">
									{formatCurrency(position.totalReceived)}
								</div>
							</div>
						))}
					</div>
				)}
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
