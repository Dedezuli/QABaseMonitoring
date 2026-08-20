import { auth } from "@/auth";
import { errorResponse } from "@/lib/api-error";

const SESSION_EXPIRED =
  "Sesi kamu sudah berakhir. Silakan login ulang lalu coba lagi.";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { user: null, error: errorResponse(SESSION_EXPIRED, 401) };
  }
  if (session.user.role !== "ADMIN") {
    return {
      user: null,
      error: errorResponse(
        "Tindakan ini hanya bisa dilakukan oleh admin/QA Lead.",
        403
      ),
    };
  }
  return { user: session.user, error: null };
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    return { user: null, error: errorResponse(SESSION_EXPIRED, 401) };
  }
  return { user: session.user, error: null };
}
