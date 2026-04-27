import { NextResponse } from "next/server";
import { getAppUrl, getCheckoutPlan, getStripePriceId } from "@/lib/stripe-plans";
import { getStripe } from "@/lib/stripe-server";

export const runtime = "nodejs";

type CheckoutRequest = {
  planId?: string;
  name?: string;
  email?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequest;
    const plan = getCheckoutPlan(body.planId);

    if (!plan) {
      return NextResponse.json({ error: "Invalid checkout plan." }, { status: 400 });
    }

    const email = body.email?.trim();
    const name = body.name?.trim();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 },
      );
    }

    const priceId = getStripePriceId(plan.id);
    if (!priceId) {
      return NextResponse.json(
        { error: `${plan.priceEnvKey} is not configured.` },
        { status: 500 },
      );
    }

    const appUrl = getAppUrl();
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: plan.mode,
      customer_email: email,
      client_reference_id: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      metadata: {
        planId: plan.id,
        customerName: name,
      },
      payment_intent_data:
        plan.mode === "payment"
          ? {
              metadata: {
                planId: plan.id,
                customerName: name,
              },
            }
          : undefined,
      subscription_data:
        plan.mode === "subscription"
          ? {
              metadata: {
                planId: plan.id,
                customerName: name,
              },
            }
          : undefined,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session error", error);
    return NextResponse.json(
      { error: "Unable to create checkout session." },
      { status: 500 },
    );
  }
}
