import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { HeroBackground } from "./HeroBackground";

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573182359277";
const WA_HREF = `https://wa.me/${NUMBER}?text=${encodeURIComponent(
  "Hola Savia, quiero pedir información 🌿",
)}`;

const TRUST = ["Envío a toda Colombia", "Pago seguro", "Hecho en Bogotá"];

// Entrada por CSS: aparece de inmediato al pintar (no espera la hidratación) y
// se omite con prefers-reduced-motion gracias al variante motion-safe.
const ENTER = "motion-safe:animate-[rise-in_0.45s_ease-out_both]";

export function Hero() {
  return (
    <section className="relative left-1/2 flex min-h-[90svh] w-screen -translate-x-1/2 items-end overflow-hidden">
      <HeroBackground />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 sm:pb-24">
        <p className={`text-xs font-medium uppercase tracking-[0.22em] text-bg/85 ${ENTER}`}>
          Aceites botánicos · Bogotá
        </p>
        <h1
          className={`mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.05] text-bg sm:text-5xl lg:text-7xl ${ENTER} motion-safe:[animation-delay:70ms]`}
        >
          Cuidado que se siente, fórmulas que se entienden
        </h1>
        <p className={`mt-5 max-w-md text-lg text-bg/90 ${ENTER} motion-safe:[animation-delay:140ms]`}>
          Aceites botánicos con base científica. Honestos, locales, para tu ritual diario.
        </p>
        <div className={`mt-8 flex flex-wrap gap-3 ${ENTER} motion-safe:[animation-delay:210ms]`}>
          <Link
            href="/tienda"
            className="group inline-flex items-center gap-2 rounded-full bg-bg px-7 py-3.5 font-medium text-ink shadow-lg shadow-ink/10 transition hover:opacity-90"
          >
            Ver la tienda
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </Link>
          <a
            href={WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Pedir por WhatsApp"
            className="group inline-flex items-center gap-2 rounded-full border border-bg/70 px-7 py-3.5 font-medium text-bg backdrop-blur-sm transition hover:bg-bg/10"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Pedir por WhatsApp
          </a>
        </div>
        <ul className={`mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-bg/80 ${ENTER} motion-safe:[animation-delay:280ms]`}>
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
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
