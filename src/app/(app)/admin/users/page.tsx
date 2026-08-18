import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const session = await auth();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { assignments: true, reports: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Manajemen User</h1>
        <p className="text-sm text-muted-foreground">
          Kelola akun admin dan QA.
        </p>
      </div>
      <UsersTable
        users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        currentUserId={session!.user.id}
      />
    </div>
  );
}
