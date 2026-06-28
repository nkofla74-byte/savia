"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { SectionImage } from "@/components/media/SectionImage";
import { EASE } from "@/lib/motion/variants";

const SLIDES = [
  { src: "/secciones/historia-1.jpg", alt: "Frasco de aceite de Savia con lavanda" },
  { src: "/secciones/galeria-3.jpg", alt: "Frascos ámbar con flores y plantas" },
  { src: "/secciones/historia-2.jpg", alt: "El ritual de cuidado Savia" },
  { src: "/secciones/galeria-1.jpg", alt: "Aceites botánicos con manzanilla y romero" },
];

const QUOTE =
  "“Savia es el ritual diario que se permite quien entiende que el cuidado propio no es lujo, es inversión.”";
const SUB =
  "Savia no promete milagros. Promete mejora consistente. Cada fórmula tiene un propósito real.";

function Quote() {
  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="font-display text-2xl leading-relaxed text-primary">{QUOTE}</p>
      <p className="mt-6 text-ink/80">{SUB}</p>
    </div>
  );
}

export function BrandStory() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 4200);
    return () => clearInterval(id);
  }, [reduced]);

  if (reduced) {
    return (
      <section className="py-24">
        <Quote />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {SLIDES.slice(0, 2).map((s) => (
            <SectionImage key={s.src} src={s.src} alt={s.alt} className="aspect-[4/5] w-full rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  const slide = SLIDES[index] ?? SLIDES[0];

  return (
    <section className="py-24">
      <Quote />
      <div className="relative mx-auto mt-12 aspect-[16/10] w-full max-w-2xl overflow-hidden rounded-3xl border border-primary/10 bg-surface/40">
        <AnimatePresence>
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 80, scale: 1.06 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -80, scale: 1.06 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="absolute inset-0"
          >
            <motion.div
              animate={{ scale: 1.08 }}
              transition={{ duration: 4.2, ease: "linear" }}
              className="h-full w-full"
            >
              <SectionImage
                src={slide?.src}
                alt={slide?.alt ?? ""}
                sizes="(max-width: 768px) 100vw, 672px"
                className="h-full w-full"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-bg" : "w-1.5 bg-bg/50 hover:bg-bg/80"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
