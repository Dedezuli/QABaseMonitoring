import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UsersTable } from "@/components/admin/users-table";
import { Pagination } from "@/components/pagination";
import { resolvePage } from "@/lib/pagination";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const session = await auth();

  const totalUsers = await prisma.user.count();
  const pageInfo = resolvePage(pageParam, totalUsers);

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
    skip: pageInfo.skip,
    take: pageInfo.pageSize,
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
      <Pagination info={pageInfo} itemLabel="user" />
    </div>
  );
}
