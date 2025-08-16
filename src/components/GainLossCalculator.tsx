/**
 * Gain/Loss Calculator Component
 * Allows users to calculate profit/loss for specific stocks
 */

import React, { useState, useMemo } from 'react';
// import type { StockPosition } from '../types';
import { useStockContext } from '../context/useStockContext';
import { calculateStockPositions } from '../utils/calculations';
import { formatCurrency, formatPercentage } from '../utils/helpers';

interface GainLossCalculatorProps {
	onClose?: () => void;
}

export const GainLossCalculator: React.FC<GainLossCalculatorProps> = ({ onClose }) => {
	const { state } = useStockContext();
	const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
	const [showAllStocks, setShowAllStocks] = useState(false);

	// Calculate stock positions
	const positions = useMemo(() => {
		return calculateStockPositions(state.entries);
	}, [state.entries]);

	// Filter positions to show only stocks with shares owned
	const activePositions = positions.filter(position => position.sharesOwned > 0);

	// Calculate total portfolio metrics
	const totalMetrics = useMemo(() => {
		let totalInvested = 0;
		let totalCurrentValue = 0;
		let totalGainLoss = 0;

		activePositions.forEach(position => {
			const currentPrice = currentPrices[position.symbol] || position.averageCost;
			const currentValue = position.sharesOwned * currentPrice;

			totalInvested += position.totalInvested;
			totalCurrentValue += currentValue;
			totalGainLoss += currentValue - position.totalInvested;
		});

		const gainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

		return {
			totalInvested,
			totalCurrentValue,
			totalGainLoss,
			gainLossPercentage,
		};
	}, [activePositions, currentPrices]);

	const handlePriceChange = (symbol: string, price: string) => {
		const numericPrice = parseFloat(price) || 0;
		setCurrentPrices(prev => ({
			...prev,
			[symbol]: numericPrice,
		}));
	};

	const handleResetPrices = () => {
		setCurrentPrices({});
	};

	const displayedPositions = showAllStocks ? activePositions : activePositions.slice(0, 5);

	if (state.loading) {
		return (
			<div className="gain-loss-calculator">
				<div className="loading-state">
					<p>Loading calculator...</p>
				</div>
			</div>
		);
	}

	if (activePositions.length === 0) {
		return (
			<div className="gain-loss-calculator">
				<div className="empty-state">
					<h3>No Active Positions</h3>
					<p>Add some stock purchases to start calculating gains and losses!</p>
				</div>
			</div>
		);
	}

	return (
		<div className="gain-loss-calculator">
			<div className="calculator-header">
				<div className="header-content">
					<h2>Net Profit/Loss Calculator</h2>
					<p>Calculate your net profit or loss by entering current market prices</p>
				</div>
				<div className="header-actions">
					<button
						onClick={handleResetPrices}
						className="btn btn-secondary btn-small"
					>
						Reset Prices
					</button>
					{onClose && (
						<button
							onClick={onClose}
							className="btn btn-secondary btn-small"
						>
							Close
						</button>
					)}
				</div>
			</div>

			{/* Net Profit/Loss Summary */}
			<div className="net-profit-summary">
				<div className="summary-header">
					<h3>Net Profit/Loss Summary</h3>
					<p>Your overall trading performance</p>
				</div>
				<div className="summary-grid">
					<div className="summary-item">
						<span className="label">Total Invested</span>
						<span className="value">{formatCurrency(totalMetrics.totalInvested)}</span>
					</div>
					<div className="summary-item">
						<span className="label">Current Value</span>
						<span className="value">{formatCurrency(totalMetrics.totalCurrentValue)}</span>
					</div>
					<div className="summary-item highlight">
						<span className="label">Net Profit/Loss</span>
						<span className={`value ${totalMetrics.totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
							{formatCurrency(totalMetrics.totalGainLoss)}
						</span>
					</div>
					<div className="summary-item highlight">
						<span className="label">Net Profit/Loss %</span>
						<span className={`value ${totalMetrics.gainLossPercentage >= 0 ? 'positive' : 'negative'}`}>
							{formatPercentage(totalMetrics.gainLossPercentage)}
						</span>
					</div>
				</div>
			</div>

			{/* Stock Positions */}
			<div className="positions-section">
				<div className="section-header">
					<h3>Individual Stock Performance ({activePositions.length})</h3>
					{activePositions.length > 5 && (
						<button
							onClick={() => setShowAllStocks(!showAllStocks)}
							className="btn btn-secondary btn-small"
						>
							{showAllStocks ? 'Show Less' : `Show All (${activePositions.length})`}
						</button>
					)}
				</div>

				<div className="positions-grid">
					{displayedPositions.map((position) => {
						const currentPrice = currentPrices[position.symbol] || position.averageCost;
						const currentValue = position.sharesOwned * currentPrice;
						const gainLoss = currentValue - position.totalInvested;
						const gainLossPercentage = position.totalInvested > 0
							? (gainLoss / position.totalInvested) * 100
							: 0;

						return (
							<div key={position.symbol} className="position-card">
								<div className="position-header">
									<h4 className="symbol">{position.symbol}</h4>
									<span className="shares-owned">
										{position.sharesOwned.toLocaleString()} shares
									</span>
								</div>

								<div className="position-details">
									<div className="detail-row">
										<span className="label">Avg Cost:</span>
										<span className="value">{formatCurrency(position.averageCost)}</span>
									</div>
									<div className="detail-row">
										<span className="label">Total Invested:</span>
										<span className="value">{formatCurrency(position.totalInvested)}</span>
									</div>
									<div className="detail-row">
										<span className="label">Current Price:</span>
										<input
											type="number"
											value={currentPrices[position.symbol] || ''}
											onChange={(e) => handlePriceChange(position.symbol, e.target.value)}
											placeholder={formatCurrency(position.averageCost)}
											className="price-input"
											step="0.01"
											min="0"
										/>
									</div>
									<div className="detail-row">
										<span className="label">Current Value:</span>
										<span className="value">{formatCurrency(currentValue)}</span>
									</div>
									<div className="detail-row highlight">
										<span className="label">Net Profit/Loss:</span>
										<span className={`value ${gainLoss >= 0 ? 'positive' : 'negative'}`}>
											{formatCurrency(gainLoss)}
										</span>
									</div>
									<div className="detail-row highlight">
										<span className="label">Net Profit/Loss %:</span>
										<span className={`value ${gainLossPercentage >= 0 ? 'positive' : 'negative'}`}>
											{formatPercentage(gainLossPercentage)}
										</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Instructions */}
			<div className="calculator-instructions">
				<h4>How to calculate your net profit/loss:</h4>
				<ul>
					<li><strong>Net Profit/Loss = Current Value - Total Invested</strong></li>
					<li>Enter current market prices for your stocks in the "Current Price" fields</li>
					<li>The calculator will automatically update your net profit/loss calculations</li>
					<li>Positive values indicate profit, negative values indicate loss</li>
					<li>Use "Reset Prices" to clear all entered prices</li>
					<li>Only stocks with shares currently owned are shown</li>
				</ul>
			</div>
		</div>
	);
};
