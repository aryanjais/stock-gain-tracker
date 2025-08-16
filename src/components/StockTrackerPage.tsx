/**
 * Stock Tracker Page Component
 * Main page that combines form and list views with responsive design
 */

import React, { useState } from 'react';
import { StockEntryForm } from './StockEntryForm';
import { StockList } from './StockList';
import { GainLossCalculator } from './GainLossCalculator';
import { PortfolioSummary } from './PortfolioSummary';
import type { StockEntry } from '../types';

type ViewMode = 'list' | 'add' | 'edit' | 'calculator' | 'portfolio';

export const StockTrackerPage: React.FC = () => {
	const [viewMode, setViewMode] = useState<ViewMode>('list');
	const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);

	const handleAddSuccess = () => {
		setViewMode('list');
	};

	const handleCancel = () => {
		setViewMode('list');
		setEditingEntry(null);
	};

	const handleEditEntry = (entry: StockEntry) => {
		setEditingEntry(entry);
		setViewMode('edit');
	};

	// const handleEditSuccess = () => {
	// 	setViewMode('list');
	// 	setEditingEntry(null);
	// };

	return (
		<div className="stock-tracker-page">
			<div className="page-header">
				<div className="header-content">
					<h1>Stock Profit/Loss Tracker</h1>
					<p>Calculate net profit or loss from buying and selling stocks</p>
				</div>

				<div className="header-actions">
					{viewMode === 'list' && (
						<>
							<button
								onClick={() => setViewMode('portfolio')}
								className="btn btn-secondary"
							>
								📊 Portfolio Summary
							</button>
							<button
								onClick={() => setViewMode('calculator')}
								className="btn btn-secondary"
							>
								💰 Net Profit/Loss
							</button>
							<button
								onClick={() => setViewMode('add')}
								className="btn btn-primary"
							>
								+ Add Transaction
							</button>
						</>
					)}
					{viewMode !== 'list' && (
						<button
							onClick={handleCancel}
							className="btn btn-secondary"
						>
							← Back to List
						</button>
					)}
				</div>
			</div>

			<div className="page-content">
				{viewMode === 'list' && (
					<div className="list-view">
						<StockList onEditEntry={handleEditEntry} />
					</div>
				)}

				{viewMode === 'add' && (
					<div className="form-view">
						<StockEntryForm
							onSuccess={handleAddSuccess}
							onCancel={handleCancel}
						/>
					</div>
				)}

				{viewMode === 'edit' && editingEntry && (
					<div className="form-view">
						<div className="edit-header">
							<h2>Edit Transaction</h2>
							<p>Update the details of your stock transaction</p>
						</div>
						{/* TODO: Add EditStockEntryForm component when needed */}
						<div className="edit-placeholder">
							<p>Edit functionality will be implemented in the next iteration.</p>
							<button
								onClick={handleCancel}
								className="btn btn-secondary"
							>
								Cancel
							</button>
						</div>
					</div>
				)}

				{viewMode === 'calculator' && (
					<div className="calculator-view">
						<GainLossCalculator onClose={handleCancel} />
					</div>
				)}

				{viewMode === 'portfolio' && (
					<div className="portfolio-view">
						<PortfolioSummary />
					</div>
				)}
			</div>

			{/* Mobile floating action button */}
			<div className="mobile-fab">
				{viewMode === 'list' && (
					<button
						onClick={() => setViewMode('add')}
						className="fab-button"
						title="Add new transaction"
					>
						+
					</button>
				)}
			</div>
		</div>
	);
};
