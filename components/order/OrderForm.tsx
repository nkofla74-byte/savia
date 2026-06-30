"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart/store";
import { pedidoSchema, type PedidoInput } from "@/lib/order/schema";
import { crearPedidoBold } from "@/lib/order/actions";
import { DEPARTAMENTOS } from "@/content/colombia";
import { formatCOP } from "@/lib/utils";
import { ENVIO_COP, calcularTotal } from "@/lib/order/envio";

const inputCls =
  "w-full rounded-xl border border-primary/15 bg-surface px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/15";
const labelCls = "mb-1.5 block text-sm font-medium text-ink";
const errCls = "mt-1 text-xs text-accent";

export function OrderForm() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const total = calcularTotal(subtotal);

  const [pay, setPay] = useState<PedidoInput | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PedidoInput>({ resolver: zodResolver(pedidoSchema) });

  const onSubmit = (data: PedidoInput) => {
    setServerError(null);
    setPay(data);
  };

  // Bold: guarda el pedido pendiente y redirige al Link de pago.
  const pagarBold = async () => {
    if (!pay) return;
    setServerError(null);
    setConfirming(true);
    const res = await crearPedidoBold(pay, items);
    if (!res.ok) {
      setServerError(res.error);
      setConfirming(false);
      return;
    }
    window.location.href = res.url;
  };

  if (pay && items.length > 0) {
    return (
      <div className="mx-auto mt-10 max-w-lg space-y-5 rounded-3xl border border-primary/10 bg-surface p-6 shadow-sm sm:p-8">
        {/* Resumen con envío */}
        <div className="space-y-1.5 rounded-2xl border border-primary/10 bg-surface/50 p-4 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatCOP(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Envío nacional</span>
            <span>{formatCOP(ENVIO_COP)}</span>
          </div>
          <div className="flex justify-between border-t border-primary/10 pt-1.5 font-medium text-ink">
            <span>Total</span>
            <span>{formatCOP(total)}</span>
          </div>
        </div>

        <div className="space-y-4 text-ink">
          <p className="text-sm text-muted">
            Te llevamos a la página segura de Bold para pagar con tarjeta, PSE o Nequi. Al confirmarse
            el pago, preparamos tu pedido.
          </p>
          {serverError && <p className="text-sm text-accent">{serverError}</p>}
          <button
            type="button"
            onClick={() => void pagarBold()}
            disabled={confirming}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-bg transition hover:opacity-90 disabled:opacity-60"
          >
            <CreditCard className="h-4 w-4" aria-hidden />
            {confirming ? "Redirigiendo…" : `Pagar ${formatCOP(total)} con Bold`}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPay(null)}
          className="w-full text-center text-sm text-muted transition-colors hover:text-primary"
        >
          ← Volver a mis datos
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto mt-12 max-w-lg rounded-3xl border border-primary/10 bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
          <ShoppingBag className="h-7 w-7 text-primary" aria-hidden />
        </div>
        <p className="mt-4 text-ink/80">Tu carrito está vacío.</p>
        <Link
          href="/tienda"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-sm font-medium text-bg transition hover:opacity-90"
        >
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const totalQty = items.reduce((acc, i) => acc + i.qty, 0);

  return (
    <div className="mt-10 grid gap-8 md:grid-cols-5">
      {/* Resumen del carrito */}
      <aside className="md:col-span-2">
        <div className="md:sticky md:top-24">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="font-display text-lg text-primary">Tu pedido</h2>
            <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {totalQty} {totalQty === 1 ? "artículo" : "artículos"}
            </span>
          </div>
          <ul className="mt-3 divide-y divide-primary/10 rounded-2xl border border-primary/10 bg-surface/50 p-4">
            {items.map((i) => (
              <li key={i.slug} className="flex justify-between gap-3 py-2 text-sm">
                <span className="text-ink">
                  {i.nombre} <span className="text-muted">×{i.qty}</span>
                </span>
                <span className="shrink-0 text-muted">{formatCOP(i.precioCOP * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 px-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Envío nacional</span>
              <span>{formatCOP(ENVIO_COP)}</span>
            </div>
            <div className="flex justify-between border-t border-primary/10 pt-1 font-medium text-ink">
              <span>Total</span>
              <span>{formatCOP(total)}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Formulario de envío */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 rounded-3xl border border-primary/10 bg-surface p-6 shadow-sm sm:p-8 md:col-span-3"
      >
        <h2 className="font-display text-lg text-primary">Datos de envío</h2>

        <div>
          <label className={labelCls}>Nombre completo</label>
          <input {...register("nombre")} className={inputCls} placeholder="Tu nombre" />
          {errors.nombre && <p className={errCls}>{errors.nombre.message}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Teléfono / WhatsApp</label>
            <input {...register("telefono")} className={inputCls} placeholder="3001112233" inputMode="tel" />
            {errors.telefono && <p className={errCls}>{errors.telefono.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Correo electrónico (opcional)</label>
            <input {...register("email")} className={inputCls} placeholder="correo@ejemplo.com" inputMode="email" />
            {errors.email && <p className={errCls}>{errors.email.message}</p>}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Departamento</label>
            <select {...register("departamento")} defaultValue="" className={inputCls}>
              <option value="" disabled>
                Selecciona…
              </option>
              {DEPARTAMENTOS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.departamento && <p className={errCls}>{errors.departamento.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Ciudad / Municipio</label>
            <input {...register("ciudad")} className={inputCls} placeholder="Tu ciudad" />
            {errors.ciudad && <p className={errCls}>{errors.ciudad.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelCls}>Dirección de entrega</label>
          <input {...register("direccion")} className={inputCls} placeholder="Calle 1 #2-3, barrio, referencias" />
          {errors.direccion && <p className={errCls}>{errors.direccion.message}</p>}
        </div>

        <div>
          <label className={labelCls}>Notas (opcional)</label>
          <textarea {...register("notas")} rows={3} className={inputCls} placeholder="Indicaciones para la entrega" />
        </div>

        {serverError && <p className="text-sm text-accent">{serverError}</p>}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-bg transition hover:opacity-90 disabled:opacity-60"
        >
          Continuar al pago
        </button>
        <p className="text-center text-xs text-muted">
          Tus datos solo se usan para coordinar el envío. Sin spam.
        </p>
      </form>
    </div>
  );
}
