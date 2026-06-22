const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export default function ContactoPage() {
  const href = `https://wa.me/${NUMBER}?text=${encodeURIComponent("Hola Savia 🌿")}`;
  return (
    <section className="max-w-xl py-16">
      <h1 className="font-display text-4xl font-bold text-primary">Contacto</h1>
      <p className="mt-4 text-ink/80">La forma más rápida de hablar con nosotros es por WhatsApp.</p>
      <a href={href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block rounded-full bg-primary px-8 py-3 font-medium text-bg hover:opacity-90">Abrir WhatsApp</a>
    </section>
  );
}
