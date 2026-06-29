"use client";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartToast } from "@/components/cart/CartToast";
import WhatsAppButton from "@/components/whatsAppButton/WhatsAppButton";

/**
 * El panel /admin tiene su propio shell (sidebar) y ocupa todo el ancho,
 * así que ocultamos el chrome público (header, footer, carrito, WhatsApp) ahí.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <>
      <Header />
      <CartToast />
      <main className="mx-auto max-w-6xl px-5">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
