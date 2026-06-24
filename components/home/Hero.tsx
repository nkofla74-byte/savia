import Link from "next/link";
import { HeroBackground } from "./HeroBackground";

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573182359277";
const WA_HREF = `https://wa.me/${NUMBER}?text=${encodeURIComponent(
  "Hola Savia, quiero pedir información 🌿",
)}`;

export function Hero() {
  return (
    <section className="relative left-1/2 flex min-h-[88svh] w-screen -translate-x-1/2 items-end overflow-hidden">
      <HeroBackground />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 sm:pb-20">
        <p className="text-xs uppercase tracking-[0.18em] text-bg/85">
          Aceites botánicos · Bogotá
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-bg sm:text-5xl lg:text-6xl">
          Cuidado que se siente, fórmulas que se entienden
        </h1>
        <p className="mt-4 max-w-md text-bg/90">
          Aceites botánicos con base científica. Honestos, locales, para tu ritual diario.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/tienda"
            className="rounded-full bg-bg px-6 py-3 font-medium text-ink transition hover:opacity-90"
          >
            Ver la tienda
          </Link>
          <a
            href={WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Pedir por WhatsApp"
            className="rounded-full border border-bg/80 px-6 py-3 font-medium text-bg transition hover:bg-bg/10"
          >
            Pedir por WhatsApp
          </a>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-bg/70 motion-safe:animate-bounce"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
