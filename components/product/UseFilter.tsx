"use client";
import type { Uso } from "@/content/products";

const CATS: { value: Uso | "todos"; emoji: string; label: string }[] = [
  { value: "todos", emoji: "🌸", label: "Ver todo" },
  { value: "masaje", emoji: "🌿", label: "Relajarte" },
  { value: "cuerpo", emoji: "💧", label: "Nutrir tu piel" },
  { value: "rostro", emoji: "✨", label: "Cuidar tu rostro" },
  { value: "cabello", emoji: "🌱", label: "Cuidar tu cabello" },
];

export function UseFilter({ active, onChange }: { active: Uso | "todos"; onChange: (u: Uso | "todos") => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {CATS.map((c) => {
        const on = active === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            aria-pressed={on}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition duration-300 ${
              on
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-primary/15 bg-surface/40 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface/70"
            }`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-bg text-2xl" aria-hidden>
              {c.emoji}
            </span>
            <span className={`text-sm font-medium ${on ? "text-primary" : "text-ink/80"}`}>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
