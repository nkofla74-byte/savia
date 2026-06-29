import Image from "next/image";

const SHOTS = [
  { src: "/secciones/galeria-1.jpg", alt: "Aceites botánicos con manzanilla y romero" },
  { src: "/secciones/galeria-2.jpg", alt: "Aceites dorados con pétalos de rosa" },
  { src: "/secciones/galeria-3.jpg", alt: "Frascos ámbar con flores y plantas" },
  { src: "/secciones/galeria-4.jpg", alt: "Goteros de aceite con menta fresca" },
  { src: "/secciones/galeria-5.jpg", alt: "Aceites y crema con hierbas aromáticas" },
];

function Tarjeta({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="relative aspect-[4/3] w-56 shrink-0 overflow-hidden rounded-3xl border border-primary/10 sm:w-64 lg:w-72">
      <Image src={src} alt={alt} fill sizes="(max-width: 640px) 60vw, 18rem" className="object-cover" />
    </figure>
  );
}

// Dos filas que se desplazan en sentidos opuestos, siempre en movimiento.
function Fila({ animClass }: { animClass: string }) {
  return (
    <div className={`flex w-max gap-4 ${animClass} hover:[animation-play-state:paused] sm:gap-6`}>
      {[...SHOTS, ...SHOTS].map((s, i) => (
        <Tarjeta key={`${s.src}-${i}`} src={s.src} alt={s.alt} />
      ))}
    </div>
  );
}

export function HorizontalGallery() {
  return (
    <section className="py-20 sm:py-24">
      <div className="px-1">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Naturaleza en cada gota</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-primary sm:text-4xl">Botánica que se siente</h2>
      </div>

      <div className="relative left-1/2 mt-10 w-screen -translate-x-1/2 space-y-4 overflow-hidden sm:space-y-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-bg to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-bg to-transparent sm:w-24" />
        <Fila animClass="animate-[marquee_55s_linear_infinite]" />
        <Fila animClass="animate-[marquee-reverse_48s_linear_infinite]" />
      </div>
    </section>
  );
}
