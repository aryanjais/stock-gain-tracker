/**
 * Custom hook to use the StockContext
 */

import { useContext } from 'react';
import { StockContext } from './StockContext';
import type { StockContextType } from './StockContext';

export const useStockContext = (): StockContextType => {
	const context = useContext(StockContext);
	if (context === undefined) {
		throw new Error('useStockContext must be used within a StockProvider');
	}
	return context;
};
