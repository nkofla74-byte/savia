"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { registrarVenta } from "@/lib/admin/actions";
import { formatCOP } from "@/lib/utils";
import { ClienteBuscador, type ClienteSel } from "./ClienteBuscador";
import { ProductoPicker, type LineaVenta } from "./ProductoPicker";
import type { ProductoVenta } from "@/lib/admin/ventas";

const METODOS = ["efectivo", "transferencia", "nequi", "daviplata", "tarjeta"] as const;
const METODO_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  nequi: "Nequi",
  daviplata: "Daviplata",
  tarjeta: "Tarjeta",
};

export function NuevaVentaForm({
  clientes,
  productos,
}: {
  clientes: ClienteSel[];
  productos: ProductoVenta[];
}) {
  const router = useRouter();
  const [cliente, setCliente] = useState<ClienteSel | null>(null);
  const [lineas, setLineas] = useState<LineaVenta[]>([]);
  const [metodoPago, setMetodoPago] = useState<string>("efectivo");
  const [estadoPago, setEstadoPago] = useState<"pagado" | "abono" | "pendiente">("pagado");
  const [montoAbonado, setMontoAbonado] = useState<number>(0);
  const [estadoPedido, setEstadoPedido] = useState<"pendiente" | "entregado">("entregado");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = lineas.reduce((s, l) => s + l.precio_cop * l.qty, 0);

  const agregar = (l: Omit<LineaVenta, "qty">) => {
    setLineas((prev) => {
      const i = prev.findIndex((x) => x.slug === l.slug && x.ml === l.ml);
      const actual = prev[i];
      if (actual) {
        const copia = [...prev];
        copia[i] = { ...actual, qty: actual.qty + 1 };
        return copia;
      }
      return [...prev, { ...l, qty: 1 }];
    });
  };

  const cambiarQty = (slug: string, ml: number, delta: number) => {
    setLineas((prev) =>
      prev
        .map((l) => (l.slug === slug && l.ml === ml ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  };

  const quitar = (slug: string, ml: number) =>
    setLineas((prev) => prev.filter((l) => !(l.slug === slug && l.ml === ml)));

  const guardar = async () => {
    setBusy(true);
    setError(null);
    const res = await registrarVenta({
      clienteId: cliente!.id,
      items: lineas.map(({ slug, ml, nombre, precio_cop, qty }) => ({ slug, ml, nombre, precio_cop, qty })),
      metodoPago,
      estadoPago,
      montoAbonado: estadoPago === "abono" ? montoAbonado : undefined,
      estadoPedido,
    });
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    router.push(`/admin/pedidos/${res.id}`);
  };

  const puedeGuardar =
    !!cliente &&
    lineas.length > 0 &&
    !busy &&
    (estadoPago !== "abono" || (montoAbonado > 0 && montoAbonado < total));

  return (
    <div className="space-y-8 pb-28">
      {/* 1 · Cliente */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-primary">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-sm">1</span> Cliente
        </h2>
        <ClienteBuscador clientes={clientes} seleccionado={cliente} onSelect={setCliente} />
      </section>

      {/* 2 · Productos */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-primary">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-sm">2</span> Productos
        </h2>

        {lineas.length > 0 && (
          <ul className="mb-3 space-y-2">
            {lineas.map((l) => (
              <li
                key={`${l.slug}:${l.ml}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-primary/10 bg-surface/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">
                    {l.nombre} <span className="text-sm font-normal text-accent">· {l.ml} ml</span>
                  </p>
                  <p className="text-xs text-muted">{formatCOP(l.precio_cop)} c/u</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cambiarQty(l.slug, l.ml, -1)}
                    aria-label="Restar"
                    className="grid h-7 w-7 place-items-center rounded-full border border-primary/20 text-primary transition hover:bg-primary/10"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-ink">{l.qty}</span>
                  <button
                    type="button"
                    onClick={() => cambiarQty(l.slug, l.ml, 1)}
                    aria-label="Sumar"
                    className="grid h-7 w-7 place-items-center rounded-full border border-primary/20 text-primary transition hover:bg-primary/10"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => quitar(l.slug, l.ml)}
                    aria-label="Quitar"
                    className="grid h-7 w-7 place-items-center rounded-full text-rose-500 transition hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <ProductoPicker productos={productos} onAdd={agregar} />
      </section>

      {/* 3 · Pago y entrega */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-primary">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-sm">3</span> Pago y entrega
        </h2>

        <div className="space-y-4 rounded-2xl border border-primary/10 bg-surface/50 p-4">
          <div>
            <label className="mb-1.5 block text-sm text-muted">Método de pago</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink"
            >
              {METODOS.map((m) => (
                <option key={m} value={m}>{METODO_LABEL[m]}</option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-1.5 block text-sm text-muted">Estado del pago</span>
            <div className="grid grid-cols-3 gap-2">
              {(["pagado", "abono", "pendiente"] as const).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEstadoPago(e)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
                    estadoPago === e
                      ? "border-primary bg-primary text-bg"
                      : "border-primary/20 text-ink/70 hover:bg-primary/5"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {estadoPago === "abono" && (
            <div>
              <label className="mb-1.5 block text-sm text-muted">Monto abonado</label>
              <input
                type="number"
                min={1}
                max={total > 0 ? total - 1 : undefined}
                value={montoAbonado || ""}
                onChange={(e) => setMontoAbonado(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-full rounded-lg border border-primary/20 bg-surface px-3 py-2 text-sm text-ink"
              />
              {total > 0 && (
                <p className="mt-1 text-xs text-muted">
                  Saldo pendiente: {formatCOP(Math.max(0, total - montoAbonado))}
                </p>
              )}
            </div>
          )}

          <div>
            <span className="mb-1.5 block text-sm text-muted">Estado del pedido</span>
            <div className="grid grid-cols-2 gap-2">
              {(["entregado", "pendiente"] as const).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEstadoPedido(e)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
                    estadoPedido === e
                      ? "border-primary bg-primary text-bg"
                      : "border-primary/20 text-ink/70 hover:bg-primary/5"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {/* Barra fija de guardar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-primary/10 bg-bg/95 px-4 py-3 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted">Total</p>
            <p className="font-display text-xl font-bold text-primary">{formatCOP(total)}</p>
          </div>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={!puedeGuardar}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-bg transition hover:opacity-90 disabled:opacity-40"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Guardar venta
          </button>
        </div>
      </div>
    </div>
  );
}
