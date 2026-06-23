"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCart } from "@/lib/cart/store";
import { pedidoSchema, type PedidoInput } from "@/lib/order/schema";
import { crearPedido } from "@/lib/order/actions";
import { generateOrderRef } from "@/lib/cart/reference";
import { buildWhatsAppMessage } from "@/lib/cart/whatsapp";
import { DEPARTAMENTOS } from "@/content/colombia";
import { formatCOP } from "@/lib/utils";

const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573182359277";

const inputCls =
  "w-full rounded-xl border border-primary/20 bg-surface px-4 py-3 text-ink outline-none transition-colors focus:border-primary";

export function OrderForm() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);
  const [done, setDone] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PedidoInput>({ resolver: zodResolver(pedidoSchema) });

  const onSubmit = async (data: PedidoInput) => {
    setServerError(null);
    const referencia = generateOrderRef();
    const res = await crearPedido(data, items, referencia);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    const { url } = buildWhatsAppMessage(items, data, NUMBER, res.referencia);
    window.open(url, "_blank", "noopener,noreferrer");
    clear();
    setDone(res.referencia);
  };

  if (done) {
    return (
      <div className="mt-10 rounded-3xl border border-primary/10 bg-surface p-8 text-center">
        <p className="font-display text-xl text-primary">¡Pedido registrado! 🌿</p>
        <p className="mt-2 text-ink/80">
          Tu referencia es <strong className="font-mono text-primary">{done}</strong>. Te abrimos
          WhatsApp para confirmarlo y coordinar el envío.
        </p>
        <Link href="/tienda" className="mt-6 inline-block rounded-full border border-primary/30 px-6 py-2 text-sm text-primary transition-colors hover:bg-primary/10">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-3xl border border-primary/10 bg-surface p-8 text-center">
        <p className="text-ink/80">Tu carrito está vacío.</p>
        <Link href="/tienda" className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-sm font-medium text-bg transition hover:opacity-90">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-8 md:grid-cols-5">
      {/* Resumen del carrito */}
      <div className="md:col-span-2">
        <h2 className="font-display text-lg text-primary">Tu pedido</h2>
        <ul className="mt-3 divide-y divide-primary/10 rounded-2xl border border-primary/10 bg-surface/50 p-4">
          {items.map((i) => (
            <li key={i.slug} className="flex justify-between py-2 text-sm">
              <span className="text-ink">{i.nombre} ×{i.qty}</span>
              <span className="text-muted">{formatCOP(i.precioCOP * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between px-4 font-medium text-ink">
          <span>Subtotal</span>
          <span>{formatCOP(subtotal)}</span>
        </div>
        <p className="mt-2 px-4 text-xs text-muted">El costo de envío se coordina por WhatsApp según tu ciudad.</p>
      </div>

      {/* Formulario de envío */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-3xl border border-primary/10 bg-surface p-8 md:col-span-3">
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
          <label className="mb-2 block text-sm font-medium text-ink">Departamento</label>
          <select {...register("departamento")} defaultValue="" className={inputCls}>
            <option value="" disabled>Selecciona…</option>
            {DEPARTAMENTOS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.departamento && <p className="mt-1 text-xs text-accent">{errors.departamento.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink">Ciudad / Municipio</label>
          <input {...register("ciudad")} className={inputCls} placeholder="Tu ciudad" />
          {errors.ciudad && <p className="mt-1 text-xs text-accent">{errors.ciudad.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink">Dirección de entrega</label>
          <input {...register("direccion")} className={inputCls} placeholder="Calle 1 #2-3, barrio, referencias" />
          {errors.direccion && <p className="mt-1 text-xs text-accent">{errors.direccion.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink">Notas (opcional)</label>
          <textarea {...register("notas")} rows={3} className={inputCls} placeholder="Indicaciones para la entrega" />
        </div>

        {serverError && <p className="text-sm text-accent">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-primary px-6 py-3 font-medium text-bg transition hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? "Registrando…" : "Confirmar pedido"}
        </button>
      </form>
    </div>
  );
}
