"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/tienda", label: "Tienda" },
  { href: "/sobre", label: "Sobre Savia" },
  { href: "/contacto", label: "Contacto" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden gap-8 md:flex">
      {nav.map((n) => {
        const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`group relative text-sm font-medium transition-colors ${
              active ? "text-primary" : "text-ink/70 hover:text-primary"
            }`}
          >
            {n.label}
            <span
              className={`absolute -bottom-1 left-0 h-0.5 rounded-full bg-accent transition-all duration-300 ${
                active ? "w-full" : "w-0 group-hover:w-full"
              }`}
              aria-hidden
            />
          </Link>
        );
      })}
    </nav>
  );
}
