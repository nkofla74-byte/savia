"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

const SHOTS = [
  { src: "/secciones/galeria-1.jpg", alt: "Aceites botánicos con manzanilla y romero" },
  { src: "/secciones/galeria-2.jpg", alt: "Aceites dorados con pétalos de rosa" },
  { src: "/secciones/galeria-3.jpg", alt: "Frascos ámbar con flores y plantas" },
  { src: "/secciones/galeria-4.jpg", alt: "Goteros de aceite con menta fresca" },
  { src: "/secciones/galeria-5.jpg", alt: "Aceites y crema con hierbas aromáticas" },
];

function Encabezado({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Naturaleza en cada gota</p>
      <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">
        Botánica que se siente
      </h2>
    </div>
  );
}

function Tarjeta({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <figure className={`relative aspect-[4/3] shrink-0 overflow-hidden rounded-3xl border border-primary/10 ${className}`}>
      <Image src={src} alt={alt} fill sizes="(max-width: 640px) 80vw, 32vw" className="object-cover" />
    </figure>
  );
}

export function HorizontalGallery() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  // Accesible: con prefers-reduced-motion no hay anclaje; scroll horizontal nativo.
  if (reduced) {
    return (
      <section className="py-20">
        <Encabezado className="px-6 sm:px-8" />
        <div className="mt-8 flex snap-x gap-5 overflow-x-auto px-6 pb-4 sm:px-8">
          {SHOTS.map((s) => (
            <Tarjeta key={s.src} src={s.src} alt={s.alt} className="w-[80vw] snap-start sm:w-[48vw] lg:w-[32vw]" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} style={{ height: `calc(100vh + ${distance}px)` }} className="relative">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <Encabezado className="px-6 sm:px-10" />
        <motion.div ref={trackRef} style={{ x }} className="mt-8 flex gap-6 px-6 will-change-transform sm:px-10">
          {SHOTS.map((s) => (
            <Tarjeta key={s.src} src={s.src} alt={s.alt} className="w-[72vw] sm:w-[44vw] lg:w-[30vw]" />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
