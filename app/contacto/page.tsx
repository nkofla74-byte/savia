"use client";

import { useState } from "react";

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573182359277";

export default function ContactoPage() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const texto = `
🌿 Nuevo mensaje desde Savia

👤 Nombre: ${nombre}
📧 Correo: ${correo || "No proporcionado"}
📝 Asunto: ${asunto}

💬 Mensaje:
${mensaje}
`;

    const href = `https://wa.me/${NUMBER}?text=${encodeURIComponent(texto)}`;

    window.open(href, "_blank");
  };

  return (
    <section className="mx-auto max-w-2xl py-16">
      <h1 className="font-display text-4xl font-bold text-primary">
        Contáctanos
      </h1>

      <p className="mt-4 text-ink/80">
        Estamos aquí para ayudarte. Escríbenos y te responderemos lo antes
        posible.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-10 space-y-6 rounded-3xl border border-primary/10 bg-white p-8 shadow-sm"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Nombre completo
          </label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
            placeholder="Tu nombre"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Correo electrónico
          </label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Asunto
          </label>
          <input
            type="text"
            required
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
            placeholder="¿Cómo podemos ayudarte?"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Mensaje
          </label>
          <textarea
            required
            rows={5}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary"
            placeholder="Cuéntanos tu consulta..."
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-primary px-6 py-3 font-medium text-bg transition hover:opacity-90"
        >
          Enviar por WhatsApp
        </button>
      </form>
      
    </section>
  );
}
