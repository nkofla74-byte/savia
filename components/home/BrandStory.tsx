import { Reveal } from "@/lib/motion/Reveal";

export function BrandStory() {
  return (
    <section className="py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="font-display text-2xl leading-relaxed text-primary">
          “Savia es el ritual diario que se permite quien entiende que el cuidado propio no es lujo, es inversión.”
        </p>
        <p className="mt-6 text-ink/80">Savia no promete milagros. Promete mejora consistente. Cada fórmula tiene un propósito real.</p>
      </Reveal>
    </section>
  );
}
