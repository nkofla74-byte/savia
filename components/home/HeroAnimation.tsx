"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Logo } from "@/illustrations/Logo";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

export function HeroAnimation() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-logo", { y: -30, opacity: 0, duration: 1, ease: "power3.out" });
      gsap.from(".hero-line", { y: 24, opacity: 0, duration: 0.9, stagger: 0.15, delay: 0.2, ease: "power3.out" });
      gsap.fromTo(".hero-drop", { scaleY: 0, transformOrigin: "top center", opacity: 0.6 }, { scaleY: 1, opacity: 1, duration: 1.2, delay: 0.5, ease: "power2.inOut" });
    }, root);
    return () => ctx.revert();
  }, [reduced]);
  return (
    <div ref={root} className="grid min-h-[72vh] place-items-center text-center">
      <div>
        <Logo className="hero-logo mx-auto h-20 w-20 text-primary" />
        <div className="hero-drop mx-auto my-4 h-16 w-px bg-accent" />
        <h1 className="hero-line font-display text-5xl font-bold text-primary sm:text-6xl">Savia</h1>
        <p className="hero-line mx-auto mt-4 max-w-md text-lg text-ink/80">Aceites botánicos con base científica. Fórmulas honestas, hechas en Bogotá.</p>
      </div>
    </div>
  );
}
