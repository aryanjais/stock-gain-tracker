import { StockProvider } from './context/StockContext';
import { StockTrackerPage } from './components/StockTrackerPage';
import './App.css';
import './components.css';

function App() {
	return (
		<StockProvider>
			<div className="app">
				<StockTrackerPage />
			</div>
		</StockProvider>
	);
}

export default App;
