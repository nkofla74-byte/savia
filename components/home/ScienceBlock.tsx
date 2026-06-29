import { Reveal } from "@/lib/motion/Reveal";
import { Stagger, StaggerItem } from "@/lib/motion/Stagger";
import { SectionImage } from "@/components/media/SectionImage";

const points = [
  { t: "Ingredientes con propósito", d: "Cada aceite se elige por lo que aporta, no por relleno." },
  { t: "Sin sobrepromesas", d: "Solo afirmaciones cosméticas honestas. Nada de milagros." },
  { t: "Hecho en Bogotá", d: "Producción local, fórmulas cuidadas, precio justo." },
];

const CIENCIA_IMG: string | undefined = "/secciones/ciencia.jpg";

export function ScienceBlock() {
  return (
    <section className="py-24">
      <Reveal blur>
        <h2 className="font-display text-3xl font-bold text-primary">Con base científica</h2>
      </Reveal>
      <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
        <Reveal direction="left">
          <SectionImage
            src={CIENCIA_IMG}
            alt="Detalle de ingredientes botánicos de Savia"
            className="aspect-[4/3] w-full rounded-2xl"
          />
        </Reveal>
        <Stagger className="grid gap-6" fast>
          {points.map((p) => (
            <StaggerItem
              key={p.t}
              className="group rounded-2xl border border-primary/10 bg-surface/40 p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:bg-surface/80 hover:shadow-xl hover:shadow-primary/5"
            >
              <h3 className="font-display text-lg text-primary transition-colors duration-300 group-hover:text-accent">{p.t}</h3>
              <p className="mt-2 text-ink/80">{p.d}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
