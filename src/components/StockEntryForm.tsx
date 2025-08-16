/**
 * Stock Entry Form Component
 * Responsive form for adding new stock transactions
 */

import React, { useState } from 'react';
import type { StockEntryFormData, ValidationError } from '../types';
import { useStockContext } from '../context/useStockContext';

interface StockEntryFormProps {
	onSuccess?: () => void;
	onCancel?: () => void;
}

export const StockEntryForm: React.FC<StockEntryFormProps> = ({ onSuccess, onCancel }) => {
	const { addEntry, validateEntry } = useStockContext();
	const [formData, setFormData] = useState<StockEntryFormData>({
		symbol: '',
		type: 'buy',
		quantity: 0,
		price: 0,
		date: new Date().toISOString().split('T')[0],
		fees: 0,
		notes: '',
	});
	const [errors, setErrors] = useState<ValidationError[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

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

			// Submit entry
			const result = await addEntry(formData);
			if (result.success) {
				// Reset form
				setFormData({
					symbol: '',
					type: 'buy',
					quantity: 0,
					price: 0,
					date: new Date().toISOString().split('T')[0],
					fees: 0,
					notes: '',
				});
				setErrors([]);
				onSuccess?.();
			} else {
				setErrors(result.errors || []);
			}
		} catch {
			setErrors([{ field: 'general', message: 'Failed to add entry' }]);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getFieldError = (field: string): string | undefined => {
		return errors.find(error => error.field === field)?.message;
	};

	return (
		<div className="stock-entry-form">
			<div className="form-header">
				<h2>Add Stock Transaction</h2>
				<p>Enter the details of your stock purchase or sale</p>
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
				</div>

				<div className="form-row">
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
						{isSubmitting ? 'Adding...' : 'Add Transaction'}
					</button>
				</div>
			</form>
		</div>
	);
};
