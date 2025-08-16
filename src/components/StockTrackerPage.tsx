/**
 * Stock Tracker Page Component
 * Main page that combines form and list views with responsive design
 */

import React, { useState } from 'react';
import { StockEntryForm } from './StockEntryForm';
import { EditStockEntryForm } from './EditStockEntryForm';
import { StockList } from './StockList';
import { CSVUpload } from './CSVUpload';
import { PortfolioSummary } from './PortfolioSummary';
import { GainLossCalculator } from './GainLossCalculator';
import { useStockContext } from '../context/useStockContext';
import type { StockEntry } from '../types';

export const StockTrackerPage: React.FC = () => {
	const [showAddForm, setShowAddForm] = useState(false);
	const [showCSVUpload, setShowCSVUpload] = useState(false);
	const [showPortfolioSummary, setShowPortfolioSummary] = useState(false);
	const [showCalculator, setShowCalculator] = useState(false);
	const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);
	const { state, clearEntries } = useStockContext();

	const handleClearAllTrades = () => {
		const confirmed = window.confirm(
			'Are you sure you want to clear all trades? This action cannot be undone and will permanently delete all your stock transaction data.',
		);
		if (confirmed) {
			clearEntries();
		}
	};

	const handleAddSuccess = () => {
		setShowAddForm(false);
		setShowCSVUpload(false);
	};

	const handleEditEntry = (entry: StockEntry) => {
		setEditingEntry(entry);
		setShowAddForm(true);
	};

	const handleEditCancel = () => {
		setEditingEntry(null);
		setShowAddForm(false);
	};

	if (showAddForm) {
		if (editingEntry) {
			return (
				<EditStockEntryForm
					entry={editingEntry}
					onSuccess={handleAddSuccess}
					onCancel={handleEditCancel}
				/>
			);
		}
		return (
			<StockEntryForm
				onSuccess={handleAddSuccess}
				onCancel={handleEditCancel}
			/>
		);
	}

	if (showCSVUpload) {
		return (
			<CSVUpload
				onSuccess={handleAddSuccess}
				onCancel={() => setShowCSVUpload(false)}
			/>
		);
	}

	if (showPortfolioSummary) {
		return (
			<PortfolioSummary onBack={() => setShowPortfolioSummary(false)} />
		);
	}

	if (showCalculator) {
		return (
			<GainLossCalculator onBack={() => setShowCalculator(false)} />
		);
	}

	return (
		<div className="stock-tracker-page">
			<div className="page-header">
				<div className="header-content">
					<h1>Stock Gain Tracker</h1>
					<p>Track your stock investments and calculate gains/losses</p>
				</div>
				<div className="header-actions">
					<button
						className="btn btn-primary"
						onClick={() => setShowAddForm(true)}
					>
						➕ Add Trade
					</button>
					<button
						className="btn btn-secondary"
						onClick={() => setShowCSVUpload(true)}
					>
						📁 Import CSV
					</button>
					<button
						className="btn btn-secondary"
						onClick={() => setShowPortfolioSummary(true)}
					>
						📊 Portfolio Summary
					</button>
					{/* <button
						className="btn btn-secondary"
						onClick={() => setShowCalculator(true)}
					>
						🧮 Calculator
					</button> */}
					{state.entries.length > 0 && (
						<button
							className="btn btn-delete"
							onClick={handleClearAllTrades}
							title="Clear all trades"
						>
							🗑️ Clear All
						</button>
					)}
				</div>
			</div>

			<div className="page-content">
				{!showAddForm && !showCSVUpload && !showPortfolioSummary && !showCalculator && (
					<div className="list-view">
						<StockList onEditEntry={handleEditEntry} />
					</div>
				)}
			</div>

			{/* Mobile floating action button */}
			<div className="mobile-fab">
				{!showAddForm && !showCSVUpload && !showPortfolioSummary && !showCalculator && (
					<button
						onClick={() => setShowAddForm(true)}
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
