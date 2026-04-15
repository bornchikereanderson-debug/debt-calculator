"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  compactCurrency,
  compareStrategies,
  currency,
  type DebtInput,
  type PayoffResult,
} from "@/lib/debt-calculator";

const STORAGE_KEY = "debt-calculator:v1";

type SavedState = {
  debts: DebtInput[];
  extraPayment: number;
};

type CheckoutPlanId = "monthly" | "lifetime";

type CheckoutStep = "pricing" | "checkout" | "success" | "cancel";

type CheckoutPlan = {
  id: CheckoutPlanId;
  name: string;
  price: string;
  cadence: string;
  description: string;
  stripeLookupKey: string;
};

const starterDebts: DebtInput[] = [
  {
    id: "card-1",
    creditor: "Credit Card",
    balance: 4200,
    apr: 22.9,
    minimumPayment: 125,
  },
  {
    id: "loan-1",
    creditor: "Personal Loan",
    balance: 7800,
    apr: 11.5,
    minimumPayment: 240,
  },
];

const freeFeatures = [
  "One debt payoff calculator",
  "Snowball and avalanche comparison",
  "Instant payoff dates and interest estimate",
];

const premiumFeatures = [
  "Save plans",
  "Track payoff progress",
  "Payment reminders",
  "Goal date",
  "Printable report",
  "Multiple scenarios",
];

const premiumPreviews = [
  {
    title: "Save my plan",
    description:
      "Keep this payoff strategy ready so you can return without rebuilding every debt.",
    preview: "Plan saved as: Avalanche - 18 month target",
  },
  {
    title: "Progress tracker",
    description:
      "Log payments and watch your balances move down against the plan.",
    preview: "23% paid off - $2,760 principal cleared",
  },
  {
    title: "Reminders",
    description:
      "Stay ahead of due dates with gentle payment prompts before momentum slips.",
    preview: "Next reminder: 3 days before card payment",
  },
  {
    title: "Goal date planner",
    description:
      "Choose a debt-free date and see the monthly payment needed to reach it.",
    preview: "Target: Debt-free by December 2027",
  },
  {
    title: "Printable payoff report",
    description:
      "Export a clean plan summary for your budget binder, partner, or advisor.",
    preview: "Includes payoff order, interest, dates, and monthly plan",
  },
];

const checkoutPlans: CheckoutPlan[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$7",
    cadence: "/month",
    description: "Best if you want ongoing accountability while you pay down debt.",
    stripeLookupKey: "debt_tracker_monthly",
  },
  {
    id: "lifetime",
    name: "Lifetime early access",
    price: "$49",
    cadence: "one-time",
    description: "Best value for early users who want permanent access.",
    stripeLookupKey: "debt_tracker_lifetime_early_access",
  },
];

export default function Home() {
  const [savedState] = useState<SavedState>(() => getSavedState());
  const [debts, setDebts] = useState<DebtInput[]>(savedState.debts);
  const [extraPayment, setExtraPayment] = useState(savedState.extraPayment);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        debts,
        extraPayment,
      }),
    );
  }, [debts, extraPayment]);

  const results = useMemo(
    () => compareStrategies(debts, extraPayment),
    [debts, extraPayment],
  );

  const chartData = useMemo(() => {
    const maxLength = Math.max(
      results.snowball.schedule.length,
      results.avalanche.schedule.length,
    );

    return Array.from({ length: maxLength }, (_, index) => {
      const snowball = results.snowball.schedule[index];
      const avalanche = results.avalanche.schedule[index];
      return {
        month: index + 1,
        label: snowball?.date ?? avalanche?.date ?? `Month ${index + 1}`,
        snowball: snowball?.balance ?? 0,
        avalanche: avalanche?.balance ?? 0,
      };
    });
  }, [results]);

  const bestStrategy =
    results.avalanche.totalInterest <= results.snowball.totalInterest
      ? results.avalanche
      : results.snowball;
  const interestDifference = Math.abs(
    results.snowball.totalInterest - results.avalanche.totalInterest,
  );

  function updateDebt(id: string, field: keyof DebtInput, value: string) {
    setDebts((currentDebts) =>
      currentDebts.map((debt) =>
        debt.id === id
          ? {
              ...debt,
              [field]:
                field === "creditor" ? value : Math.max(0, Number(value) || 0),
            }
          : debt,
      ),
    );
  }

  function addDebt() {
    setDebts((currentDebts) => [
      ...currentDebts,
      {
        id: globalThis.crypto?.randomUUID?.() ?? `debt-${Date.now()}`,
        creditor: "",
        balance: 0,
        apr: 0,
        minimumPayment: 0,
      },
    ]);
  }

  function removeDebt(id: string) {
    setDebts((currentDebts) =>
      currentDebts.length === 1
        ? [
            {
              id,
              creditor: "",
              balance: 0,
              apr: 0,
              minimumPayment: 0,
            },
          ]
        : currentDebts.filter((debt) => debt.id !== id),
    );
  }

  function resetCalculator() {
    setDebts(starterDebts);
    setExtraPayment(250);
  }

  return (
    <main className="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 sm:gap-10">
        <header className="overflow-hidden rounded-lg border border-white/70 bg-white/80 shadow-premium backdrop-blur-xl">
          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-10">
            <div className="flex flex-col justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-fern/15 bg-fern/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-fern">
                  Debt payoff calculator
                </div>
                <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.02] text-ink sm:text-5xl lg:text-6xl">
                  Free debt payoff calculator for snowball vs avalanche plans.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-ink/70 sm:text-lg">
                  Use this snowball vs avalanche calculator to understand the
                  interest tradeoffs, compare monthly payoff plans, and see your
                  debt-free timeline before you commit another dollar.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <TrustStat label="Privacy first" value="Browser saved" />
                <TrustStat label="Methods" value="2 strategies" />
                <TrustStat label="Setup" value="No account" />
              </div>
            </div>

            <div className="rounded-lg border border-ink/10 bg-ink p-5 text-white shadow-card">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">
                Best interest savings
              </p>
              <p className="mt-3 text-4xl font-black capitalize leading-none">
                {bestStrategy.strategy}
              </p>
              <div className="mt-8 grid gap-3">
                <HighlightMetric
                  label="Interest difference"
                  value={currency(interestDifference)}
                />
                <HighlightMetric
                  label="Projected payoff"
                  value={bestStrategy.payoffDate ?? "Needs more payment"}
                />
                <HighlightMetric
                  label="Months to debt free"
                  value={`${bestStrategy.months}`}
                />
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.18fr)] lg:items-start">
          <DebtForm
            debts={debts}
            extraPayment={extraPayment}
            onAddDebt={addDebt}
            onRemoveDebt={removeDebt}
            onReset={resetCalculator}
            onUpdateDebt={updateDebt}
            onUpdateExtra={setExtraPayment}
          />

          <div className="flex min-w-0 flex-col gap-6">
            <SummaryGrid
              snowball={results.snowball}
              avalanche={results.avalanche}
            />
            <PayoffChart data={chartData} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <StrategyDetails result={results.snowball} />
          <StrategyDetails result={results.avalanche} />
        </section>

        <PremiumPreviews onOpen={() => setIsTrackerModalOpen(true)} />
        <MonetizationSection onOpen={() => setIsTrackerModalOpen(true)} />
      </div>

      {isTrackerModalOpen ? (
        <PricingModal onClose={() => setIsTrackerModalOpen(false)} />
      ) : null}
    </main>
  );
}

function getSavedState(): SavedState {
  if (typeof window === "undefined") {
    return {
      debts: starterDebts,
      extraPayment: 250,
    };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return {
      debts: starterDebts,
      extraPayment: 250,
    };
  }

  try {
    const parsed = JSON.parse(saved) as SavedState;
    if (Array.isArray(parsed.debts)) {
      return {
        debts: parsed.debts,
        extraPayment: Math.max(0, Number(parsed.extraPayment) || 0),
      };
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return {
    debts: starterDebts,
    extraPayment: 250,
  };
}

function DebtForm({
  debts,
  extraPayment,
  onAddDebt,
  onRemoveDebt,
  onReset,
  onUpdateDebt,
  onUpdateExtra,
}: {
  debts: DebtInput[];
  extraPayment: number;
  onAddDebt: () => void;
  onRemoveDebt: (id: string) => void;
  onReset: () => void;
  onUpdateDebt: (id: string, field: keyof DebtInput, value: string) => void;
  onUpdateExtra: (value: number) => void;
}) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white/95 p-4 shadow-card backdrop-blur sm:p-6 lg:sticky lg:top-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-fern">
            Inputs
          </p>
          <h2 className="mt-2 text-2xl font-black text-ink">
            Debt payoff calculator inputs
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink/60">
            Saved privately in this browser.
          </p>
        </div>
        <button type="button" onClick={onReset} className="button-secondary">
          Reset sample
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        {debts.map((debt, index) => (
          <div key={debt.id} className="rounded-lg border border-ink/10 bg-paper p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.14em] text-ink/50">
                  Debt {index + 1}
                </h3>
                <p className="mt-1 truncate text-sm font-bold text-ink">
                  {debt.creditor || "New creditor"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveDebt(debt.id)}
                aria-label={`Remove debt ${index + 1}`}
                className="icon-button"
              >
                x
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Creditor name">
                <input
                  value={debt.creditor}
                  onChange={(event) =>
                    onUpdateDebt(debt.id, "creditor", event.target.value)
                  }
                  placeholder="e.g. Visa"
                  className="input"
                />
              </Field>
              <Field label="Balance">
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={debt.balance}
                  onChange={(event) =>
                    onUpdateDebt(debt.id, "balance", event.target.value)
                  }
                  className="input"
                />
              </Field>
              <Field label="APR">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={debt.apr}
                  onChange={(event) =>
                    onUpdateDebt(debt.id, "apr", event.target.value)
                  }
                  className="input"
                />
              </Field>
              <Field label="Minimum payment">
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={debt.minimumPayment}
                  onChange={(event) =>
                    onUpdateDebt(debt.id, "minimumPayment", event.target.value)
                  }
                  className="input"
                />
              </Field>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={onAddDebt} className="button-primary mt-4 w-full">
        Add debt
      </button>

      <div className="mt-6 rounded-lg border border-gold/35 bg-gold/10 p-4">
        <Field label="Extra monthly payment">
          <input
            type="number"
            min="0"
            inputMode="decimal"
            value={extraPayment}
            onChange={(event) =>
              onUpdateExtra(Math.max(0, Number(event.target.value) || 0))
            }
            className="input bg-white"
          />
        </Field>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-black text-ink/70">{label}</span>
      {children}
    </label>
  );
}

function SummaryGrid({
  snowball,
  avalanche,
}: {
  snowball: PayoffResult;
  avalanche: PayoffResult;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      <Metric label="Total debt" value={currency(snowball.totalDebt)} tone="dark" />
      <Metric label="Monthly minimums" value={currency(snowball.totalMinimums)} />
      <Metric
        label="Snowball payoff"
        value={snowball.payoffDate ?? "Needs more payment"}
      />
      <Metric
        label="Avalanche payoff"
        value={avalanche.payoffDate ?? "Needs more payment"}
      />
    </section>
  );
}

function Metric({
  label,
  value,
  tone = "light",
}: {
  label: string;
  value: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";

  return (
    <div
      className={
        dark
          ? "rounded-lg border border-ink bg-ink p-4 text-white shadow-card"
          : "rounded-lg border border-ink/10 bg-white/95 p-4 shadow-card backdrop-blur"
      }
    >
      <p
        className={
          dark
            ? "text-xs font-black uppercase tracking-[0.14em] text-white/55"
            : "text-xs font-black uppercase tracking-[0.14em] text-ink/45"
        }
      >
        {label}
      </p>
      <p className="mt-2 text-2xl font-black leading-tight">{value}</p>
    </div>
  );
}

function PayoffChart({
  data,
}: {
  data: Array<{
    month: number;
    label: string;
    snowball: number;
    avalanche: number;
  }>;
}) {
  const isChartReady = useChartReady();

  return (
    <section className="min-w-0 rounded-lg border border-ink/10 bg-white/95 p-4 shadow-card backdrop-blur sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-fern">
            Forecast
          </p>
          <h2 className="mt-2 text-2xl font-black text-ink">
            Snowball vs avalanche calculator chart
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink/60">
            Remaining balance by month for each strategy.
          </p>
        </div>
        <div className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-ink/55">
          Live projection
        </div>
      </div>

      <div className="h-[340px] w-full rounded-lg border border-ink/10 bg-gradient-to-b from-white to-paper/80 p-2 sm:h-[390px] sm:p-4">
        {isChartReady ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 12, top: 14, bottom: 4 }}>
              <defs>
                <linearGradient id="snowball" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d96c53" stopOpacity={0.34} />
                  <stop offset="95%" stopColor="#d96c53" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="avalanche" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16745f" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#16745f" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#d7e0dc" strokeDasharray="4 6" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "#64736e", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                minTickGap={18}
              />
              <YAxis
                tickFormatter={compactCurrency}
                tick={{ fill: "#64736e", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <Tooltip
                cursor={{ stroke: "#15231f", strokeOpacity: 0.12 }}
                formatter={(value, name) => [
                  currency(Number(value) || 0),
                  name === "snowball" ? "Snowball" : "Avalanche",
                ]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
                contentStyle={{
                  border: "1px solid rgba(21, 35, 31, 0.12)",
                  borderRadius: 8,
                  boxShadow: "0 18px 48px rgba(21, 35, 31, 0.18)",
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
              <Area
                type="monotone"
                dataKey="snowball"
                name="Snowball"
                stroke="#d96c53"
                strokeWidth={3}
                fill="url(#snowball)"
              />
              <Area
                type="monotone"
                dataKey="avalanche"
                name="Avalanche"
                stroke="#16745f"
                strokeWidth={3}
                fill="url(#avalanche)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-ink/15 text-sm font-black uppercase tracking-[0.14em] text-ink/40">
            Loading chart
          </div>
        )}
      </div>
    </section>
  );
}

function useChartReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return isReady;
}

function StrategyDetails({ result }: { result: PayoffResult }) {
  const label = result.strategy === "snowball" ? "Snowball" : "Avalanche";
  const description =
    result.strategy === "snowball"
      ? "Targets the smallest balance first to build momentum."
      : "Targets the highest APR first to reduce interest cost.";

  return (
    <article className="rounded-lg border border-ink/10 bg-white/95 p-4 shadow-card backdrop-blur sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-fern">
            {label}
          </p>
          <h2 className="mt-2 text-3xl font-black leading-tight text-ink">
            {result.payoffDate ?? "No payoff date yet"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">{description}</p>
        </div>
        <div className="rounded-full border border-ink/10 bg-paper px-3 py-1.5 text-sm font-black text-ink">
          {result.months} months
        </div>
      </div>

      {result.warning ? (
        <p className="mt-5 rounded-md border border-coral/30 bg-coral/10 p-3 text-sm font-bold leading-6 text-ink">
          {result.warning}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Interest paid" value={currency(result.totalInterest)} />
        <MiniMetric
          label="Debt free in"
          value={`${result.months} ${result.months === 1 ? "month" : "months"}`}
        />
        <MiniMetric label="Payoff date" value={result.payoffDate ?? "N/A"} />
      </div>
    </article>
  );
}

function PremiumPreviews({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white/95 p-4 shadow-card backdrop-blur sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-fern">
            Premium previews
          </p>
          <h2 className="mt-2 text-2xl font-black text-ink">
            Turn your calculation into a plan you can follow.
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-ink/60">
            Preview the tools that help you stay consistent after the numbers are
            calculated.
          </p>
        </div>
        <button type="button" onClick={onOpen} className="button-secondary">
          View Premium
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {premiumPreviews.map((preview) => (
          <LockedPreviewCard key={preview.title} preview={preview} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function LockedPreviewCard({
  preview,
  onOpen,
}: {
  preview: (typeof premiumPreviews)[number];
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group min-h-56 rounded-lg border border-ink/10 bg-paper p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-fern/30 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-black leading-tight text-ink">{preview.title}</h3>
        <span className="rounded-full bg-ink px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-gold">
          Premium
        </span>
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-ink/62">
        {preview.description}
      </p>
      <div className="relative mt-4 overflow-hidden rounded-md border border-ink/10 bg-white p-3">
        <div className="blur-[2px] transition group-hover:blur-[1px]">
          <div className="mb-2 h-2 w-2/3 rounded-full bg-fern/25" />
          <div className="mb-3 h-2 w-1/2 rounded-full bg-gold/40" />
          <p className="text-xs font-black leading-5 text-ink/70">{preview.preview}</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/45">
          <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-black text-ink shadow-card">
            Unlock preview
          </span>
        </div>
      </div>
    </button>
  );
}

function MonetizationSection({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="overflow-hidden rounded-lg border border-ink/10 bg-ink text-white shadow-premium">
      <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:p-10">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">
            Debt Payoff Premium
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            Stop rebuilding the same plan while debt stress keeps winning.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
            The free calculator shows your path. Premium helps you keep control
            after today with saved scenarios, reminders, progress tracking, and a
            clear debt-free target you can actually follow.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <PriceCard label="Monthly" price="$7" detail="/month" />
            <PriceCard
              label="Early access"
              price="$49"
              detail="lifetime"
              featured
            />
          </div>

          <div className="mt-7 flex flex-col items-stretch gap-3 sm:inline-flex">
            <button type="button" onClick={onOpen} className="button-accent text-base sm:text-lg">
              Get Premium Access
            </button>
            <p className="text-center text-sm font-bold text-white/65">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <PlanCard
            title="Free"
            subtitle="Calculator only"
            features={freeFeatures}
          />
          <PlanCard
            title="Premium"
            subtitle="Complete payoff tracker"
            features={premiumFeatures}
            featured
          />
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  title,
  subtitle,
  features,
  featured = false,
}: {
  title: string;
  subtitle: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <article
      className={
        featured
          ? "rounded-lg border border-gold/40 bg-white p-4 text-ink shadow-card"
          : "rounded-lg border border-white/10 bg-white/10 p-4 text-white shadow-card"
      }
    >
      <p
        className={
          featured
            ? "text-xs font-black uppercase tracking-[0.16em] text-fern"
            : "text-xs font-black uppercase tracking-[0.16em] text-white/50"
        }
      >
        {title}
      </p>
      <h3 className="mt-2 text-xl font-black">{subtitle}</h3>
      <ul className="mt-4 grid gap-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm font-bold leading-5">
            <span
              className={
                featured
                  ? "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-black text-ink"
                  : "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-black text-white"
              }
            >
              +
            </span>
            <span className={featured ? "text-ink/80" : "text-white/80"}>
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function PriceCard({
  label,
  price,
  detail,
  featured = false,
}: {
  label: string;
  price: string;
  detail: string;
  featured?: boolean;
}) {
  return (
    <div
      className={
        featured
          ? "rounded-lg border border-gold/50 bg-gold p-4 text-ink shadow-card"
          : "rounded-lg border border-white/10 bg-white/10 p-4 text-white"
      }
    >
      <p
        className={
          featured
            ? "text-xs font-black uppercase tracking-[0.14em] text-ink/55"
            : "text-xs font-black uppercase tracking-[0.14em] text-white/50"
        }
      >
        {label}
      </p>
      <p className="mt-2 flex items-end gap-1">
        <span className="text-3xl font-black leading-none">{price}</span>
        <span className="text-sm font-black opacity-70">{detail}</span>
      </p>
    </div>
  );
}

function PricingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<CheckoutStep>("pricing");
  const [selectedPlan, setSelectedPlan] = useState<CheckoutPlan>(checkoutPlans[1]);
  const [lead, setLead] = useState({
    name: "",
    email: "",
  });

  function handleCheckoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep("success");
  }

  function choosePlan(plan: CheckoutPlan) {
    setSelectedPlan(plan);
    setStep("checkout");
  }

  return (
    <div
      aria-labelledby="tracker-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-ink/60 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-white/70 bg-white p-5 shadow-premium sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-fern">
              Stripe checkout preview
            </p>
            <h2 id="tracker-modal-title" className="mt-2 text-2xl font-black text-ink sm:text-3xl">
              Get Premium Access
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="icon-button"
          >
            x
          </button>
        </div>

        {step === "pricing" ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {checkoutPlans.map((plan) => (
              <CheckoutPlanCard
                key={plan.id}
                plan={plan}
                featured={plan.id === "lifetime"}
                onChoose={() => choosePlan(plan)}
              />
            ))}
          </div>
        ) : null}

        {step === "checkout" ? (
          <form className="mt-6 grid gap-5" onSubmit={handleCheckoutSubmit}>
            <div className="rounded-lg border border-ink/10 bg-paper p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/45">
                Selected plan
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-2xl font-black text-ink">{selectedPlan.name}</p>
                  <p className="mt-1 text-sm font-bold text-ink/60">
                    Stripe lookup key: {selectedPlan.stripeLookupKey}
                  </p>
                </div>
                <p className="text-3xl font-black text-ink">
                  {selectedPlan.price}
                  <span className="ml-1 text-sm text-ink/55">{selectedPlan.cadence}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  className="input"
                  name="name"
                  onChange={(event) =>
                    setLead((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Your name"
                  required
                  value={lead.name}
                />
              </Field>
              <Field label="Email">
                <input
                  className="input"
                  name="email"
                  onChange={(event) =>
                    setLead((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={lead.email}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <button type="submit" className="button-primary w-full">
                Continue to Checkout
              </button>
              <button
                type="button"
                onClick={() => setStep("cancel")}
                className="button-secondary"
              >
                Cancel checkout
              </button>
            </div>
            <p className="text-center text-xs leading-5 text-ink/50">
              Placeholder only. Later this button can create a Stripe Checkout
              Session and redirect to Stripe.
            </p>
          </form>
        ) : null}

        {step === "success" ? (
          <CheckoutStatus
            title="Checkout success placeholder"
            body="In the Stripe version, successful payments will return here before unlocking premium tracking features."
            actionLabel="Back to calculator"
            onAction={onClose}
          />
        ) : null}

        {step === "cancel" ? (
          <CheckoutStatus
            title="Checkout canceled placeholder"
            body="In the Stripe version, canceled checkouts will return here so users can review plans or keep using the free calculator."
            actionLabel="Review plans"
            onAction={() => setStep("pricing")}
            secondaryLabel="Back to calculator"
            onSecondary={onClose}
          />
        ) : null}
      </div>
    </div>
  );
}

function CheckoutPlanCard({
  plan,
  featured = false,
  onChoose,
}: {
  plan: CheckoutPlan;
  featured?: boolean;
  onChoose: () => void;
}) {
  return (
    <article
      className={
        featured
          ? "rounded-lg border border-gold/50 bg-gold/15 p-4 shadow-card"
          : "rounded-lg border border-ink/10 bg-paper p-4"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-fern">
            {featured ? "Best value" : "Flexible"}
          </p>
          <h3 className="mt-2 text-xl font-black text-ink">{plan.name}</h3>
        </div>
        <p className="text-right">
          <span className="block text-3xl font-black leading-none text-ink">
            {plan.price}
          </span>
          <span className="text-sm font-black text-ink/55">{plan.cadence}</span>
        </p>
      </div>
      <p className="mt-4 text-sm font-bold leading-6 text-ink/65">
        {plan.description}
      </p>
      <button type="button" onClick={onChoose} className="button-primary mt-5 w-full">
        Choose {plan.name}
      </button>
    </article>
  );
}

function CheckoutStatus({
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="mt-6 rounded-lg border border-fern/20 bg-mint/70 p-5">
      <p className="text-2xl font-black text-ink">{title}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-ink/65">{body}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onAction} className="button-primary w-full">
          {actionLabel}
        </button>
        {secondaryLabel && onSecondary ? (
          <button type="button" onClick={onSecondary} className="button-secondary">
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function TrustStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white/70 p-3">
      <p className="text-xs font-black uppercase tracking-[0.13em] text-ink/40">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function HighlightMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/10 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/40">
        {label}
      </p>
      <p className="mt-1 text-lg font-black leading-tight text-ink">{value}</p>
    </div>
  );
}
