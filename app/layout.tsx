import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Free Debt Payoff Calculator (Snowball vs Avalanche)",
  description:
    "Calculate how fast you can pay off debt using snowball and avalanche methods. See payoff dates, interest savings, and monthly plans instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
