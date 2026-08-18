import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@prisma/client";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const qaPlatformNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/reports", label: "Weekly reports", icon: FileText },
];

export const adminPlatformNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/users", label: "Users", icon: Users },
];

export const accountNav: NavItem[] = [
  { href: "/profile", label: "Profile settings", icon: Settings },
];

export function platformNavFor(role: Role) {
  return role === "ADMIN" ? adminPlatformNav : qaPlatformNav;
}

export function pageTitleFor(pathname: string) {
  const all = [...adminPlatformNav, ...qaPlatformNav, ...accountNav];
  const match = all
    .filter((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "QA Weekly";
}
