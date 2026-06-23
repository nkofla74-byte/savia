import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-primary/10 bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 py-12 text-sm text-muted">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/sobre" className="hover:text-primary">Sobre Savia</Link>
          <Link href="/contacto" className="hover:text-primary">Contacto</Link>
          <Link href="/terminos" className="hover:text-primary">Términos y Condiciones</Link>
          <Link href="/privacidad" className="hover:text-primary">Privacidad</Link>
          <Link href="/envios-devoluciones" className="hover:text-primary">Envíos y Devoluciones</Link>
          <Link href="/legales" className="hover:text-primary">Legales</Link>
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
