/**
 * CSV Upload Component
 * Allows users to upload CSV files and import stock transactions
 */

import React, { useState, useRef } from 'react';
import { useStockContext } from '../context/useStockContext';
import type { StockEntryFormData } from '../types';

interface CSVUploadProps {
	onSuccess?: () => void;
	onCancel?: () => void;
}

interface CSVRow {
	symbol: string;
	stockName: string;
	type: 'buy' | 'sell';
	quantity: number;
	pricePerShare?: number;
	totalPrice?: number;
	date: string;
	fees?: number;
	notes?: string;
}

export const CSVUpload: React.FC<CSVUploadProps> = ({ onSuccess, onCancel }) => {
	const { addEntry } = useStockContext();
	const [isUploading, setIsUploading] = useState(false);
	const [uploadStatus, setUploadStatus] = useState<{
		success: number;
		errors: string[];
		total: number;
	} | null>(null);
	const [previewData, setPreviewData] = useState<CSVRow[]>([]);
	const [showPreview, setShowPreview] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	/**
	 * Parse date from various formats including dd-mm-yyyy hh:mm am/pm
	 * Supported formats:
	 * - dd-mm-yyyy hh:mm am/pm (e.g., "15-01-2024 10:30 am")
	 * - dd-mm-yyyy hh:mm (e.g., "15-01-2024 14:30")
	 * - dd-mm-yyyy (e.g., "15-01-2024")
	 * - yyyy-mm-dd (e.g., "2024-01-15")
	 * Returns ISO date string or null if invalid
	 */
	const parseDate = (dateString: string): string | null => {
		if (!dateString || typeof dateString !== 'string') {
			return null;
		}

		// Try parsing dd-mm-yyyy hh:mm am/pm format
		const dateTimeRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)$/i;
		const dateTimeMatch = dateString.trim().match(dateTimeRegex);

		if (dateTimeMatch) {
			const [, day, month, year, hour, minute, ampm] = dateTimeMatch;
			let hour24 = parseInt(hour, 10);

			// Convert 12-hour format to 24-hour format
			if (ampm.toLowerCase() === 'pm' && hour24 !== 12) {
				hour24 += 12;
			} else if (ampm.toLowerCase() === 'am' && hour24 === 12) {
				hour24 = 0;
			}

			// Create date object (month is 0-indexed in JavaScript)
			const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), hour24, parseInt(minute, 10));

			// Validate the date
			if (isNaN(date.getTime())) {
				return null;
			}

			return date.toISOString();
		}

		// Try parsing dd-mm-yyyy hh:mm format (24-hour)
		const dateTime24Regex = /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})$/;
		const dateTime24Match = dateString.trim().match(dateTime24Regex);

		if (dateTime24Match) {
			const [, day, month, year, hour, minute] = dateTime24Match;
			const hour24 = parseInt(hour, 10);

			// Validate hour (0-23)
			if (hour24 < 0 || hour24 > 23) {
				return null;
			}

			// Create date object (month is 0-indexed in JavaScript)
			const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), hour24, parseInt(minute, 10));

			// Validate the date
			if (isNaN(date.getTime())) {
				return null;
			}

			return date.toISOString();
		}

		// Try parsing dd-mm-yyyy format
		const dateRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
		const dateMatch = dateString.trim().match(dateRegex);

		if (dateMatch) {
			const [, day, month, year] = dateMatch;
			const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));

			if (isNaN(date.getTime())) {
				return null;
			}

			return date.toISOString();
		}

		// Try parsing standard ISO format (yyyy-mm-dd)
		const isoDate = new Date(dateString);
		if (!isNaN(isoDate.getTime())) {
			return isoDate.toISOString();
		}

		return null;
	};

	/**
	 * Parse CSV file with flexible header mapping
	 * Headers can be in any order as long as the titles match
	 * Required columns: symbol, stockName, type, quantity, price, date
	 * Optional columns: fees, notes
	 */
	const parseCSV = (file: File) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			const rows = text.split('\n');

			// Parse header row to get column mapping
			const headerRow = rows[0].trim();
			if (!headerRow) {
				setUploadStatus({
					success: 0,
					errors: ['CSV file is empty or invalid'],
					total: 0,
				});
				return;
			}

			const headers = headerRow.split(',').map(h => h.trim().replace(/"/g, ''));

			// Create column mapping based on header titles
			const columnMap: Record<string, number> = {};
			const requiredColumns = ['symbol', 'stockName', 'type', 'quantity', 'date'];
			const optionalColumns = ['fees', 'notes', 'pricePerShare', 'totalPrice'];

			// Map required columns
			requiredColumns.forEach(col => {
				const index = headers.findIndex(h => h.toLowerCase() === col.toLowerCase());
				if (index === -1) {
					setUploadStatus({
						success: 0,
						errors: [`Required column '${col}' not found in CSV headers`],
						total: 0,
					});
					return;
				}
				columnMap[col] = index;
			});

			// Map optional columns
			optionalColumns.forEach(col => {
				const index = headers.findIndex(h => h.toLowerCase() === col.toLowerCase());
				if (index !== -1) {
					columnMap[col] = index;
				}
			});

			// Skip header row and parse data
			const data: CSVRow[] = [];
			const errors: string[] = [];

			for (let i = 1; i < rows.length; i++) {
				const row = rows[i].trim();
				if (!row) {
					continue;
				}

				const columns = row.split(',').map(col => col.trim().replace(/"/g, ''));

				try {
					const parsedRow: CSVRow = {
						symbol: columns[columnMap.symbol] || '',
						stockName: columns[columnMap.stockName] || '',
						type: (columns[columnMap.type] || '').toLowerCase() as 'buy' | 'sell',
						quantity: parseFloat(columns[columnMap.quantity]) || 0,
						date: parseDate(columns[columnMap.date]) || '',
						fees: columnMap.fees !== undefined ? parseFloat(columns[columnMap.fees]) || 0 : 0,
						notes: columnMap.notes !== undefined ? columns[columnMap.notes] || '' : '',
					};

					// Determine if pricePerShare or totalPrice is present
					if (columnMap.pricePerShare !== undefined) {
						parsedRow.pricePerShare = parseFloat(columns[columnMap.pricePerShare]) || 0;
					}
					if (columnMap.totalPrice !== undefined) {
						parsedRow.totalPrice = parseFloat(columns[columnMap.totalPrice]) || 0;
					}

					// Calculate pricePerShare from totalPrice if needed
					if (parsedRow.totalPrice !== undefined && parsedRow.totalPrice > 0 && parsedRow.quantity > 0) {
						parsedRow.pricePerShare = parsedRow.totalPrice / parsedRow.quantity;
						delete parsedRow.totalPrice;
					}

					// Validate parsed data
					if (!parsedRow.symbol) {
						errors.push(`Row ${i + 1}: Stock symbol is required`);
						continue;
					}

					if (!parsedRow.stockName) {
						errors.push(`Row ${i + 1}: Stock name is required`);
						continue;
					}

					if (!['buy', 'sell'].includes(parsedRow.type)) {
						errors.push(`Row ${i + 1}: Invalid transaction type (must be 'buy' or 'sell')`);
						continue;
					}

					if (isNaN(parsedRow.quantity) || parsedRow.quantity <= 0) {
						errors.push(`Row ${i + 1}: Invalid quantity`);
						continue;
					}

					if (parsedRow.pricePerShare === undefined && parsedRow.totalPrice === undefined) {
						errors.push(`Row ${i + 1}: Price per share or total price is required`);
						continue;
					}

					if (parsedRow.pricePerShare !== undefined && parsedRow.totalPrice !== undefined) {
						errors.push(`Row ${i + 1}: Cannot have both price per share and total price`);
						continue;
					}

					// Ensure we have a valid price per share for the application
					if (parsedRow.pricePerShare === undefined || parsedRow.pricePerShare <= 0) {
						errors.push(`Row ${i + 1}: Invalid price per share (must be greater than 0)`);
						continue;
					}

					if (!parsedRow.date) {
						errors.push(`Row ${i + 1}: Invalid date format. Supported formats: dd-mm-yyyy, dd-mm-yyyy hh:mm am/pm, dd-mm-yyyy hh:mm, yyyy-mm-dd`);
						continue;
					}

					if (parsedRow.fees && isNaN(parsedRow.fees)) {
						errors.push(`Row ${i + 1}: Invalid fees`);
						continue;
					}

					data.push(parsedRow);
				} catch {
					errors.push(`Row ${i + 1}: Parsing error`);
				}
			}

			if (errors.length > 0) {
				setUploadStatus({
					success: 0,
					errors,
					total: data.length + errors.length,
				});
			} else {
				setPreviewData(data);
				setShowPreview(true);
			}
		};

		reader.readAsText(file);
	};

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			parseCSV(file);
		}
	};

	const handleImport = async() => {
		if (previewData.length === 0) {
			return;
		}

		setIsUploading(true);
		const results = { success: 0, errors: [] as string[], total: previewData.length };

		for (const row of previewData) {
			try {
				const formData: StockEntryFormData = {
					symbol: row.symbol,
					stockName: row.stockName,
					type: row.type,
					quantity: row.quantity,
					price: row.pricePerShare || 0, // Use calculated pricePerShare
					date: row.date,
					fees: row.fees || 0,
					notes: row.notes || '',
				};

				const result = await addEntry(formData);
				if (result.success) {
					results.success++;
				} else {
					results.errors.push(`Failed to import ${row.symbol}: ${result.errors?.map(e => e.message).join(', ')}`);
				}
			} catch (error) {
				results.errors.push(`Error importing ${row.symbol}: ${error}`);
			}
		}

		setUploadStatus(results);
		setIsUploading(false);

		if (results.success > 0) {
			onSuccess?.();
		}
	};

	const handleCancel = () => {
		setPreviewData([]);
		setShowPreview(false);
		setUploadStatus(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
		onCancel?.();
	};

	const downloadTemplate = () => {
		const csvContent = 'symbol,stockName,type,quantity,pricePerShare,totalPrice,date,fees,notes\nAAPL,Apple Inc.,buy,10,150.50,,15-01-2024 10:30 am,5.00,First purchase\nGOOGL,Alphabet Inc.,sell,5,,2800.00,20-01-2024 14:30,3.50,Profit taking\nMSFT,Microsoft Corp.,buy,20,300.00,,15-01-2024 11:00 am,7.50,Technology investment';
		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'stock_transactions_template.csv';
		a.click();
		window.URL.revokeObjectURL(url);
	};

	return (
		<div className="csv-upload">
			<div className="form-header">
				<h2>Import Stock Transactions</h2>
				<p>Upload a CSV file to import multiple stock transactions at once</p>
			</div>

			<div className="form">
				{!showPreview && (
					<div className="upload-section">
						<div className="upload-instructions">
							<h3>CSV Format Requirements</h3>
							<p>Your CSV file should have the following columns (order doesn't matter):</p>
							<ul>
								<li><strong>symbol</strong> - Stock symbol (e.g., AAPL, GOOGL)</li>
								<li><strong>stockName</strong> - Company name (e.g., Apple Inc., Alphabet Inc.)</li>
								<li><strong>type</strong> - Transaction type (buy or sell)</li>
								<li><strong>quantity</strong> - Number of shares</li>
								<li><strong>pricePerShare</strong> - Price per share (e.g., 150.50) <em>OR</em></li>
								<li><strong>totalPrice</strong> - Total transaction value (e.g., 1505.00)</li>
								<li><strong>date</strong> - Transaction date (supported formats: dd-mm-yyyy, dd-mm-yyyy hh:mm am/pm, dd-mm-yyyy hh:mm, yyyy-mm-dd)</li>
								<li><strong>fees</strong> - Transaction fees (optional)</li>
								<li><strong>notes</strong> - Additional notes (optional)</li>
							</ul>
							<p className="format-note">
								<strong>Note:</strong> Column order doesn't matter as long as the header titles match exactly.
								The system will automatically map columns based on their headers.
							</p>
							<p className="price-note">
								<strong>Price Information:</strong> You can provide either <strong>pricePerShare</strong> (price per individual share)
								or <strong>totalPrice</strong> (total transaction value), but not both. When totalPrice is provided,
								the system automatically calculates pricePerShare by dividing totalPrice by quantity for application storage.
							</p>
							<p className="date-note">
								<strong>Date Formats:</strong> The system supports multiple date formats including 12-hour (am/pm) and 24-hour time formats.
								Examples: "15-01-2024 10:30 am", "15-01-2024 14:30", "15-01-2024", "2024-01-15"
							</p>

							<div className="template-download">
								<button
									type="button"
									onClick={downloadTemplate}
									className="btn btn-secondary"
								>
									📥 Download Template
								</button>
							</div>
						</div>

						<div className="file-upload">
							<input
								ref={fileInputRef}
								type="file"
								accept=".csv"
								onChange={handleFileSelect}
								className="file-input"
								id="csv-file"
							/>
							<label htmlFor="csv-file" className="file-label">
								<div className="upload-icon">📁</div>
								<div className="upload-text">
									<span className="primary-text">Choose a CSV file</span>
									<span className="secondary-text">or drag and drop here</span>
								</div>
							</label>
						</div>
					</div>
				)}

				{showPreview && (
					<div className="preview-section">
						<h3>Preview Data ({previewData.length} transactions)</h3>
						<p className="preview-note">
							<strong>Note:</strong> When total price is provided, it's automatically converted to price per share for the application.
						</p>
						<div className="preview-table">
							<table>
								<thead>
									<tr>
										<th>Symbol</th>
										<th>Type</th>
										<th>Quantity</th>
										<th>Price Per Share</th>
										<th>Date</th>
										<th>Fees</th>
									</tr>
								</thead>
								<tbody>
									{previewData.slice(0, 10).map((row, index) => (
										<tr key={index}>
											<td>{row.symbol}</td>
											<td>
												<span className={`type-badge ${row.type}`}>
													{row.type}
												</span>
											</td>
											<td>{row.quantity}</td>
											<td>₹{row.pricePerShare ? row.pricePerShare.toFixed(2) : 'N/A'}</td>
											<td>{row.date}</td>
											<td>{row.fees ? `₹${row.fees.toFixed(2)}` : '-'}</td>
										</tr>
									))}
								</tbody>
							</table>
							{previewData.length > 10 && (
								<p className="preview-note">
									Showing first 10 rows. Total: {previewData.length} transactions.
								</p>
							)}
						</div>
					</div>
				)}

				{uploadStatus && (
					<div className={`upload-status ${uploadStatus.success > 0 ? 'success' : 'error'}`}>
						<h3>Import Results</h3>
						<div className="status-summary">
							<p>
								<strong>Successfully imported:</strong> {uploadStatus.success} transactions
							</p>
							<p>
								<strong>Total processed:</strong> {uploadStatus.total} transactions
							</p>
						</div>

						{uploadStatus.errors.length > 0 && (
							<div className="error-details">
								<h4>Errors ({uploadStatus.errors.length}):</h4>
								<ul>
									{uploadStatus.errors.map((error, index) => (
										<li key={index}>{error}</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}

				<div className="form-actions">
					<button
						type="button"
						onClick={handleCancel}
						className="btn btn-secondary"
						disabled={isUploading}
					>
						{uploadStatus ? 'Close' : 'Cancel'}
					</button>

					{showPreview && !uploadStatus && (
						<button
							type="button"
							onClick={handleImport}
							className="btn btn-primary"
							disabled={isUploading}
						>
							{isUploading ? 'Importing...' : `Import ${previewData.length} Transactions`}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};
