"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { ClipboardCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/role-labels";
import { signOutAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { accountNav, platformNavFor, type NavItem } from "./nav-config";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export function AppSidebar({
  user,
  collapsed,
}: {
  user: { name?: string | null; email?: string | null; role: Role };
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const platformNav = platformNavFor(user.role);

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r bg-background transition-[width] duration-150",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center gap-2 border-b p-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ClipboardCheck className="size-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">QA Weekly</div>
            <div className="truncate text-xs text-muted-foreground">
              Reporting
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        <NavGroup
          title="Platform"
          items={platformNav}
          pathname={pathname}
          collapsed={collapsed}
        />
        <NavGroup
          title="Account"
          items={accountNav}
          pathname={pathname}
          collapsed={collapsed}
        />
      </nav>

      <div className="border-t p-3">
        <div
          className={cn(
            "flex items-center gap-2 px-1",
            collapsed && "justify-center"
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {initials(user.name ?? "")}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {roleLabel[user.role]}
              </div>
            </div>
          )}
        </div>
        <form action={signOutAction} className="mt-3">
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className={cn("w-full", collapsed && "px-0")}
          >
            <LogOut className="size-4" />
            {!collapsed && <span>Keluar</span>}
          </Button>
        </form>
      </div>
    </aside>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  collapsed,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div>
      {!collapsed && (
        <div className="mb-1 px-2 text-xs font-medium tracking-wide text-muted-foreground">
          {title}
        </div>
      )}
      <div className="space-y-0.5">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
