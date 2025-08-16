/**
 * Stock List Component
 * Displays all stock entries in a responsive table format
 */

import React, { useState, useMemo } from 'react';
import type { StockEntry } from '../types';
import { useStockContext } from '../context/useStockContext';
import { formatCurrency, formatDate } from '../utils/helpers';

interface StockListProps {
	onEditEntry?: (entry: StockEntry) => void;
}

export const StockList: React.FC<StockListProps> = ({ onEditEntry }) => {
	const { state, deleteEntry } = useStockContext();
	const [sortBy, setSortBy] = useState<keyof StockEntry>('date');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [filterSymbol, setFilterSymbol] = useState('');

	// Sort and filter entries
	const sortedEntries = useMemo(() => {
		let filtered = state.entries;

		// Filter by symbol if filter is set
		if (filterSymbol.trim()) {
			filtered = filtered.filter(entry =>
				entry.symbol.toLowerCase().includes(filterSymbol.toLowerCase()),
			);
		}

		// Sort entries
		return filtered.sort((a, b) => {
			const aValue = a[sortBy];
			const bValue = b[sortBy];

			if (typeof aValue === 'string' && typeof bValue === 'string') {
				const comparison = aValue.localeCompare(bValue);
				return sortOrder === 'asc' ? comparison : -comparison;
			}

			if (typeof aValue === 'number' && typeof bValue === 'number') {
				return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
			}

			return 0;
		});
	}, [state.entries, sortBy, sortOrder, filterSymbol]);

	const handleSort = (field: keyof StockEntry) => {
		if (sortBy === field) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortBy(field);
			setSortOrder('desc');
		}
	};

	const handleDelete = (id: string) => {
		if (window.confirm('Are you sure you want to delete this transaction?')) {
			deleteEntry(id);
		}
	};

	const getSortIcon = (field: keyof StockEntry) => {
		if (sortBy !== field) {
			return '↕️';
		}
		return sortOrder === 'asc' ? '↑' : '↓';
	};

	if (state.loading) {
		return (
			<div className="stock-list">
				<div className="loading-state">
					<p>Loading transactions...</p>
				</div>
			</div>
		);
	}

	if (state.entries.length === 0) {
		return (
			<div className="stock-list">
				<div className="empty-state">
					<h3>No Transactions Yet</h3>
					<p>Add your first stock transaction to get started!</p>
				</div>
			</div>
		);
	}

	return (
		<div className="stock-list">
			<div className="list-header">
				<div className="header-content">
					<h2>Stock Transactions</h2>
					<p>{sortedEntries.length} of {state.entries.length} transactions</p>
				</div>

				<div className="list-controls">
					<div className="filter-control">
						<input
							type="text"
							placeholder="Filter by symbol..."
							value={filterSymbol}
							onChange={(e) => setFilterSymbol(e.target.value)}
							className="filter-input"
						/>
					</div>
				</div>
			</div>

			<div className="table-container">
				<table className="stock-table">
					<thead>
						<tr>
							<th onClick={() => handleSort('symbol')} className="sortable">
								Symbol {getSortIcon('symbol')}
							</th>
							<th onClick={() => handleSort('type')} className="sortable">
								Type {getSortIcon('type')}
							</th>
							<th onClick={() => handleSort('quantity')} className="sortable">
								Quantity {getSortIcon('quantity')}
							</th>
							<th onClick={() => handleSort('price')} className="sortable">
								Price {getSortIcon('price')}
							</th>
							<th onClick={() => handleSort('date')} className="sortable">
								Date {getSortIcon('date')}
							</th>
							<th>Total</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{sortedEntries.map((entry) => {
							const total = entry.quantity * entry.price + entry.fees;
							return (
								<tr key={entry.id} className={`entry-row ${entry.type}`}>
									<td className="symbol-cell">
										<span className="symbol">{entry.symbol}</span>
									</td>
									<td className="type-cell">
										<span className={`type-badge ${entry.type}`}>
											{entry.type.toUpperCase()}
										</span>
									</td>
									<td className="quantity-cell">
										{entry.quantity.toLocaleString()}
									</td>
									<td className="price-cell">
										{formatCurrency(entry.price)}
									</td>
									<td className="date-cell">
										{formatDate(entry.date)}
									</td>
									<td className="total-cell">
										{formatCurrency(total)}
									</td>
									<td className="actions-cell">
										<div className="action-buttons">
											{onEditEntry && (
												<button
													onClick={() => onEditEntry(entry)}
													className="btn btn-small btn-edit"
													title="Edit transaction"
												>
													✏️
												</button>
											)}
											<button
												onClick={() => handleDelete(entry.id)}
												className="btn btn-small btn-delete"
												title="Delete transaction"
											>
												🗑️
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Mobile card view for smaller screens */}
			<div className="mobile-cards">
				{sortedEntries.map((entry) => {
					const total = entry.quantity * entry.price + entry.fees;
					return (
						<div key={entry.id} className={`stock-card ${entry.type}`}>
							<div className="card-header">
								<span className="symbol">{entry.symbol}</span>
								<span className={`type-badge ${entry.type}`}>
									{entry.type.toUpperCase()}
								</span>
							</div>
							<div className="card-content">
								<div className="card-row">
									<span className="label">Quantity:</span>
									<span className="value">{entry.quantity.toLocaleString()}</span>
								</div>
								<div className="card-row">
									<span className="label">Price:</span>
									<span className="value">{formatCurrency(entry.price)}</span>
								</div>
								<div className="card-row">
									<span className="label">Date:</span>
									<span className="value">{formatDate(entry.date)}</span>
								</div>
								<div className="card-row">
									<span className="label">Total:</span>
									<span className="value total">{formatCurrency(total)}</span>
								</div>
								{entry.notes && (
									<div className="card-notes">
										<span className="label">Notes:</span>
										<span className="value">{entry.notes}</span>
									</div>
								)}
							</div>
							<div className="card-actions">
								{onEditEntry && (
									<button
										onClick={() => onEditEntry(entry)}
										className="btn btn-small btn-edit"
									>
										Edit
									</button>
								)}
								<button
									onClick={() => handleDelete(entry.id)}
									className="btn btn-small btn-delete"
								>
									Delete
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
