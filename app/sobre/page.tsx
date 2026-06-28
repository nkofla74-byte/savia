import { Reveal } from "@/lib/motion/Reveal";
import { SectionImage } from "@/components/media/SectionImage";

export default function SobrePage() {
  return (
    <section className="max-w-2xl py-16">
      <h1 className="font-display text-4xl font-bold text-primary">Sobre Savia</h1>

      <Reveal className="mt-8" direction="right">
        <SectionImage
          src="/secciones/galeria-2.jpg"
          alt="Aceites botánicos de Savia con pétalos de rosa"
          sizes="(max-width: 768px) 100vw, 672px"
          className="aspect-[16/9] w-full rounded-2xl"
        />
      </Reveal>

      <Reveal className="mt-8 space-y-4 text-ink/85" blur>
        <p>Savia nació de una idea sencilla: cuidar la piel no debería ser complicado..</p>
        <p>Después de probar productos que prometían resultados extraordinarios y entregaban muy poco, decidimos crear algo diferente. Formulamos aceites y productos para el cuidado personal con ingredientes seleccionados por lo que realmente aportan, no por las tendencias del momento.

Creemos en la belleza de lo natural, en las rutinas simples y en los pequeños momentos de cuidado que hacen parte de cada día. Por eso elaboramos productos que combinan calidad, sensorialidad y bienestar, pensados para acompañarte desde la mañana hasta la noche..</p>
        <p>Cada fórmula de Savia busca nutrir, proteger y respetar tu piel, ofreciendo una experiencia honesta y agradable que puedas disfrutar todos los días.Somos una marca nacida en Bogotá, inspirada por la naturaleza y comprometida con crear productos accesibles, auténticos y hechos con propósito.

Porque cuidar de ti no debería ser un lujo, sino un hábito..</p>
      </Reveal>

      <Reveal className="mt-10" direction="left">
        <SectionImage
          src="/secciones/historia-1.jpg"
          alt="Frasco de aceite de Savia con lavanda"
          sizes="(max-width: 768px) 100vw, 672px"
          className="aspect-[16/9] w-full rounded-2xl"
        />
      </Reveal>

      <Reveal className="mt-8 space-y-4 text-ink/85" blur>
        <h2 className="font-display text-3xl font-bold text-primary">Nuestra historia</h2>
        <p>En Savia creemos que el cuidado personal empieza con algo muy simple: dedicarte unos minutos a ti.

Nacimos con el deseo de crear productos honestos, elaborados con ingredientes de origen natural y seleccionados por sus beneficios reales. Sin promesas exageradas, sin fórmulas innecesariamente complejas, solo lo que tu piel necesita para sentirse bien cada día.

Nos inspiran los rituales cotidianos: aplicar unas gotas de aceite después de la ducha, cuidar la piel antes de dormir o regalar un momento de calma en medio de una rutina agitada.

Por eso cada producto de Savia está pensado para convertirse en parte de tu día a día. Fórmulas cuidadosamente desarrolladas, texturas agradables y aromas que invitan a conectar con el bienestar de forma sencilla y natural.

Somos una marca bogotana que cree en la calidad, la transparencia y el poder de los ingredientes que provienen de la naturaleza.

Savia es cuidado consciente, hecho para personas reales...</p>
      </Reveal>

      <Reveal className="mt-10" direction="right">
        <SectionImage
          src="/secciones/galeria-5.jpg"
          alt="Aceites y crema de Savia con hierbas aromáticas"
          sizes="(max-width: 768px) 100vw, 672px"
          className="aspect-[16/9] w-full rounded-2xl"
        />
      </Reveal>
    </section>
  );
}
