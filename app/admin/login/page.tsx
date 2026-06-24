"use client";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${SITE}/admin/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setError("No se pudo enviar el enlace. Verifica el correo.");
      return;
    }
    setSent(true);
  };

  return (
    <section className="mx-auto max-w-sm py-24">
      <h1 className="font-display text-3xl font-bold text-primary">Panel Savia</h1>
      {sent ? (
        <p className="mt-6 rounded-xl border border-primary/10 bg-surface p-6 text-ink/80">
          Te enviamos un enlace de acceso a <strong>{email}</strong>. Revisa tu correo.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full rounded-xl border border-primary/20 bg-surface px-4 py-3 text-ink outline-none focus:border-primary"
          />
          {error && <p className="text-sm text-accent">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-3 font-medium text-bg transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviar enlace de acceso"}
          </button>
        </form>
      )}
    </section>
  );
}
