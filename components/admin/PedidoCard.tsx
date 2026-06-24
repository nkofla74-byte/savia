"use client";
import { useState } from "react";
import { ESTADOS, ESTADO_LABEL } from "@/lib/admin/estados";
import { cambiarEstadoPedido, eliminarPedido } from "@/lib/admin/actions";
import { formatCOP } from "@/lib/utils";
import type { PedidoRow, PedidoItemRow } from "@/lib/admin/queries";

export function PedidoCard({ pedido, items }: { pedido: PedidoRow; items: PedidoItemRow[] }) {
  const [estado, setEstado] = useState(pedido.estado);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onEstado = async (nuevo: string) => {
    setBusy(true);
    setError(null);
    const prev = estado;
    setEstado(nuevo as typeof estado);
    const res = await cambiarEstadoPedido(pedido.id, nuevo);
    setBusy(false);
    if (!res.ok) {
      setEstado(prev);
      setError(res.error);
    }
  };

  const onEliminar = async () => {
    if (!confirm(`¿Eliminar el pedido ${pedido.referencia}? Esta acción es irreversible.`)) return;
    setBusy(true);
    const res = await eliminarPedido(pedido.id);
    setBusy(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <div className="rounded-2xl border border-primary/10 bg-surface/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-primary">{pedido.referencia}</p>
          <p className="font-medium text-ink">{pedido.nombre} · {pedido.telefono}</p>
          <p className="text-sm text-muted">{pedido.departamento} · {pedido.ciudad} · {pedido.direccion}</p>
          {pedido.notas && <p className="text-sm text-muted">Notas: {pedido.notas}</p>}
          <p className="mt-1 text-xs text-muted">{new Date(pedido.created_at).toLocaleString("es-CO")}</p>
        </div>
        <div className="text-right">
          <p className="font-medium text-ink">{formatCOP(pedido.subtotal_cop)}</p>
          <select
            value={estado}
            disabled={busy}
            onChange={(e) => void onEstado(e.target.value)}
            className="mt-2 rounded-lg border border-primary/20 bg-surface px-2 py-1 text-sm text-ink"
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
            ))}
          </select>
        </div>
      </div>
      <ul className="mt-3 border-t border-primary/10 pt-3 text-sm text-ink/80">
        {items.map((i) => (
          <li key={i.id} className="flex justify-between">
            <span>{i.nombre} ×{i.qty}</span>
            <span className="text-muted">{formatCOP(i.precio_cop * i.qty)}</span>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
      <button type="button" onClick={() => void onEliminar()} disabled={busy} className="mt-3 text-xs text-accent hover:underline disabled:opacity-60">
        Eliminar pedido
      </button>
    </div>
  );
}
