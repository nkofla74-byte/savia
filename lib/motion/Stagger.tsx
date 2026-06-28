"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { staggerParent, staggerFast, fadeUp } from "./variants";
import { useReducedMotion } from "./useReducedMotion";

export function Stagger({ children, className, fast = false }: { children: ReactNode; className?: string; fast?: boolean }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={fast ? staggerFast : staggerParent} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} variants={fadeUp}>{children}</motion.div>;
}
