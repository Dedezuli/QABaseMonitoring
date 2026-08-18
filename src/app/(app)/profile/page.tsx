import { auth } from "@/auth";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">
          Kelola nama dan password akun kamu.
        </p>
      </div>
      <ProfileForm
        initialName={session!.user.name ?? ""}
        email={session!.user.email ?? ""}
      />
    </div>
  );
}
