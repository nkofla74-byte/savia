"use client";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

export function ParallaxBand() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section
      ref={ref}
      className="relative left-1/2 my-24 flex min-h-[70vh] w-screen -translate-x-1/2 items-center justify-center overflow-hidden"
    >
      <motion.div style={reduced ? undefined : { y }} className="absolute -inset-y-[14%] inset-x-0">
        <Image
          src="/secciones/banda-rosas.jpg"
          alt="Aceites botánicos de Savia con pétalos de rosa"
          fill
          sizes="100vw"
          className="object-cover [object-position:center_60%]"
        />
      </motion.div>
      <div className="absolute inset-0 bg-ink/55" />
      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <p className="font-display text-3xl leading-relaxed text-bg sm:text-4xl">
          Cuidado consciente, hecho en Bogotá.
        </p>
        <p className="mt-4 text-bg/85">
          Fórmulas botánicas con propósito real: cada aceite se elige por lo que aporta a tu piel.
        </p>
        <Link
          href="/tienda"
          className="mt-8 inline-block rounded-full bg-bg px-7 py-3 text-sm font-medium text-ink transition hover:opacity-90"
        >
          Explorar la colección
        </Link>
      </div>
    </section>
  );
}
