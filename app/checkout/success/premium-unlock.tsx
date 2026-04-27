"use client";

import { useEffect } from "react";
import { PREMIUM_STORAGE_KEY } from "@/lib/premium";

export function PremiumUnlock({
  planId,
  email,
}: {
  planId: string;
  email: string;
}) {
  useEffect(() => {
    window.localStorage.setItem(
      PREMIUM_STORAGE_KEY,
      JSON.stringify({
        unlocked: true,
        planId,
        email,
        verifiedAt: new Date().toISOString(),
      }),
    );
  }, [email, planId]);

  return (
    <p className="mt-4 rounded-md border border-fern/20 bg-mint/70 p-3 text-sm font-black text-ink">
      Premium access has been unlocked in this browser.
    </p>
  );
}
