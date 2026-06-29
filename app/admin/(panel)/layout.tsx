import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { getAdminUser } from "@/lib/admin/auth";
import { signOut } from "@/lib/admin/actions";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="mx-auto w-full max-w-[88rem] lg:flex">
        <aside className="border-b border-primary/10 lg:min-h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-4 lg:sticky lg:top-0 lg:h-screen lg:py-6">
            <Link href="/admin" className="flex items-center gap-2 px-6 pt-5 lg:pt-0">
              <span className="text-xl" aria-hidden>🌿</span>
              <span className="font-display text-lg font-bold text-primary">Savia Admin</span>
            </Link>

            <AdminNav />

            <form action={signOut} className="mt-auto hidden px-5 pb-2 lg:block">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-ink/60 transition-colors hover:bg-rose-500/10 hover:text-rose-600"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Cerrar sesión
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-8 lg:px-10 lg:py-10">
          <div className="mb-6 flex justify-end lg:hidden">
            <form action={signOut}>
              <button type="submit" className="flex items-center gap-2 text-sm text-ink/60 hover:text-rose-600">
                <LogOut className="h-4 w-4" aria-hidden />
                Salir
              </button>
            </form>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
