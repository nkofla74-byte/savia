"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Tag, Boxes, FlaskConical, ScanSearch, BookText, Users, BarChart3, MessageSquare } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Inicio", Icon: LayoutDashboard, exact: true },
  { href: "/admin/ventas", label: "Ventas", Icon: ShoppingCart, exact: false },
  { href: "/admin/pedidos", label: "Pedidos", Icon: Package, exact: false },
  { href: "/admin/clientes", label: "Clientes", Icon: Users, exact: false },
  { href: "/admin/productos", label: "Productos", Icon: Tag, exact: false },
  { href: "/admin/inventario", label: "Inventario", Icon: Boxes, exact: false },
  { href: "/admin/insumos", label: "Insumos", Icon: FlaskConical, exact: false },
  { href: "/admin/recetas", label: "Recetas", Icon: BookText, exact: false },
  { href: "/admin/auditoria", label: "Auditoría", Icon: ScanSearch, exact: false },
  { href: "/admin/reportes", label: "Reportes", Icon: BarChart3, exact: false },
  { href: "/admin/mensajes", label: "Mensajes", Icon: MessageSquare, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="grid grid-cols-4 gap-1.5 px-3 pb-3 sm:grid-cols-5 lg:flex lg:flex-col lg:gap-1 lg:pb-0">
      {ITEMS.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 rounded-xl px-1.5 py-2 text-center text-[11px] font-medium leading-tight transition-colors lg:flex-row lg:gap-3 lg:px-4 lg:py-2.5 lg:text-left lg:text-sm ${
              active ? "bg-primary text-bg" : "text-ink/70 hover:bg-primary/10 hover:text-primary"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0 lg:h-4 lg:w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
