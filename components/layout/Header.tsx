import Link from "next/link";
import { Logo } from "@/illustrations/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { CartButton } from "@/components/cart/CartButton";

const nav = [
  { href: "/tienda", label: "Tienda" },
  { href: "/sobre", label: "Sobre Savia" },
  { href: "/contacto", label: "Contacto" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <Logo className="h-8 w-8" />
          <span className="font-display text-xl font-bold tracking-wide">Savia</span>
        </Link>
        <nav className="hidden gap-8 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm text-ink/80 transition-colors hover:text-primary">{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
