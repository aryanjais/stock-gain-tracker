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
import type { StockEntry, StockEntryFormData } from '../types';

export const StockTrackerPage: React.FC = () => {
	const [showAddForm, setShowAddForm] = useState(false);
	const [showCSVUpload, setShowCSVUpload] = useState(false);
	const [showPortfolioSummary, setShowPortfolioSummary] = useState(false);
	const [showCalculator, setShowCalculator] = useState(false);
	const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);
	const { state, clearEntries, addEntry } = useStockContext();

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

	const handleLoadSampleData = async () => {
		if (!window.confirm('This will add sample data to your portfolio. Continue?')) return;

		try {
			const baseUrl = import.meta.env.BASE_URL.endsWith('/')
				? import.meta.env.BASE_URL.slice(0, -1)
				: import.meta.env.BASE_URL;

			const response = await fetch(`${baseUrl}/stock%20track.csv`);
			if (!response.ok) throw new Error('Failed to fetch sample data');

			const text = await response.text();
			const rows = text.split('\n').slice(1); // Skip header

			let successCount = 0;

			for (const row of rows) {
				if (!row.trim()) continue;
				const columns = row.split(',');
				// Expected format: Date,Time,Stock Name,Type,Quantity,Price,Status
				if (columns.length < 6) continue;

				const [dateStr, timeStr, stockName, type, qtyStr, priceStr, status] = columns.map(c => c.trim());

				if (!stockName) continue;

				// Try to construct a valid date
				let date = new Date().toISOString();
				try {
					date = new Date(`${dateStr}T${timeStr}:00`).toISOString();
				} catch (e) {
					console.error('Date parse error', e);
				}

				// Generate a simple symbol from the name
				const symbol = stockName.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 8) || 'STOCK';

				const formData: StockEntryFormData = {
					symbol: symbol,
					stockName: stockName,
					type: (type.toLowerCase() === 'buy' ? 'buy' : 'sell') as 'buy' | 'sell',
					quantity: parseFloat(qtyStr),
					price: parseFloat(priceStr),
					date: date,
					fees: 0,
					notes: status || ''
				};

				await addEntry(formData);
				successCount++;
			}

			if (successCount > 0) {
				alert(`Successfully imported ${successCount} sample transactions!`);
			} else {
				alert('No valid transactions found in sample data.');
			}
			
		} catch (e) {
			console.error(e);
			alert('Failed to load sample data. Please check console for details.');
		}
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
					{state.entries.length === 0 && (
						<button
							className="btn btn-secondary"
							onClick={handleLoadSampleData}
						>
							🧪 Try with Sample Data
						</button>
					)}
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
