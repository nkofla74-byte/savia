"use client";
import { motion, useScroll, useSpring } from "framer-motion";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

export function ScrollProgress() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const springX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  const scaleX = reduced ? scrollYProgress : springX;
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-accent"
    />
  );
}
