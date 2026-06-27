"use client";
import Image from "next/image";
import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { formatCOP } from "@/lib/utils";

const NEQUI = process.env.NEXT_PUBLIC_NEQUI_NUMBER ?? "";

export function NequiPayment({
  reference,
  total,
  onConfirm,
  submitting = false,
  error,
}: {
  reference: string;
  total: number;
  onConfirm: () => void;
  submitting?: boolean;
  error?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    if (!NEQUI) return;
    try {
      await navigator.clipboard.writeText(NEQUI);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard no disponible: el número sigue visible para copiar a mano */
    }
  };

  return (
    <div className="space-y-5 text-ink">
      <div>
        <h2 className="font-display text-lg text-primary">Paga con Nequi</h2>
        <p className="mt-1 text-sm text-muted">
          Transfiere el total por Nequi y envíanos el comprobante por WhatsApp. Despachamos al
          confirmar el pago.
        </p>
      </div>

      <div className="flex items-baseline justify-between rounded-2xl border border-primary/10 bg-surface/50 px-4 py-3">
        <span className="text-sm text-muted">Total a pagar</span>
        <span className="font-display text-2xl font-bold text-primary">{formatCOP(total)}</span>
      </div>

      <div className="grid place-items-center rounded-2xl border border-primary/10 bg-surface/40 p-5">
        <Image
          src="/nequi-qr.png"
          alt="Código QR de pago Nequi de Savia"
          width={180}
          height={180}
          className="h-44 w-44 rounded-lg object-contain"
        />
        <p className="mt-2 text-xs text-muted">Escanea con tu app Nequi</p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-surface px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">Número Nequi</p>
          <p className="truncate font-medium text-ink">
            {NEQUI || "Configura NEXT_PUBLIC_NEQUI_NUMBER"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void copyNumber()}
          disabled={!NEQUI}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>

      <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3">
        <p className="text-xs text-muted">Referencia de tu pedido</p>
        <p className="font-mono text-lg font-bold text-primary">{reference}</p>
        <p className="mt-1 text-xs text-muted">
          Escríbela en la descripción de la transferencia Nequi.
        </p>
      </div>

      <ol className="list-inside list-decimal space-y-1.5 text-sm text-ink/80">
        <li>Abre Nequi → <strong>Enviar</strong> o <strong>Pagar con QR</strong>.</li>
        <li>Escanea el QR o escribe el número.</li>
        <li>Paga exactamente <strong>{formatCOP(total)}</strong>.</li>
        <li>En la descripción escribe tu referencia: <strong className="font-mono">{reference}</strong>.</li>
        <li>Pulsa el botón y envíanos el comprobante por WhatsApp.</li>
      </ol>

      {error && <p className="text-sm text-accent">{error}</p>}

      <button
        type="button"
        onClick={onConfirm}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-bg transition hover:opacity-90 disabled:opacity-60"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        {submitting ? "Registrando…" : "Ya pagué — enviar comprobante por WhatsApp"}
      </button>
    </div>
  );
}
