"use client";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

export default function WhatsAppButton() {
  const reduced = useReducedMotion();
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573182359277";
  const href = `https://wa.me/${number}?text=${encodeURIComponent(
    "Hola Savia 🌿, me gustaría recibir más información.",
  )}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="group fixed bottom-6 right-6 z-50 flex items-center"
      animate={reduced ? undefined : { y: [0, -6, 0] }}
      transition={reduced ? undefined : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      whileHover={reduced ? undefined : { scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Etiqueta que se despliega en hover (oculta para lectores: el aria-label ya describe) */}
      <span
        aria-hidden
        className="pointer-events-none mr-3 max-w-0 overflow-hidden whitespace-nowrap rounded-full bg-ink/90 px-0 py-2 text-sm font-medium text-bg opacity-0 shadow-lg transition-all duration-300 group-hover:max-w-[12rem] group-hover:px-4 group-hover:opacity-100"
      >
        Escríbenos
      </span>

      <span className="relative flex h-14 w-14 items-center justify-center">
        {/* Anillo pulsante (se omite con prefers-reduced-motion) */}
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-500/60 motion-safe:animate-ping" aria-hidden />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-900/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            fill="currentColor"
            className="h-8 w-8"
            aria-hidden
          >
            <path d="M16.04 3C8.84 3 3 8.72 3 15.77c0 2.47.71 4.87 2.05 6.94L3 29l6.5-2.01a13.18 13.18 0 0 0 6.54 1.76c7.2 0 13.04-5.72 13.04-12.77S23.24 3 16.04 3zm0 23.47a10.9 10.9 0 0 1-5.55-1.53l-.4-.24-3.86 1.19 1.26-3.68-.26-.38a10.4 10.4 0 0 1-1.68-5.66c0-5.8 4.72-10.52 10.53-10.52 5.81 0 10.53 4.72 10.53 10.52s-4.72 10.3-10.57 10.3z" />
          </svg>
        </span>
      </span>
    </motion.a>
  );
}
