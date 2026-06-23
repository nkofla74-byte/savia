import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/content/legal";

export const metadata: Metadata = {
  title: "Legales — Savia",
  description: "Información legal de Savia: aviso cosmético INVIMA, términos, privacidad y devoluciones.",
};

const docs = [
  { href: "/terminos", label: "Términos y Condiciones", desc: "Reglas de uso del sitio y de compra." },
  { href: "/privacidad", label: "Política de Privacidad", desc: "Tratamiento de datos personales (Ley 1581 de 2012)." },
  { href: "/envios-devoluciones", label: "Envíos y Devoluciones", desc: "Retracto, reversión de pago y garantía." },
];

export default function LegalesPage() {
  return (
    <section className="prose-invert max-w-2xl py-16 text-ink/85">
      <h1 className="font-display text-4xl font-bold text-primary">Legales</h1>
      <p className="mt-2 text-sm text-muted">Última actualización: {LEGAL.actualizado}</p>

      <h2 className="mt-8 font-display text-xl text-primary">Aviso cosmético (INVIMA)</h2>
      <p className="mt-2">
        Los productos de Savia son <strong>cosméticos de uso externo</strong>. No son medicamentos y
        no tienen finalidad terapéutica, curativa ni de prevención de enfermedades; ninguna
        afirmación del sitio debe interpretarse como una promesa de resultados médicos. Su
        Notificación Sanitaria Obligatoria (NSO) ante el INVIMA se encuentra en trámite conforme a la
        Decisión 516 de la Comunidad Andina.
      </p>
      <p className="mt-2">
        Realice una <strong>prueba de parche</strong> antes del primer uso, evite el contacto con los
        ojos, manténgalos fuera del alcance de los niños y suspenda su uso ante cualquier reacción.
        Los productos frescos o de edición especial pueden tener vida útil corta y requerir
        refrigeración según se indique.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">Documentos legales</h2>
      <ul className="mt-3 space-y-3 not-prose">
        {docs.map((d) => (
          <li key={d.href}>
            <Link href={d.href} className="font-medium text-primary hover:underline">{d.label}</Link>
            <span className="block text-sm text-muted">{d.desc}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-display text-xl text-primary">Contacto y PQR</h2>
      <p className="mt-2">
        Para peticiones, quejas, reclamos o asuntos de datos personales, escríbenos a {LEGAL.email}.
        Responsable: {LEGAL.comerciante}, {LEGAL.direccion}.
      </p>
    </section>
  );
}
