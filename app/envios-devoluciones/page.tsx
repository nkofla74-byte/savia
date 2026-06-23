import type { Metadata } from "next";
import { LEGAL } from "@/content/legal";

export const metadata: Metadata = {
  title: "Envíos y Devoluciones — Savia",
  description: "Política de envíos, derecho de retracto, reversión del pago y garantía de Savia.",
};

export default function EnviosDevolucionesPage() {
  return (
    <section className="prose-invert max-w-2xl py-16 text-ink/85">
      <h1 className="font-display text-4xl font-bold text-primary">Envíos y Devoluciones</h1>
      <p className="mt-2 text-sm text-muted">Última actualización: {LEGAL.actualizado}</p>

      <h2 className="mt-8 font-display text-xl text-primary">1. Cobertura y tiempos de envío</h2>
      <p className="mt-2">
        Realizamos entregas en {LEGAL.ciudad} y envíos a nivel nacional a través de transportadoras
        aliadas. Los tiempos de entrega son estimados y dependen de la ciudad de destino y de la
        transportadora; se confirman por WhatsApp al momento de coordinar el pedido. Los despachos se
        realizan una vez confirmado el pago.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">2. Costos de envío</h2>
      <p className="mt-2">
        El costo de envío se informa antes de confirmar el pedido y puede variar según el destino y
        el peso. Cualquier promoción de envío se anunciará expresamente.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">3. Derecho de retracto</h2>
      <p className="mt-2">
        Conforme al artículo 47 de la Ley 1480 de 2011, en las ventas a distancia el consumidor puede
        retractarse dentro de los <strong>cinco (5) días hábiles</strong> siguientes a la entrega del
        producto. Para ejercerlo, el producto debe devolverse en las mismas condiciones en que se
        recibió. Una vez recibido y verificado el producto, se reintegrará el dinero pagado. Los
        costos de transporte de la devolución, en este caso, corren por cuenta del consumidor.
      </p>
      <p className="mt-2">
        <strong>Excepciones:</strong> el retracto no aplica a productos perecederos, de uso personal
        por razones de higiene una vez abiertos, ni a productos de edición especial o elaborados por
        pedido (por ejemplo, tónicos frescos de vida útil corta), conforme a las excepciones legales.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">4. Reversión del pago</h2>
      <p className="mt-2">
        De acuerdo con el artículo 51 de la Ley 1480 de 2011, el consumidor podrá solicitar la
        reversión del pago cuando sea víctima de fraude, la operación no sea solicitada, el producto
        no sea recibido, no corresponda a lo solicitado o sea defectuoso. La solicitud debe
        presentarse dentro de los cinco (5) días hábiles siguientes al conocimiento del hecho, al
        correo {LEGAL.email}.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">5. Garantía legal</h2>
      <p className="mt-2">
        Todos los productos cuentan con la garantía legal de los artículos 7 y siguientes de la Ley
        1480 de 2011. Si el producto presenta un defecto de calidad o idoneidad, el consumidor tiene
        derecho a la reparación, reposición o devolución del dinero, según corresponda. Las
        reclamaciones de garantía se gestionan al correo {LEGAL.email} o por WhatsApp.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">6. Productos cosméticos</h2>
      <p className="mt-2">
        Por tratarse de productos cosméticos de uso externo, recomendamos verificar el sellado y el
        estado del producto al recibirlo. Realice una prueba de parche antes del primer uso. Estos
        productos no son medicamentos y no sustituyen un tratamiento médico.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">7. Cómo solicitar una devolución o reclamo</h2>
      <p className="mt-2">
        Escríbenos al correo {LEGAL.email} o por WhatsApp indicando tu nombre, la referencia del
        pedido, el motivo y, de ser posible, evidencia (fotos). Te confirmaremos el procedimiento a
        seguir dentro de los términos legales.
      </p>
    </section>
  );
}
