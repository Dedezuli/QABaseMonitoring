"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DateRangePicker } from "@/components/date-range-picker";

/** URL-bound wrapper around the range picker, for pages that filter by period. */
export function PeriodPicker({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function apply(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", nextFrom);
    params.set("to", nextTo);
    router.push(`${pathname}?${params.toString()}`);
  }

  return <DateRangePicker from={from} to={to} onChange={apply} />;
}
