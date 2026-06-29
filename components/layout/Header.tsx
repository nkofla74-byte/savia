import Link from "next/link";
import { Logo } from "@/illustrations/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
import { CartButton } from "@/components/cart/CartButton";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-primary transition-opacity hover:opacity-80">
          <Logo className="h-8 w-8" />
          <span className="font-display text-xl font-bold tracking-wide">Savia</span>
        </Link>
        <NavLinks />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <CartButton />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
