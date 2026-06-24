import { Reveal } from "@/lib/motion/Reveal";
import { Stagger, StaggerItem } from "@/lib/motion/Stagger";
import { SectionImage } from "@/components/media/SectionImage";

const points = [
  { t: "Ingredientes con propósito", d: "Cada aceite se elige por lo que aporta, no por relleno." },
  { t: "Sin sobrepromesas", d: "Solo afirmaciones cosméticas honestas. Nada de milagros." },
  { t: "Hecho en Bogotá", d: "Producción local, fórmulas cuidadas, precio justo." },
];

// Cuando exista la foto, definir: const CIENCIA_IMG = "/secciones/ciencia.jpg";
const CIENCIA_IMG: string | undefined = undefined;

export function ScienceBlock() {
  return (
    <section className="py-24">
      <Reveal>
        <h2 className="font-display text-3xl font-bold text-primary">Con base científica</h2>
      </Reveal>
      <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
        <Reveal>
          <SectionImage
            src={CIENCIA_IMG}
            alt="Detalle de ingredientes botánicos de Savia"
            className="aspect-[4/3] w-full rounded-2xl"
          />
        </Reveal>
        <Stagger className="grid gap-6">
          {points.map((p) => (
            <StaggerItem key={p.t} className="rounded-2xl border border-primary/10 bg-surface/40 p-6">
              <h3 className="font-display text-lg text-primary">{p.t}</h3>
              <p className="mt-2 text-ink/80">{p.d}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
