import { MessageCircle } from "lucide-react";
import { Reveal } from "@/lib/motion/Reveal";

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export function WhatsAppCTA() {
  const href = `https://wa.me/${NUMBER}?text=${encodeURIComponent("Hola Savia, quiero pedir información 🌿")}`;
  return (
    <section className="py-24">
      <Reveal blur>
        <div className="mx-auto max-w-3xl rounded-3xl border border-primary/10 bg-surface/50 px-6 py-14 text-center sm:px-12">
          <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">
            ¿Lista para probar Savia?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-ink/70">
            Cuéntanos qué buscas y te ayudamos a elegir. Respondemos por WhatsApp, sin compromiso.
          </p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 font-medium text-bg shadow-lg shadow-primary/20 transition hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Escríbenos por WhatsApp
          </a>
        </div>
      </Reveal>
    </section>
  );
}
