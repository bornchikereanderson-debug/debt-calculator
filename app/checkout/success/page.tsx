import Link from "next/link";
import Stripe from "stripe";
import { getPlanByPriceId } from "@/lib/stripe-plans";
import { getStripe } from "@/lib/stripe-server";
import { PremiumUnlock } from "./premium-unlock";

export const runtime = "nodejs";

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  const result = await verifyCheckoutSession(sessionId);

  return (
    <main className="min-h-screen px-4 py-8 text-ink sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-lg border border-ink/10 bg-white/95 p-5 shadow-premium sm:p-8">
        {result.ok ? (
          <>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-fern">
              Payment verified
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Your premium plan is ready.
            </h1>
            <div className="mt-6 grid gap-3 rounded-lg border border-ink/10 bg-paper p-4">
              <SummaryRow label="Purchased plan" value={result.planName} />
              <SummaryRow label="Customer email" value={result.email} />
              <SummaryRow label="Stripe status" value={result.paymentStatus} />
            </div>
            <PremiumUnlock planId={result.planId} email={result.email} />
            <Link href="/" className="button-primary mt-6 inline-flex w-full justify-center sm:w-auto">
              Open Debt Calculator
            </Link>
          </>
        ) : (
          <>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-coral">
              Payment not verified
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Premium was not unlocked.
            </h1>
            <p className="mt-4 text-sm font-bold leading-6 text-ink/65">
              {result.error}
            </p>
            <Link href="/#pricing" className="button-primary mt-6 inline-flex w-full justify-center sm:w-auto">
              Back to Pricing
            </Link>
          </>
        )}
      </section>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-ink/45">
        {label}
      </span>
      <span className="font-black text-ink">{value}</span>
    </div>
  );
}

async function verifyCheckoutSession(sessionId: string | undefined): Promise<
  | {
      ok: true;
      planId: string;
      planName: string;
      email: string;
      paymentStatus: string;
    }
  | {
      ok: false;
      error: string;
    }
> {
  if (!sessionId) {
    return {
      ok: false,
      error: "No checkout session ID was provided.",
    };
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price"],
    });

    if (session.status !== "complete" || session.payment_status !== "paid") {
      return {
        ok: false,
        error: "Stripe has not marked this checkout session as paid.",
      };
    }

    const plan = resolvePurchasedPlan(session);
    if (!plan) {
      return {
        ok: false,
        error: "The purchased Stripe price does not match a configured premium plan.",
      };
    }

    const email = session.customer_details?.email ?? session.customer_email;
    if (!email) {
      return {
        ok: false,
        error: "Stripe did not return a customer email for this session.",
      };
    }

    return {
      ok: true,
      planId: plan.id,
      planName: plan.name,
      email,
      paymentStatus: session.payment_status,
    };
  } catch (error) {
    console.error("Stripe checkout verification error", error);
    return {
      ok: false,
      error: "Unable to verify this checkout session with Stripe.",
    };
  }
}

function resolvePurchasedPlan(session: Stripe.Checkout.Session) {
  const price = session.line_items?.data[0]?.price;
  return getPlanByPriceId(typeof price === "string" ? price : price?.id);
}
