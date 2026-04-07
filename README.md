# VN Stock Correlation Matrix

Interactive correlation heatmap for Vietnam's top 100 stocks. Enter stock ticker symbols separated by commas to visualize their correlation matrix.

## Features

- Google Search-style interface for quick ticker lookup
- Autocomplete suggestions as you type
- Interactive heatmap with hover details (Plotly.js)
- Color-coded correlation values (-1 to +1)
- Click ticker chips to quickly add stocks

## Tech Stack

- React 19 + TypeScript
- Vite
- Plotly.js (heatmap visualization)
- PapaParse (CSV parsing)

## Development

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

### Option 1: GitHub Actions (automatic)

Push to `main` branch — the workflow at `.github/workflows/deploy.yml` will build and deploy automatically.

> **Setup**: Go to repo Settings → Pages → Source → select **GitHub Actions**.

### Option 2: Manual deploy

```bash
npm run deploy
```

## Data

Correlation matrix computed from daily returns of the top 100 stocks listed on the Vietnam stock exchanges (HOSE, HNX).
