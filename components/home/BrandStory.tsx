"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { SectionImage } from "@/components/media/SectionImage";

const SLIDE_A: string | undefined = "/secciones/historia-1.jpg";
const SLIDE_B: string | undefined = "/secciones/historia-2.jpg";

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
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const bOpacity = useTransform(scrollYProgress, [0.35, 0.65], [0, 1]);

  if (reduced) {
    return (
      <section className="py-24">
        <Quote />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <SectionImage src={SLIDE_A} alt="El ritual Savia, paso uno" className="aspect-[4/5] w-full rounded-2xl" />
          <SectionImage src={SLIDE_B} alt="El ritual Savia, paso dos" className="aspect-[4/5] w-full rounded-2xl" />
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[180vh]">
      <div className="sticky top-[8vh] flex min-h-[84vh] flex-col items-center justify-center gap-10 py-10">
        <Quote />
        <div className="relative aspect-[16/9] w-full max-w-2xl">
          <SectionImage src={SLIDE_A} alt="El ritual Savia, paso uno" className="absolute inset-0 h-full w-full rounded-2xl" />
          <motion.div style={{ opacity: bOpacity }} className="absolute inset-0">
            <SectionImage src={SLIDE_B} alt="El ritual Savia, paso dos" className="h-full w-full rounded-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
