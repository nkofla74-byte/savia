import type { Metadata } from "next";
import { Inter, Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { LenisProvider } from "@/lib/motion/LenisProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });

export const metadata: Metadata = {
  title: "Savia — Aceites botánicos",
  description: "Aceites botánicos cosméticos con base científica. Bogotá. Fórmulas honestas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable} ${hanken.variable}`}>
      <body>
        <ThemeProvider>
          <LenisProvider>
            <Header />
            <main className="mx-auto max-w-6xl px-5">{children}</main>
            <Footer />
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
