"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PageInfo } from "@/lib/pagination";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Page numbers around the current one, with ellipses standing in for the
 * stretches that would otherwise push the control off a narrow screen.
 */
function pageItems(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items: (number | "gap")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) items.push("gap");
  for (let i = start; i <= end; i += 1) items.push(i);
  if (end < totalPages - 1) items.push("gap");

  items.push(totalPages);
  return items;
}

export function Pagination({
  info,
  itemLabel = "data",
}: {
  info: PageInfo;
  itemLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  if (info.totalItems === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
      <p className="text-sm text-muted-foreground">
        Menampilkan{" "}
        <span className="font-medium text-foreground tabular-nums">
          {info.from}&ndash;{info.to}
        </span>{" "}
        dari{" "}
        <span className="font-medium text-foreground tabular-nums">
          {info.totalItems}
        </span>{" "}
        {itemLabel}
      </p>

      {info.totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Halaman sebelumnya"
            disabled={info.page <= 1}
            onClick={() => goTo(info.page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>

          {pageItems(info.page, info.totalPages).map((item, index) =>
            item === "gap" ? (
              <span
                key={`gap-${index}`}
                className="px-1 text-sm text-muted-foreground"
              >
                &hellip;
              </span>
            ) : (
              <Button
                key={item}
                variant={item === info.page ? "default" : "outline"}
                size="icon-sm"
                aria-current={item === info.page ? "page" : undefined}
                onClick={() => goTo(item)}
                className="tabular-nums"
              >
                {item}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Halaman berikutnya"
            disabled={info.page >= info.totalPages}
            onClick={() => goTo(info.page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
