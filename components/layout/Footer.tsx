import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-primary/10 bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 py-12 text-sm text-muted">
        <div className="flex flex-wrap gap-6">
          <Link href="/legales" className="hover:text-primary">Legales</Link>
          <Link href="/sobre" className="hover:text-primary">Sobre Savia</Link>
          <Link href="/contacto" className="hover:text-primary">Contacto</Link>
        </div>
        <p className="mt-6 max-w-2xl">
          Productos cosméticos. No son medicamentos. Notificación Sanitaria Obligatoria (INVIMA) en trámite.
          Realice prueba de parche antes del primer uso.
        </p>
        <p className="mt-4">© {new Date().getFullYear()} Savia · Bogotá, Colombia</p>
      </div>
    </footer>
  );
}
