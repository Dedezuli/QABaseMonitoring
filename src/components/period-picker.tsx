"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function formatShort(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PeriodPicker({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [open, setOpen] = useState(false);

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", draftFrom);
    params.set("to", draftTo);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraftFrom(from);
          setDraftTo(to);
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarRange className="size-4" />
            {formatShort(from)} &ndash; {formatShort(to)}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-auto">
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Dari</Label>
            <Input
              type="date"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sampai</Label>
            <Input
              type="date"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              className="w-36"
            />
          </div>
          <Button size="sm" onClick={apply}>
            Terapkan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
