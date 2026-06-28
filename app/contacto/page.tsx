import type { Metadata } from "next";
import { MessageCircle, Clock, MapPin } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";
import { Reveal } from "@/lib/motion/Reveal";

export const metadata: Metadata = {
  title: "Contacto — Savia",
  description: "Hablemos de tu ritual. Escríbenos y te ayudamos a encontrar el cuidado que se adapta a ti.",
};

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573182359277";
const WA_HREF = `https://wa.me/${NUMBER}?text=${encodeURIComponent("Hola Savia 🌿, quiero hacer una consulta.")}`;
const TEL_DISPLAY = "+57 318 235 9277";

const BULLETS = [
  { emoji: "🌿", t: "Cosmética hecha en Bogotá" },
  { emoji: "🧴", t: "Ingredientes seleccionados" },
  { emoji: "💬", t: "Atención personalizada" },
];

export default function ContactoPage() {
  return (
    <section className="py-12 sm:py-16">
      <Reveal blur className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">Contacto</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">Hablemos de tu ritual</h1>
        <p className="mt-5 text-lg leading-relaxed text-ink/80">
          ¿Tienes dudas sobre un producto? ¿No sabes cuál aceite elegir? Cuéntanos qué estás buscando
          y te ayudaremos a encontrar una opción que se adapte a ti.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
        {/* Columna emocional + tarjeta de contacto */}
        <div className="space-y-8">
          <Reveal direction="right">
            <p className="leading-relaxed text-ink/80">
              Cada piel tiene su propia historia. Si tienes dudas sobre nuestros aceites, ingredientes
              o cuál producto puede acompañarte mejor, escríbenos. Estamos aquí para ayudarte.
            </p>
            <ul className="mt-6 space-y-3">
              {BULLETS.map((b) => (
                <li key={b.t} className="flex items-center gap-3 text-ink/85">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface/70 text-lg" aria-hidden>
                    {b.emoji}
                  </span>
                  {b.t}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal direction="right">
            <div className="rounded-3xl border border-primary/10 bg-surface/50 p-6 sm:p-7">
              <p className="font-display text-lg text-primary">¿Prefieres hablar directamente?</p>
              <ul className="mt-5 space-y-4 text-sm text-ink/80">
                <li className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 shrink-0 text-accent" aria-hidden />
                  <span>
                    WhatsApp ·{" "}
                    <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                      {TEL_DISPLAY}
                    </a>
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="h-5 w-5 shrink-0 text-accent" aria-hidden />
                  <span>Lunes – sábado · 9:00 AM – 6:00 PM</span>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 shrink-0 text-accent" aria-hidden />
                  <span>Bogotá, Colombia</span>
                </li>
              </ul>
            </div>
          </Reveal>
        </div>

        {/* Formulario */}
        <Reveal direction="left">
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
