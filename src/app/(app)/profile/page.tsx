import { auth } from "@/auth";
import { signOutAction } from "@/app/(app)/actions";
import { roleLabel } from "@/lib/role-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PasswordSection } from "@/components/password-section";
import { LogOut } from "lucide-react";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export default async function ProfilePage() {
  const session = await auth();
  const user = session!.user;
  const name = user.name ?? "";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Informasi akun yang sedang login.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 pt-6">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {initials(name)}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="text-lg font-semibold">{name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            <Badge variant="secondary">{roleLabel[user.role]}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <PasswordSection />

          <Separator />

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Sign out</h3>
              <p className="text-sm text-muted-foreground">
                Keluar dari sesi browser saat ini.
              </p>
            </div>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="outline"
                className="text-destructive"
              >
                <LogOut className="mr-1 size-4" /> Logout
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
