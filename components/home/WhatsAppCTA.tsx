const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export function WhatsAppCTA() {
  const href = `https://wa.me/${NUMBER}?text=${encodeURIComponent("Hola Savia, quiero pedir información 🌿")}`;
  return (
    <section className="py-24 text-center">
      <h2 className="font-display text-3xl font-bold text-primary">¿Lista para probar Savia?</h2>
      <a href={href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block rounded-full bg-primary px-8 py-3 font-medium text-bg transition-opacity hover:opacity-90">
        Escríbenos por WhatsApp
      </a>
    </section>
  );
}
