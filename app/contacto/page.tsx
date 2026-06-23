import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contacto — Savia",
  description: "Escríbenos: estamos para ayudarte con tu cuidado diario.",
};

export default function ContactoPage() {
  return (
    <section className="mx-auto max-w-2xl py-16">
      <h1 className="font-display text-4xl font-bold text-primary">Contáctanos</h1>
      <p className="mt-4 text-ink/80">
        Estamos aquí para ayudarte. Escríbenos y te responderemos lo antes posible.
      </p>
      <ContactForm />
    </section>
  );
}
