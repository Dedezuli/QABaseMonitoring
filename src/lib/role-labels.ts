import type { Role } from "@prisma/client";

export const roleLabel: Record<Role, string> = {
  ADMIN: "QA Lead",
  QA: "QA Member",
};
