"use client";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

const HERO_IMAGE = "/hero/aceites-madera.jpg";

export function HeroBackground() {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 80]);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        style={reduced ? undefined : { y }}
        className="absolute -inset-y-[8%] inset-x-0"
      >
        <Image
          src={HERO_IMAGE}
          alt="Aceites botánicos de Savia sobre madera"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink/25 to-ink/65" />
    </div>
  );
}
