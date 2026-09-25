"use client";

import { formatCurrency } from "@/lib/utils";

export function FormatCurrencyClient({ amountCents, currency = "EUR" }: { amountCents: number; currency?: string }) {
  return <span>{formatCurrency(amountCents, currency)}</span>;
}
