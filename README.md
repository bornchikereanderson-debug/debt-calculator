# Debt Calculator

A production-ready MVP web app for comparing debt snowball and debt avalanche payoff strategies. Users can enter multiple debts, add an extra monthly payment, and see projected payoff dates, total interest, months until debt free, and payoff charts.

## Tech Stack

- Next.js latest
- TypeScript
- Tailwind CSS
- Recharts
- Browser-only calculations
- `localStorage` persistence

## Features

- Add, edit, and remove debts
- Track creditor name, balance, APR, and minimum payment for each debt
- Enter an extra monthly payment
- Compare snowball and avalanche methods side by side
- See total debt, total monthly minimums, payoff date, total interest paid, and months until debt free
- View remaining balance over time in a responsive chart
- Save data automatically in the browser
- No login and no database

## Getting Started

### 1. Install Node.js

Install the latest LTS version of Node.js from [nodejs.org](https://nodejs.org/).

Verify installation:

```bash
node --version
npm --version
```

### 2. Install dependencies

From the project directory:

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run checks

```bash
npm run typecheck
npm run lint
npm run build
```

### 5. Run production locally

```bash
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```text
app/
  globals.css        Global styles and Tailwind theme tokens
  layout.tsx         App metadata and root layout
  page.tsx           Calculator UI, localStorage, dashboard, and charts
lib/
  debt-calculator.ts Payoff calculation engine and formatting helpers
```

## Calculation Notes

The calculator simulates payoff month by month in the browser:

- Interest accrues monthly from each debt APR.
- Minimum payments are applied to active debts.
- Extra payment is applied according to the selected strategy.
- Snowball targets the smallest balance first.
- Avalanche targets the highest APR first.
- Payments freed from paid-off debts are rolled into the remaining payoff plan.

If payments do not reduce the total balance, the app shows a warning and does not invent a payoff date.
