"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "./variants";
import { useReducedMotion } from "./useReducedMotion";

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}
