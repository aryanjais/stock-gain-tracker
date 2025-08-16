# Stock Profit/Loss Tracker

A React application for calculating net profit/loss from stock transactions and tracking current holdings.

## Features

- **Stock Transaction Management**: Add, edit, and delete individual stock transactions
- **Stock Name Tracking**: Store both stock symbols and company names for better identification
- **Flexible CSV Import**: Import multiple transactions with flexible column ordering and multiple date formats
- **Portfolio Analysis**: Comprehensive portfolio summary with realized and unrealized gains/losses
- **Gain/Loss Calculator**: Calculate profit/loss for specific stocks with current market prices
- **Data Persistence**: All data is automatically saved to local storage
- **Clear All Trades**: Option to clear all transaction data with confirmation dialog
- **Responsive Design**: Works seamlessly on both mobile and desktop devices

## Transaction Management

### Adding Transactions
- Fill out the transaction form with stock symbol, stock name, type (buy/sell), quantity, price, date, fees, and optional notes
- Stock symbols support various formats including spaces, dots, and hyphens
- Stock names store the full company name for better identification
- All fields are validated to ensure data integrity

### Editing Transactions
- Click the edit button (✏️) on any transaction in the list view
- Modify any field including stock symbol, stock name, transaction type, quantity, price, date, fees, or notes
- Changes are automatically saved and reflected in all calculations
- Edit mode provides the same validation as the add form

### Importing Transactions (CSV)

The application supports importing multiple stock transactions at once using CSV files. The CSV import feature includes:

- **Flexible Column Ordering**: Headers can be in any order as long as the titles match exactly
- **Multiple Date Formats**: Supports dd-mm-yyyy, dd-mm-yyyy hh:mm am/pm, and yyyy-mm-dd formats
- **Flexible Price Input**: You can provide either `pricePerShare` (price per individual share) or `totalPrice` (total transaction value)
- **Required Columns**: symbol, stockName, type, quantity, date
- **Optional Columns**: fees, notes, pricePerShare, totalPrice
- **Data Validation**: Comprehensive validation with detailed error reporting
- **Preview Mode**: Review data before importing
- **Template Download**: Get a sample CSV file to understand the format

**Price Information**: When importing, you can provide either price per share or total price, but not both. The system will automatically calculate the missing value based on the quantity.

**Date Formats Supported**:
- `15-01-2024` (dd-mm-yyyy)
- `15-01-2024 10:30 am` (dd-mm-yyyy hh:mm am/pm)
- `2024-01-15` (yyyy-mm-dd)

## User Story: Portfolio Summary

### As a stock investor
I want to view a comprehensive summary of my investment portfolio
So that I can understand my overall financial performance and make informed investment decisions

### Acceptance Criteria

**Given** I have added multiple buy and sell transactions for various stocks
**When** I navigate to the "Portfolio Summary" view
**Then** I should see a comprehensive overview of my investment portfolio

### Detailed Requirements

#### Portfolio Overview Section
- **Total Invested**: Sum of all money spent on buying stocks (including fees) in ₹
- **Total Received**: Sum of all money received from selling stocks in ₹
- **Realized Profit/Loss**: Net profit or loss from completed buy/sell transactions in ₹
- **Current Holdings Value**: Total value of stocks I still own, calculated using most recent buy prices in ₹
- **Unrealized Gain/Loss**: Potential profit/loss on stocks I still hold in ₹
- **Total Gain/Loss**: Combined realized and unrealized profit/loss in ₹

#### Stock Positions Analysis
For each stock that has been traded:
- **Name**: Stock name/ticker
- **Total Shares Bought**: Total shares purchased across all transactions
- **Total Shares Sold**: Total shares sold across all transactions
- **Shares Owned**: Current shares remaining (0 if completely sold)
- **Total Invested**: Total money spent buying this stock (including fees) in ₹
- **Total Received**: Total money received from selling this stock in ₹
- **Realized Profit/Loss**: Net profit/loss from sold shares using FIFO method in ₹
- **Average Cost**: Average price paid per share for bought shares in ₹
- **Current Value**: Estimated value of remaining shares in ₹
- **Unrealized Gain/Loss**: Potential profit/loss on remaining shares in ₹
- **Total Gain/Loss**: Combined realized and unrealized for this stock in ₹

*Note: All traded stock names are shown, including those with remaining holdings. Realized profit/loss is calculated only for sold shares using FIFO method.*

#### Portfolio Statistics
- **Total Transactions**: Number of all buy/sell transactions
- **Unique Stock Names**: Number of different stock names traded
- **Stocks with Holdings**: Number of stocks I still own shares in
- **Overall Return**: Percentage return on total investment

### Business Rules
- **Realized profit/loss is calculated using FIFO (First-In-First-Out) method** - sold shares are matched with the earliest bought shares
- **Only completely sold stocks are included in realized profit/loss calculations** (shares owned = 0)
- **Current Holdings Value only includes stocks with remaining shares (shares owned > 0)**
- **Current Holdings Value uses the most recent buy price for each stock** to provide accurate valuation
- Unrealized gain/loss is calculated on remaining shares using current market prices
- Average cost is calculated only from buy transactions
- All calculations include transaction fees
- Positive values indicate profit, negative values indicate loss
- **All traded stock names are displayed**, including those that have been completely sold

### User Experience
- Key profit/loss figures are highlighted for easy identification
- Responsive design works on both mobile and desktop
- Clear visual hierarchy with sections and subsections
- Loading states for better user experience
- Empty state when no transactions exist

## Installation

```bash
npm install
npm run dev
```

## Usage

1. Add your stock transactions using the form
2. Edit existing transactions by clicking the edit button (✏️) in the list view
3. Import multiple transactions at once using the CSV upload feature
4. Switch between different views:
   - **Stock List**: View all your transactions
   - **Net Profit/Loss**: Interactive calculator
   - **Portfolio Summary**: Comprehensive portfolio analysis

## Technologies Used

- React 18
- TypeScript
- CSS3 with CSS Variables
- Local Storage for data persistence
- Indian Rupees (₹) for all currency displays
