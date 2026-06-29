"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet } from "lucide-react";
import { registrarAbono } from "@/lib/admin/actions";
import { formatCOP } from "@/lib/utils";

const METODOS = ["efectivo", "transferencia", "nequi", "daviplata", "tarjeta"];

export function RegistrarAbono({ pedidoId, saldo }: { pedidoId: string; saldo: number }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [monto, setMonto] = useState<number>(saldo);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 rounded-lg border border-primary/20 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10"
      >
        <Wallet className="h-4 w-4" aria-hidden /> Registrar abono
      </button>
    );
  }

  const guardar = async () => {
    setBusy(true);
    setError(null);
    const res = await registrarAbono({ pedidoId, monto, metodoPago });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setAbierto(false);
    router.refresh();
  };

  return (
    <div className="mt-2 space-y-2 rounded-xl border border-primary/10 bg-surface/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={1}
          max={saldo}
          value={monto || ""}
          onChange={(e) => setMonto(Math.max(0, Number(e.target.value) || 0))}
          className="w-28 rounded-lg border border-primary/20 bg-surface px-3 py-1.5 text-sm text-ink"
        />
        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          className="rounded-lg border border-primary/20 bg-surface px-3 py-1.5 text-sm capitalize text-ink"
        >
          {METODOS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={busy || monto <= 0 || monto > saldo}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-bg transition hover:opacity-90 disabled:opacity-40"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />} Guardar
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="px-2 py-1.5 text-sm text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
      <p className="text-xs text-muted">Saldo actual: {formatCOP(saldo)}</p>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
