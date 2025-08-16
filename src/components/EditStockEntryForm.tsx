/**
 * Edit Stock Entry Form Component
 * Form for editing existing stock transactions
 */

import React, { useState, useEffect } from 'react';
import type { StockEntry, StockEntryFormData, ValidationError } from '../types';
import { useStockContext } from '../context/useStockContext';

interface EditStockEntryFormProps {
	entry: StockEntry;
	onSuccess?: () => void;
	onCancel?: () => void;
}

export const EditStockEntryForm: React.FC<EditStockEntryFormProps> = ({ entry, onSuccess, onCancel }) => {
	const { updateEntry, validateEntry } = useStockContext();
	const [formData, setFormData] = useState<StockEntryFormData>({
		symbol: entry.symbol,
		stockName: entry.stockName,
		type: entry.type,
		quantity: entry.quantity,
		price: entry.price,
		date: entry.date,
		fees: entry.fees,
		notes: entry.notes || '',
	});
	const [errors, setErrors] = useState<ValidationError[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Update form data when entry changes
	useEffect(() => {
		setFormData({
			symbol: entry.symbol,
			stockName: entry.stockName,
			type: entry.type,
			quantity: entry.quantity,
			price: entry.price,
			date: entry.date,
			fees: entry.fees,
			notes: entry.notes || '',
		});
	}, [entry]);

	const handleInputChange = (field: keyof StockEntryFormData, value: string | number) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		// Clear field-specific error when user starts typing
		setErrors(prev => prev.filter(error => error.field !== field));
	};

	const handleSubmit = async(e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			// Validate form data
			const validationErrors = validateEntry(formData);
			if (validationErrors.length > 0) {
				setErrors(validationErrors);
				return;
			}

			// Update entry
			const result = await updateEntry(entry.id, formData);
			if (result.success) {
				onSuccess?.();
			} else {
				setErrors(result.errors || []);
			}
		} catch {
			setErrors([{ field: 'general', message: 'Failed to update entry' }]);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getFieldError = (field: string): string | undefined => {
		return errors.find(error => error.field === field)?.message;
	};

	return (
		<div className="edit-stock-entry-form">
			<div className="form-header">
				<h2>Edit Stock Transaction</h2>
				<p>Update the details of your stock transaction</p>
			</div>

			<form onSubmit={handleSubmit} className="form">
				{getFieldError('general') && (
					<div className="error-message general-error">
						{getFieldError('general')}
					</div>
				)}

				<div className="form-row">
					<div className="form-group">
						<label htmlFor="symbol">Stock Symbol *</label>
						<input
							type="text"
							id="symbol"
							value={formData.symbol}
							onChange={(e) => handleInputChange('symbol', e.target.value)}
							placeholder="e.g., AAPL, BRK.A, BRK-B, ALPHABET INC"
							className={getFieldError('symbol') ? 'error' : ''}
							required
						/>
						{getFieldError('symbol') && (
							<span className="error-text">{getFieldError('symbol')}</span>
						)}
					</div>

					<div className="form-group">
						<label htmlFor="stockName">Stock Name *</label>
						<input
							type="text"
							id="stockName"
							value={formData.stockName}
							onChange={(e) => handleInputChange('stockName', e.target.value)}
							placeholder="e.g., Apple Inc., Berkshire Hathaway Inc."
							className={getFieldError('stockName') ? 'error' : ''}
							required
						/>
						{getFieldError('stockName') && (
							<span className="error-text">{getFieldError('stockName')}</span>
						)}
					</div>
				</div>

				<div className="form-row">
					<div className="form-group">
						<label htmlFor="type">Transaction Type *</label>
						<select
							id="type"
							value={formData.type}
							onChange={(e) => handleInputChange('type', e.target.value as 'buy' | 'sell')}
							className={getFieldError('type') ? 'error' : ''}
						>
							<option value="buy">Buy</option>
							<option value="sell">Sell</option>
						</select>
						{getFieldError('type') && (
							<span className="error-text">{getFieldError('type')}</span>
						)}
					</div>

					<div className="form-group">
						<label htmlFor="quantity">Quantity *</label>
						<input
							type="number"
							id="quantity"
							value={formData.quantity || ''}
							onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
							placeholder="Number of shares"
							min="0"
							step="0.01"
							className={getFieldError('quantity') ? 'error' : ''}
							required
						/>
						{getFieldError('quantity') && (
							<span className="error-text">{getFieldError('quantity')}</span>
						)}
					</div>
				</div>

				<div className="form-row">
					<div className="form-group">
						<label htmlFor="price">Price per Share *</label>
						<input
							type="number"
							id="price"
							value={formData.price || ''}
							onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
							placeholder="Price per share"
							min="0"
							step="0.01"
							className={getFieldError('price') ? 'error' : ''}
							required
						/>
						{getFieldError('price') && (
							<span className="error-text">{getFieldError('price')}</span>
						)}
					</div>
				</div>

				<div className="form-row">
					<div className="form-group">
						<label htmlFor="date">Transaction Date *</label>
						<input
							type="date"
							id="date"
							value={formData.date}
							onChange={(e) => handleInputChange('date', e.target.value)}
							className={getFieldError('date') ? 'error' : ''}
							required
						/>
						{getFieldError('date') && (
							<span className="error-text">{getFieldError('date')}</span>
						)}
					</div>

					<div className="form-group">
						<label htmlFor="fees">Fees</label>
						<input
							type="number"
							id="fees"
							value={formData.fees || ''}
							onChange={(e) => handleInputChange('fees', parseFloat(e.target.value) || 0)}
							placeholder="Transaction fees"
							min="0"
							step="0.01"
							className={getFieldError('fees') ? 'error' : ''}
						/>
						{getFieldError('fees') && (
							<span className="error-text">{getFieldError('fees')}</span>
						)}
					</div>
				</div>

				<div className="form-group full-width">
					<label htmlFor="notes">Notes (Optional)</label>
					<textarea
						id="notes"
						value={formData.notes}
						onChange={(e) => handleInputChange('notes', e.target.value)}
						placeholder="Add any additional notes about this transaction..."
						rows={3}
						className={getFieldError('notes') ? 'error' : ''}
					/>
					{getFieldError('notes') && (
						<span className="error-text">{getFieldError('notes')}</span>
					)}
				</div>

				<div className="form-actions">
					<button
						type="button"
						onClick={onCancel}
						className="btn btn-secondary"
						disabled={isSubmitting}
					>
						Cancel
					</button>
					<button
						type="submit"
						className="btn btn-primary"
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Updating...' : 'Update Transaction'}
					</button>
				</div>
			</form>
		</div>
	);
};
