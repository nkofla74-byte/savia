"use client";
import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "./variants";
import { useReducedMotion } from "./useReducedMotion";

type Direction = "up" | "down" | "left" | "right" | "none";

function buildVariants(direction: Direction, distance: number, blur: boolean, delay: number): Variants {
  const offset =
    direction === "up"
      ? { y: distance }
      : direction === "down"
        ? { y: -distance }
        : direction === "left"
          ? { x: distance }
          : direction === "right"
            ? { x: -distance }
            : {};
  return {
    hidden: { opacity: 0, ...offset, ...(blur ? { filter: "blur(8px)" } : {}) },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      ...(blur ? { filter: "blur(0px)" } : {}),
      transition: { duration: 0.7, ease: EASE, delay },
    },
  };
}

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  distance = 24,
  blur = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: Direction;
  distance?: number;
  blur?: boolean;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={buildVariants(direction, distance, blur, delay)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}
