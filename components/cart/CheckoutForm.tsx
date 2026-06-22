"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/lib/cart/store";
import { buildWhatsAppMessage } from "@/lib/cart/whatsapp";

const schema = z.object({
  nombre: z.string().min(2, "Tu nombre"),
  telefono: z.string().min(7, "Teléfono válido"),
  ciudad: z.string().min(2, "Ciudad"),
  direccion: z.string().min(4, "Dirección"),
});
type FormValues = z.infer<typeof schema>;

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export function CheckoutForm() {
  const items = useCart((s) => s.items);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormValues) => {
    const { url } = buildWhatsAppMessage(items, data, NUMBER);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const field = (name: keyof FormValues, label: string) => (
    <div>
      <input {...register(name)} placeholder={label} className="w-full rounded-lg border border-primary/20 bg-surface/50 px-3 py-2 text-sm" />
      {errors[name] && <p className="mt-1 text-xs text-accent">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      {field("nombre", "Nombre")}
      {field("telefono", "Teléfono")}
      {field("ciudad", "Ciudad")}
      {field("direccion", "Dirección")}
      <button type="submit" className="mt-2 w-full rounded-full bg-primary py-3 font-medium text-bg hover:opacity-90">
        Pedir por WhatsApp
      </button>
    </form>
  );
}
