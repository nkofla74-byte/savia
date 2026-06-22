"use client";
import { USES, type Uso } from "@/content/products";

export function UseFilter({ active, onChange }: { active: Uso | "todos"; onChange: (u: Uso | "todos") => void }) {
  const options: (Uso | "todos")[] = ["todos", ...USES];
  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`rounded-full border px-4 py-1.5 text-sm capitalize transition-colors ${active === o ? "border-primary bg-primary text-bg" : "border-primary/30 text-ink/80 hover:border-primary"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}
