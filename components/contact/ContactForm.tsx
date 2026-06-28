"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactoSchema, type ContactoInput, MOTIVOS, PIELES } from "@/lib/contact/schema";
import { enviarMensaje } from "@/lib/contact/actions";
import { buildContactoMessage } from "@/lib/contact/whatsapp";

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573182359277";

const MOTIVO_EMOJI: Record<string, string> = {
  "Recomendarme un producto": "🌿",
  "Consulta sobre ingredientes": "🧴",
  "Pedido o envío": "📦",
  Otro: "💬",
};

const inputCls =
  "w-full rounded-xl border border-primary/20 bg-surface px-4 py-3 text-ink outline-none transition-colors focus:border-primary";

const chipCls =
  "cursor-pointer rounded-full border border-primary/20 px-4 py-2 text-sm text-ink/80 transition hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-bg peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40";

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
      <div className="rounded-3xl border border-primary/10 bg-surface p-8 text-center">
        <p className="font-display text-xl text-primary">¡Consulta recibida! 🌿</p>
        <p className="mt-2 text-ink/80">Te abrimos WhatsApp para terminar de enviarla. Te responderemos personalmente.</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 rounded-full border border-primary/30 px-6 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
        >
          Enviar otra consulta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-3xl border border-primary/10 bg-surface p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold text-primary">Envíanos un mensaje</h2>

      <div>
        <label className="mb-2 block text-sm font-medium text-ink">Nombre</label>
        <input {...register("nombre")} className={inputCls} placeholder="¿Cómo podemos llamarte?" />
        {errors.nombre && <p className="mt-1 text-xs text-accent">{errors.nombre.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-ink">WhatsApp</label>
        <input {...register("telefono")} inputMode="tel" className={inputCls} placeholder="Tu número para responderte" />
        {errors.telefono && <p className="mt-1 text-xs text-accent">{errors.telefono.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-ink">Correo electrónico (opcional)</label>
        <input {...register("email")} className={inputCls} placeholder="correo@ejemplo.com" />
        {errors.email && <p className="mt-1 text-xs text-accent">{errors.email.message}</p>}
      </div>

      <fieldset>
        <legend className="mb-3 block text-sm font-medium text-ink">¿En qué podemos ayudarte?</legend>
        <div className="flex flex-wrap gap-2">
          {MOTIVOS.map((m, i) => (
            <div key={m}>
              <input type="radio" id={`motivo-${i}`} value={m} {...register("motivo")} className="peer sr-only" />
              <label htmlFor={`motivo-${i}`} className={chipCls}>
                <span aria-hidden>{MOTIVO_EMOJI[m]}</span> {m}
              </label>
            </div>
          ))}
        </div>
        {errors.motivo && <p className="mt-2 text-xs text-accent">{errors.motivo.message}</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-1 block text-sm font-medium text-ink">Cuéntanos un poco de ti</legend>
        <p className="mb-3 text-xs text-ink/60">Mi piel es… (opcional, solo para orientarte mejor)</p>
        <div className="flex flex-wrap gap-2">
          {PIELES.map((p, i) => (
            <div key={p}>
              <input type="radio" id={`piel-${i}`} value={p} {...register("piel")} className="peer sr-only" />
              <label htmlFor={`piel-${i}`} className={chipCls}>{p}</label>
            </div>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="mb-2 block text-sm font-medium text-ink">Mensaje</label>
        <textarea
          {...register("mensaje")}
          rows={5}
          className={inputCls}
          placeholder="Cuéntanos qué estás buscando, cómo es tu rutina o qué quieres mejorar…"
        />
        {errors.mensaje && <p className="mt-1 text-xs text-accent">{errors.mensaje.message}</p>}
      </div>

      {serverError && <p className="text-sm text-accent">{serverError}</p>}

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-primary px-6 py-3.5 font-medium text-bg transition hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? "Enviando…" : "Enviar consulta 🌿"}
        </button>
        <p className="mt-3 text-center text-xs text-ink/60">
          Respondemos personalmente. Nada de respuestas automáticas sin sentido.
        </p>
      </div>
    </form>
  );
}
