# Stock Profit/Loss Tracker

A React application for calculating net profit/loss from stock transactions and tracking current holdings.

## Features

- **Stock Transaction Management**: Add buy/sell transactions with detailed information
- **Flexible Stock Symbols**: Support for various symbol formats including spaces, dots, and hyphens (e.g., "BRK.A", "BRK-B", "ALPHABET INC")
- **Net Profit/Loss Calculator**: Calculate realized and unrealized gains/losses
- **Portfolio Summary**: Comprehensive analysis of your investment portfolio
- **Current Holdings Tracking**: See how many shares you still own of each stock
- **Stock Position Analysis**: Detailed breakdown of bought/sold shares per stock

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
- **Symbol**: Stock ticker symbol
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

*Note: All traded stocks are shown, including those with remaining holdings. Realized profit/loss is calculated only for sold shares using FIFO method.*

#### Portfolio Statistics
- **Total Transactions**: Number of all buy/sell transactions
- **Unique Stocks**: Number of different stocks traded
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
- **All traded stocks are displayed**, including those that have been completely sold

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
2. Switch between different views:
   - **Stock List**: View all your transactions
   - **Net Profit/Loss**: Interactive calculator
   - **Portfolio Summary**: Comprehensive portfolio analysis

## Technologies Used

- React 18
- TypeScript
- CSS3 with CSS Variables
- Local Storage for data persistence
- Indian Rupees (₹) for all currency displays
