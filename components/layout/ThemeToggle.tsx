"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" aria-hidden />;
  const isBotica = theme === "botica";
  return (
    <button
      type="button"
      onClick={() => setTheme(isBotica ? "crema" : "botica")}
      aria-label={isBotica ? "Cambiar a tema Crema (claro)" : "Cambiar a tema Botica (oscuro)"}
      className="grid h-9 w-9 place-items-center rounded-full border border-primary/30 text-primary transition-colors hover:bg-primary/10"
    >
      <span className="text-sm">{isBotica ? "☾" : "☀"}</span>
    </button>
  );
}
