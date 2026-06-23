"use client";
import { useState } from "react";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const nav = [
  { href: "/tienda", label: "Tienda" },
  { href: "/sobre", label: "Sobre Savia" },
  { href: "/contacto", label: "Contacto" },
  { href: "/legales", label: "Legales" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Abrir menú"
        className="grid h-9 w-9 place-items-center rounded-full border border-primary/30 text-primary transition-colors hover:bg-primary/10 md:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
      </SheetTrigger>
      <SheetContent side="left" className="bg-bg text-ink">
        <SheetHeader>
          <SheetTitle className="font-display text-primary">Savia</SheetTitle>
        </SheetHeader>
        <nav className="mt-4 flex flex-col gap-1 px-2">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base text-ink/90 transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
