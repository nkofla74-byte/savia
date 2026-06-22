import { Reveal } from "@/lib/motion/Reveal";

export default function SobrePage() {
  return (
    <section className="prose-invert max-w-2xl py-16">
      <h1 className="font-display text-4xl font-bold text-primary">Sobre Savia</h1>
      <Reveal className="mt-6 space-y-4 text-ink/85">
        <p>Savia nació del cansancio de los aceites que prometen todo y no hacen nada. Empezamos a formular con ingredientes que de verdad aportan, con respaldo, y a un precio justo.</p>
        <p>Sofisticada pero accesible. Científica pero sensorial. Bogotana con mirada global. Vendemos por calidad, no por ruido.</p>
      </Reveal>
    </section>
  );
}
