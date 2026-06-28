"use client";
import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Leaf, MapPin, Heart } from "lucide-react";
import { products, type Uso } from "@/content/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductCard } from "@/components/product/ProductCard";
import { UseFilter } from "@/components/product/UseFilter";
import { Reveal } from "@/lib/motion/Reveal";

const CAT_LABEL: Record<string, string> = {
  todos: "Toda la colección",
  masaje: "Relajarte",
  cuerpo: "Nutrir tu piel",
  rostro: "Cuidar tu rostro",
  cabello: "Cuidar tu cabello",
};

const TRUST = [
  { Icon: Leaf, t: "Ingredientes seleccionados" },
  { Icon: MapPin, t: "Hecho en Bogotá" },
  { Icon: Heart, t: "Cosmética consciente" },
];

const STEPS = [
  { n: "1", t: "Elige tu aceite", d: "Según tu piel y el momento que quieras cuidar." },
  { n: "2", t: "Aplica unas gotas", d: "Sobre piel limpia, con un masaje suave." },
  { n: "3", t: "Disfruta el momento", d: "Convierte tu cuidado en un ritual diario." },
];

export default function TiendaPage() {
  const [active, setActive] = useState<Uso | "todos">("todos");
  const shown = active === "todos" ? products : products.filter((p) => p.usos.includes(active));
  const esenciales = products.filter((p) => p.destacado);

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2">
      <div className="mx-auto max-w-7xl px-5">
        {/* 1. Hero tienda */}
        <section className="py-14 text-center sm:py-20">
          <Reveal blur>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">Tienda · Bogotá</p>
            <h1 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] text-primary sm:text-6xl">
              Encuentra tu ritual
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
              Descubre aceites botánicos creados para acompañar distintos momentos de tu cuidado diario.
            </p>
          </Reveal>
        </section>

        {/* 2. Categorías visuales */}
        <section className="pb-6">
          <Reveal blur className="text-center">
            <h2 className="font-display text-2xl font-bold text-primary sm:text-3xl">¿Qué estás buscando?</h2>
          </Reveal>
          <div className="mt-8">
            <UseFilter active={active} onChange={setActive} />
          </div>
        </section>

        {/* 3. Esenciales de Savia */}
        <section className="py-14">
          <Reveal blur>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">Selección</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">Los esenciales de Savia</h2>
            <p className="mt-3 max-w-md text-ink/70">Tres fórmulas para empezar, una para cada momento.</p>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {esenciales.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>

        {/* 4. Colección completa */}
        <section className="py-10">
          <Reveal blur className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">La colección Savia</h2>
              <p className="mt-3 max-w-md leading-relaxed text-ink/70">
                {products.length} fórmulas, {products.length} momentos. Una misma filosofía: cuidarte con intención.
              </p>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {TRUST.map(({ Icon, t }) => (
                <li key={t} className="flex items-center gap-2 text-sm text-ink/75">
                  <Icon className="h-4 w-4 text-accent" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="mt-6 flex items-center gap-3 text-sm text-muted">
            <span>Mostrando: <span className="font-medium text-primary">{CAT_LABEL[active]}</span></span>
            {active !== "todos" && (
              <button type="button" onClick={() => setActive("todos")} className="text-accent hover:underline">
                Ver todo
              </button>
            )}
          </div>

          <div className="mt-8">
            {shown.length === 0 ? (
              <p className="rounded-2xl border border-primary/10 bg-surface/40 p-10 text-center text-ink/70">
                No hay productos en esta categoría todavía.
              </p>
            ) : (
              <ProductGrid products={shown} />
            )}
          </div>
        </section>

        {/* 5. Cómo usar Savia */}
        <section className="py-14">
          <Reveal blur className="text-center">
            <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">¿Cómo incorporar Savia a tu rutina?</h2>
            <p className="mx-auto mt-3 max-w-md text-ink/70">Tres pasos simples para convertir el cuidado en un ritual.</p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-3xl border border-primary/10 bg-surface/40 p-8 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary text-lg font-bold text-bg">
                  {s.n}
                </span>
                <h3 className="mt-5 font-display text-xl text-primary">{s.t}</h3>
                <p className="mt-2 leading-relaxed text-ink/70">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. ¿Necesitas ayuda? */}
        <section className="pb-20">
          <Reveal blur>
            <div className="mx-auto max-w-3xl rounded-3xl border border-primary/10 bg-surface/50 px-6 py-14 text-center sm:px-12">
              <h2 className="font-display text-3xl font-bold leading-tight text-primary sm:text-4xl">
                ¿No sabes cuál elegir?
              </h2>
              <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink/75">
                Cuéntanos qué buscas y te ayudamos a encontrar el producto ideal para tu rutina.
              </p>
              <Link
                href="/contacto"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 font-medium text-bg shadow-lg shadow-primary/20 transition hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Hablar con Savia
              </Link>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
