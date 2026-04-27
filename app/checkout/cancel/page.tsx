import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen px-4 py-8 text-ink sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-lg border border-ink/10 bg-white/95 p-5 shadow-premium sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-coral">
          Checkout canceled
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
          No payment was made.
        </h1>
        <p className="mt-4 text-sm font-bold leading-6 text-ink/65">
          You can keep using the free calculator, or return to pricing when you
          are ready to unlock saved plans, reminders, reports, and progress
          tracking.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/#pricing" className="button-primary inline-flex justify-center">
            Back to Pricing
          </Link>
          <Link href="/" className="button-secondary inline-flex justify-center">
            Return to Calculator
          </Link>
        </div>
      </section>
    </main>
  );
}
