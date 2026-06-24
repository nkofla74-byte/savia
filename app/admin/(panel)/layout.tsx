import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin/auth";
import { signOut } from "@/lib/admin/actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-primary/10 pb-4">
        <nav className="flex gap-6 text-sm">
          <Link href="/admin" className="text-ink/80 hover:text-primary">Resumen</Link>
          <Link href="/admin/pedidos" className="text-ink/80 hover:text-primary">Pedidos</Link>
          <Link href="/admin/mensajes" className="text-ink/80 hover:text-primary">Mensajes</Link>
        </nav>
        <form action={signOut}>
          <button type="submit" className="rounded-full border border-primary/30 px-4 py-1.5 text-sm text-primary hover:bg-primary/10">
            Cerrar sesión
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
