import type { Metadata, Viewport } from "next";
import { Inter, Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { LenisProvider } from "@/lib/motion/LenisProvider";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });

export const metadata: Metadata = {
  title: "Savia — Aceites botánicos",
  description: "Aceites botánicos cosméticos con base científica. Bogotá. Fórmulas honestas.",
};

// Permite zoom del usuario (accesibilidad): no se fija maximumScale.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable} ${hanken.variable}`}>
   <body>
  <ThemeProvider>
    <LenisProvider>
      <AppShell>{children}</AppShell>
    </LenisProvider>
  </ThemeProvider>
</body>
    </html>
  );
}
