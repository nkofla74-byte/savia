"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { ESTADOS, ESTADO_LABEL, type EstadoPedido } from "@/lib/admin/estados";
import { cambiarEstadoPedido, eliminarPedido } from "@/lib/admin/actions";

export function PedidoAcciones({ id, estadoInicial }: { id: string; estadoInicial: EstadoPedido }) {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoPedido>(estadoInicial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const onEstado = async (nuevo: EstadoPedido) => {
    setBusy(true);
    setError(null);
    setGuardado(false);
    const prev = estado;
    setEstado(nuevo);
    const res = await cambiarEstadoPedido(id, nuevo);
    setBusy(false);
    if (!res.ok) {
      setEstado(prev);
      setError(res.error);
      return;
    }
    setGuardado(true);
    router.refresh();
    setTimeout(() => setGuardado(false), 1600);
  };

  const onEliminar = async () => {
    if (!confirm("¿Eliminar este pedido? Es irreversible.")) return;
    setBusy(true);
    const res = await eliminarPedido(id);
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    router.push("/admin/pedidos");
    router.refresh();
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-ink">Estado del pedido</label>
      <div className="flex items-center gap-2">
        <select
          value={estado}
          disabled={busy}
          onChange={(e) => void onEstado(e.target.value as EstadoPedido)}
          className="flex-1 rounded-xl border border-primary/20 bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
          ))}
        </select>
        {guardado && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <Check className="h-4 w-4" aria-hidden /> Guardado
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      <button
        type="button"
        onClick={() => void onEliminar()}
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 text-xs text-rose-600 transition hover:underline disabled:opacity-60"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Eliminar pedido
      </button>
    </div>
  );
}
