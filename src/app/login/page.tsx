import { ClipboardCheck } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1">
      {/* Brand panel — hidden on small screens, where the form is the whole page. */}
      <div className="relative hidden w-[46%] max-w-[560px] shrink-0 flex-col overflow-hidden bg-[oklch(30%_0.06_195)] p-12 lg:flex">
        <div className="absolute -right-36 -top-32 size-[420px] rounded-full bg-[oklch(40%_0.08_195)]" />
        <div className="absolute -bottom-40 -left-24 size-[360px] rounded-full bg-[oklch(26%_0.055_195)]" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-[9px] bg-[oklch(98%_0.01_195)]">
            <ClipboardCheck className="size-5 text-[oklch(30%_0.06_195)]" />
          </div>
          <div>
            <div className="font-heading text-[17px] font-bold text-white">
              QA Weekly
            </div>
            <div className="text-xs text-white/75">Reporting</div>
          </div>
        </div>

        <div className="relative flex max-w-md flex-1 flex-col justify-center gap-4 pb-16">
          <h1 className="font-heading text-[32px] font-bold leading-[1.25] text-white">
            Satu tempat untuk semua laporan QA mingguan.
          </h1>
          <p className="text-[15px] leading-relaxed text-white/80">
            Lacak progress test case, automation coverage, dan production
            incident di setiap project &mdash; lengkap dengan alur review dan
            approval tim.
          </p>
        </div>

      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <LoginForm />
      </div>
    </div>
  );
}
