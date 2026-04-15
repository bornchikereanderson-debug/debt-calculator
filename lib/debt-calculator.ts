export type DebtInput = {
  id: string;
  creditor: string;
  balance: number;
  apr: number;
  minimumPayment: number;
};

export type PayoffStrategy = "snowball" | "avalanche";

export type MonthlySnapshot = {
  month: number;
  date: string;
  balance: number;
  principalPaid: number;
  interestPaid: number;
};

export type PayoffResult = {
  strategy: PayoffStrategy;
  totalDebt: number;
  totalMinimums: number;
  totalInterest: number;
  months: number;
  payoffDate: string | null;
  schedule: MonthlySnapshot[];
  warning?: string;
};

type WorkingDebt = DebtInput & {
  balance: number;
};

const MAX_MONTHS = 1200;

export function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function compactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function sanitizeDebts(debts: DebtInput[]) {
  return debts
    .map((debt) => ({
      ...debt,
      creditor: debt.creditor.trim() || "Unnamed debt",
      balance: Math.max(0, Number(debt.balance) || 0),
      apr: Math.max(0, Number(debt.apr) || 0),
      minimumPayment: Math.max(0, Number(debt.minimumPayment) || 0),
    }))
    .filter((debt) => debt.balance > 0);
}

export function calculatePayoff(
  debts: DebtInput[],
  extraPayment: number,
  strategy: PayoffStrategy,
  startDate = new Date(),
): PayoffResult {
  const cleanDebts = sanitizeDebts(debts);
  const totalDebt = roundMoney(sum(cleanDebts.map((debt) => debt.balance)));
  const totalMinimums = roundMoney(sum(cleanDebts.map((debt) => debt.minimumPayment)));
  const monthlyExtra = Math.max(0, Number(extraPayment) || 0);

  if (cleanDebts.length === 0) {
    return {
      strategy,
      totalDebt: 0,
      totalMinimums: 0,
      totalInterest: 0,
      months: 0,
      payoffDate: null,
      schedule: [],
    };
  }

  let workingDebts: WorkingDebt[] = cleanDebts.map((debt) => ({ ...debt }));
  const schedule: MonthlySnapshot[] = [];
  let totalInterest = 0;
  let month = 0;

  while (workingDebts.some((debt) => debt.balance > 0.005) && month < MAX_MONTHS) {
    month += 1;
    const previousBalance = roundMoney(sum(workingDebts.map((debt) => debt.balance)));
    let interestThisMonth = 0;
    let principalThisMonth = 0;

    workingDebts = workingDebts.map((debt) => {
      const monthlyInterest = roundMoney(debt.balance * (debt.apr / 100 / 12));
      interestThisMonth += monthlyInterest;
      return {
        ...debt,
        balance: roundMoney(debt.balance + monthlyInterest),
      };
    });

    let paymentPool = roundMoney(
      sum(workingDebts.filter(isActive).map((debt) => debt.minimumPayment)) + monthlyExtra,
    );

    const baseOrder = [...workingDebts].sort((a, b) => a.id.localeCompare(b.id));
    for (const debt of baseOrder) {
      const current = workingDebts.find((item) => item.id === debt.id);
      if (!current || current.balance <= 0 || paymentPool <= 0) {
        continue;
      }

      const payment = Math.min(current.minimumPayment, current.balance, paymentPool);
      current.balance = roundMoney(current.balance - payment);
      paymentPool = roundMoney(paymentPool - payment);
      principalThisMonth = roundMoney(principalThisMonth + payment);
    }

    while (paymentPool > 0.005 && workingDebts.some(isActive)) {
      const target = getNextTarget(workingDebts, strategy);
      if (!target) {
        break;
      }

      const payment = Math.min(target.balance, paymentPool);
      target.balance = roundMoney(target.balance - payment);
      paymentPool = roundMoney(paymentPool - payment);
      principalThisMonth = roundMoney(principalThisMonth + payment);
    }

    workingDebts = workingDebts.map((debt) => ({
      ...debt,
      balance: debt.balance < 0.005 ? 0 : debt.balance,
    }));

    const remainingBalance = roundMoney(sum(workingDebts.map((debt) => debt.balance)));
    totalInterest = roundMoney(totalInterest + interestThisMonth);
    schedule.push({
      month,
      date: monthLabel(addMonths(startDate, month)),
      balance: remainingBalance,
      principalPaid: principalThisMonth,
      interestPaid: roundMoney(interestThisMonth),
    });

    if (principalThisMonth <= 0 || remainingBalance >= previousBalance - 0.005) {
      return {
        strategy,
        totalDebt,
        totalMinimums,
        totalInterest,
        months: month,
        payoffDate: null,
        schedule,
        warning:
          "The payment plan is not reducing the balances enough to project a payoff date. Increase minimum or extra payments.",
      };
    }
  }

  const paidOff = !workingDebts.some(isActive);
  return {
    strategy,
    totalDebt,
    totalMinimums,
    totalInterest: roundMoney(totalInterest),
    months: paidOff ? month : MAX_MONTHS,
    payoffDate: paidOff ? monthLabel(addMonths(startDate, month)) : null,
    schedule,
    warning: paidOff
      ? undefined
      : "This plan takes longer than 100 years. Increase payments to see a realistic payoff date.",
  };
}

export function compareStrategies(debts: DebtInput[], extraPayment: number) {
  return {
    snowball: calculatePayoff(debts, extraPayment, "snowball"),
    avalanche: calculatePayoff(debts, extraPayment, "avalanche"),
  };
}

function getNextTarget(debts: WorkingDebt[], strategy: PayoffStrategy) {
  const activeDebts = debts.filter(isActive);

  if (strategy === "snowball") {
    return activeDebts.sort((a, b) => a.balance - b.balance || b.apr - a.apr)[0];
  }

  return activeDebts.sort((a, b) => b.apr - a.apr || a.balance - b.balance)[0];
}

function isActive(debt: WorkingDebt) {
  return debt.balance > 0.005;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
