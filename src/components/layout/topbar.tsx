"use client";

import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageTitleFor } from "./nav-config";

export function Topbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 border-b bg-background px-4 py-2.5">
      <Button variant="ghost" size="icon-sm" onClick={onToggleSidebar}>
        <PanelLeft className="size-4" />
      </Button>
      <div className="h-4 w-px bg-border" />
      <span className="text-sm text-muted-foreground">
        {pageTitleFor(pathname)}
      </span>
    </div>
  );
}
