export type CheckoutPlanId = "monthly" | "lifetime";

export type CheckoutPlan = {
  id: CheckoutPlanId;
  name: string;
  price: string;
  cadence: string;
  description: string;
  priceEnvKey: "STRIPE_PRICE_MONTHLY" | "STRIPE_PRICE_LIFETIME";
  mode: "subscription" | "payment";
};

export const checkoutPlans: CheckoutPlan[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$7",
    cadence: "/month",
    description: "Best if you want ongoing accountability while you pay down debt.",
    priceEnvKey: "STRIPE_PRICE_MONTHLY",
    mode: "subscription",
  },
  {
    id: "lifetime",
    name: "Lifetime early access",
    price: "$49",
    cadence: "one-time",
    description: "Best value for early users who want permanent access.",
    priceEnvKey: "STRIPE_PRICE_LIFETIME",
    mode: "payment",
  },
];

export function getCheckoutPlan(planId: string | null | undefined) {
  return checkoutPlans.find((plan) => plan.id === planId);
}

export function getPlanByPriceId(priceId: string | null | undefined) {
  if (!priceId) {
    return undefined;
  }

  return checkoutPlans.find((plan) => getStripePriceId(plan.id) === priceId);
}

export function getStripePriceId(planId: CheckoutPlanId) {
  if (planId === "monthly") {
    return process.env.STRIPE_PRICE_MONTHLY;
  }

  return process.env.STRIPE_PRICE_LIFETIME;
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}
