import Link from "next/link";
import { ShieldCheck, Leaf, Sun, FlaskConical, MapPin, MessageCircle } from "lucide-react";
import { Reveal } from "@/lib/motion/Reveal";
import { Stagger, StaggerItem } from "@/lib/motion/Stagger";
import { SectionImage } from "@/components/media/SectionImage";

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573182359277";
const WA_HREF = `https://wa.me/${NUMBER}?text=${encodeURIComponent("Hola Savia 🌿, quiero conocer más.")}`;

const TIMELINE = [
  { icon: "🌱", label: "Idea" },
  { icon: "🧪", label: "Investigación" },
  { icon: "🌿", label: "Fórmulas botánicas" },
  { icon: "🇨🇴", label: "Hecho en Bogotá" },
];

const VALUES = [
  {
    Icon: ShieldCheck,
    t: "Honestidad antes que promesas",
    d: "No creemos en productos que prometen cambiarlo todo. Creemos en la constancia, el conocimiento y los pequeños hábitos.",
  },
  {
    Icon: Leaf,
    t: "Ingredientes con propósito",
    d: "Cada aceite, extracto y planta tiene un motivo dentro de la fórmula.",
  },
  {
    Icon: Sun,
    t: "Hecho para la vida real",
    d: "Productos simples para personas reales, rutinas reales y momentos reales.",
  },
];

export default function SobrePage() {
  return (
    <div className="space-y-24 py-12 sm:space-y-32 sm:py-16">
      {/* 1. Hero emocional */}
      <section className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal blur className="order-2 lg:order-1">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">Sobre Savia</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.08] text-primary sm:text-5xl">
            Cuidarte también es una forma de volver a ti
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/80">
            Savia nace de una idea sencilla: crear productos que acompañen los pequeños momentos
            donde eliges cuidar de ti.
          </p>
        </Reveal>
        <Reveal direction="left" className="order-1 lg:order-2">
          <SectionImage
            src="/secciones/galeria-2.jpg"
            alt="Aceite botánico de Savia rodeado de pétalos y plantas"
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="aspect-[4/5] w-full rounded-3xl shadow-xl shadow-primary/10 sm:aspect-[5/4] lg:aspect-[4/5]"
          />
        </Reveal>
      </section>

      {/* 2. Nuestra historia + línea de tiempo */}
      <section className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal direction="right">
          <SectionImage
            src="/secciones/historia-1.jpg"
            alt="Frasco de aceite de Savia con lavanda"
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="aspect-[4/3] w-full rounded-3xl lg:aspect-[3/4]"
          />
        </Reveal>
        <div className="flex flex-col justify-center">
          <Reveal blur>
            <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">
              Una marca creada con intención
            </h2>
            <p className="mt-5 leading-relaxed text-ink/80">
              Savia nació buscando una forma más consciente de entender el cuidado personal.
            </p>
            <p className="mt-4 leading-relaxed text-ink/80">
              Creemos que una buena fórmula no necesita esconderse detrás de palabras complicadas ni
              promesas imposibles. Cada ingrediente tiene una razón de estar ahí: aportar, acompañar
              y hacer parte de una rutina real.
            </p>
          </Reveal>

          <Stagger className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-2">
            {TIMELINE.map((step) => (
              <StaggerItem
                key={step.label}
                className="flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-2 sm:text-center"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-primary/15 bg-surface/60 text-xl">
                  {step.icon}
                </span>
                <span className="text-sm font-medium text-ink/80">{step.label}</span>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* 3. Nuestra filosofía: 3 tarjetas */}
      <section>
        <Reveal blur className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">Nuestra filosofía</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">
            En qué creemos
          </h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
          {VALUES.map(({ Icon, t, d }) => (
            <StaggerItem
              key={t}
              className="group rounded-3xl border border-primary/10 bg-surface/40 p-8 transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:bg-surface/80 hover:shadow-xl hover:shadow-primary/5"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-bg">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-5 font-display text-xl text-primary">{t}</h3>
              <p className="mt-3 leading-relaxed text-ink/75">{d}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* 4. Foto amplia de ingredientes (full-bleed) */}
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
        <SectionImage
          src="/secciones/galeria-3.jpg"
          alt="Ingredientes botánicos y frascos ámbar de Savia"
          sizes="100vw"
          className="aspect-[21/9] w-full"
        />
      </section>

      {/* 5. Ciencia + naturaleza, con foto dividida */}
      <section>
        <Reveal blur className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">Ciencia + naturaleza</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">
            Entre la tradición botánica y el conocimiento cosmético
          </h2>
          <p className="mt-6 leading-relaxed text-ink/80">
            La naturaleza nos inspira, pero la formulación responsable nos guía. En Savia buscamos
            equilibrar ingredientes botánicos con criterios cosméticos claros para crear productos
            seguros, honestos y agradables de usar.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-6">
          <Reveal direction="right">
            <figure className="relative">
              <SectionImage
                src="/secciones/galeria-1.jpg"
                alt="Plantas y hierbas botánicas: manzanilla y romero"
                sizes="(max-width: 640px) 100vw, 45vw"
                className="aspect-[4/3] w-full rounded-3xl"
              />
              <figcaption className="mt-3 flex items-center gap-2 text-sm text-ink/70">
                <Leaf className="h-4 w-4 text-accent" aria-hidden /> Tradición botánica
              </figcaption>
            </figure>
          </Reveal>
          <Reveal direction="left">
            <figure className="relative">
              <SectionImage
                src="/secciones/ciencia.jpg"
                alt="Detalle de formulación e ingredientes cosméticos de Savia"
                sizes="(max-width: 640px) 100vw, 45vw"
                className="aspect-[4/3] w-full rounded-3xl"
              />
              <figcaption className="mt-3 flex items-center gap-2 text-sm text-ink/70">
                <FlaskConical className="h-4 w-4 text-accent" aria-hidden /> Formulación responsable
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* 6. Bogotá como identidad */}
      <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal blur>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-surface/60 px-4 py-1.5 text-sm text-primary">
            <MapPin className="h-4 w-4 text-accent" aria-hidden /> Bogotá, Colombia
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-primary sm:text-4xl">Hecho en Bogotá</h2>
          <p className="mt-5 max-w-md leading-relaxed text-ink/80">
            Somos una marca local que nace en Bogotá con la intención de crear cosmética cercana,
            accesible y consciente.
          </p>
        </Reveal>
        <Reveal direction="left">
          <SectionImage
            src="/secciones/galeria-5.jpg"
            alt="Aceites y crema de Savia con hierbas aromáticas, hechos en Bogotá"
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="aspect-[16/10] w-full rounded-3xl"
          />
        </Reveal>
      </section>

      {/* 7. Cierre potente + CTA */}
      <section>
        <Reveal blur>
          <div className="mx-auto max-w-3xl rounded-3xl border border-primary/10 bg-surface/50 px-6 py-16 text-center sm:px-12">
            <h2 className="font-display text-3xl font-bold leading-tight text-primary sm:text-4xl">
              Tu piel no necesita más ruido. Necesita cuidado.
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-ink/75">
              Savia es una pausa diaria, una pequeña rutina que recuerda que cuidarte también importa.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/tienda"
                className="rounded-full bg-primary px-8 py-3.5 font-medium text-bg shadow-lg shadow-primary/20 transition hover:opacity-90"
              >
                Ver la tienda
              </Link>
              <a
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-primary/30 px-8 py-3.5 font-medium text-primary transition hover:bg-primary/10"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Escríbenos
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
