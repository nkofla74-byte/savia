import Link from "next/link";
import { getMensajes } from "@/lib/admin/queries";
import { MensajeCard } from "@/components/admin/MensajeCard";

export const dynamic = "force-dynamic";

export default async function AdminMensajesPage({
  searchParams,
}: {
  searchParams: Promise<{ noleidos?: string }>;
}) {
  const { noleidos } = await searchParams;
  const soloNoLeidos = noleidos === "1";
  const mensajes = await getMensajes({ soloNoLeidos });

  return (
    <section>
      <h1 className="font-display text-3xl font-bold text-primary">Mensajes</h1>

      <div className="mt-6 flex gap-3 text-sm">
        <Link href="/admin/mensajes" className={`rounded-full border px-4 py-1.5 ${!soloNoLeidos ? "border-primary bg-primary text-bg" : "border-primary/30 text-ink/80 hover:border-primary"}`}>Todos</Link>
        <Link href="/admin/mensajes?noleidos=1" className={`rounded-full border px-4 py-1.5 ${soloNoLeidos ? "border-primary bg-primary text-bg" : "border-primary/30 text-ink/80 hover:border-primary"}`}>Sin leer</Link>
      </div>

      <div className="mt-6 space-y-4">
        {mensajes.length === 0 ? (
          <p className="text-muted">No hay mensajes.</p>
        ) : (
          mensajes.map((m) => <MensajeCard key={m.id} mensaje={m} />)
        )}
      </div>
    </section>
  );
}
