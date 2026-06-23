"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactoSchema, type ContactoInput } from "@/lib/contact/schema";
import { enviarMensaje } from "@/lib/contact/actions";
import { buildContactoMessage } from "@/lib/contact/whatsapp";

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573182359277";

const inputCls =
  "w-full rounded-xl border border-primary/20 bg-surface px-4 py-3 text-ink outline-none transition-colors focus:border-primary";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactoInput>({ resolver: zodResolver(contactoSchema) });

  const onSubmit = async (data: ContactoInput) => {
    setServerError(null);
    const res = await enviarMensaje(data);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    const { url } = buildContactoMessage(data, NUMBER);
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
  };

  if (sent) {
    return (
      <div className="mt-10 rounded-3xl border border-primary/10 bg-surface p-8 text-center">
        <p className="font-display text-xl text-primary">¡Mensaje recibido! 🌿</p>
        <p className="mt-2 text-ink/80">Te abrimos WhatsApp para terminar de enviarlo. Te responderemos pronto.</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 rounded-full border border-primary/30 px-6 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5 rounded-3xl border border-primary/10 bg-surface p-8">
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">Nombre completo</label>
        <input {...register("nombre")} className={inputCls} placeholder="Tu nombre" />
        {errors.nombre && <p className="mt-1 text-xs text-accent">{errors.nombre.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-ink">Teléfono / WhatsApp</label>
        <input {...register("telefono")} className={inputCls} placeholder="3001112233" />
        {errors.telefono && <p className="mt-1 text-xs text-accent">{errors.telefono.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-ink">Correo electrónico (opcional)</label>
        <input {...register("email")} className={inputCls} placeholder="correo@ejemplo.com" />
        {errors.email && <p className="mt-1 text-xs text-accent">{errors.email.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-ink">Asunto</label>
        <input {...register("asunto")} className={inputCls} placeholder="¿Cómo podemos ayudarte?" />
        {errors.asunto && <p className="mt-1 text-xs text-accent">{errors.asunto.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-ink">Mensaje</label>
        <textarea {...register("mensaje")} rows={5} className={inputCls} placeholder="Cuéntanos tu consulta..." />
        {errors.mensaje && <p className="mt-1 text-xs text-accent">{errors.mensaje.message}</p>}
      </div>

      {serverError && <p className="text-sm text-accent">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-primary px-6 py-3 font-medium text-bg transition hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
