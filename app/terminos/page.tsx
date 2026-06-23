import type { Metadata } from "next";
import { LEGAL } from "@/content/legal";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Savia",
  description: "Términos y condiciones de uso y compra en Savia.",
};

export default function TerminosPage() {
  return (
    <section className="prose-invert max-w-2xl py-16 text-ink/85">
      <h1 className="font-display text-4xl font-bold text-primary">Términos y Condiciones</h1>
      <p className="mt-2 text-sm text-muted">Última actualización: {LEGAL.actualizado}</p>

      <h2 className="mt-8 font-display text-xl text-primary">1. Identificación del comerciante</h2>
      <p className="mt-2">
        Este sitio es operado por {LEGAL.comerciante}, identificado con {LEGAL.documento}, con
        domicilio en {LEGAL.direccion} (en adelante, &quot;Savia&quot;, &quot;nosotros&quot;).
        Correo de contacto: {LEGAL.email}. Atención y pedidos a través de WhatsApp.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">2. Objeto y aceptación</h2>
      <p className="mt-2">
        Estos Términos regulan el uso del sitio y la compra de productos cosméticos ofrecidos por
        Savia. Al navegar el sitio, realizar un pedido o efectuar un pago, el usuario declara ser
        mayor de edad y aceptar íntegramente estos Términos, la Política de Privacidad y la Política
        de Envíos y Devoluciones.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">3. Naturaleza de los productos</h2>
      <p className="mt-2">
        Los productos de Savia son <strong>cosméticos de uso externo</strong>, no son medicamentos y
        no tienen finalidad terapéutica, curativa ni de prevención de enfermedades. Ninguna
        afirmación del sitio constituye una promesa de resultados médicos. Su Notificación Sanitaria
        Obligatoria (NSO) ante el INVIMA se encuentra en trámite conforme a la Decisión 516 de la CAN.
        Realice una prueba de parche antes del primer uso y suspenda su uso ante cualquier reacción.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">4. Precios y disponibilidad</h2>
      <p className="mt-2">
        Los precios se expresan en pesos colombianos (COP) e incluyen los impuestos aplicables. Los
        precios y la disponibilidad pueden cambiar sin previo aviso; el precio vigente es el
        confirmado al momento de aceptar el pedido. Las imágenes son ilustrativas y pueden presentar
        variaciones de color o presentación. Algunos productos son de edición especial o fabricación
        por pedido y pueden tener disponibilidad limitada.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">5. Proceso de compra y pago</h2>
      <p className="mt-2">
        El pedido se arma en el carrito del sitio y se confirma a través de WhatsApp. El pago se
        realiza por Nequi (transferencia) u otros medios acordados. El pedido se considera
        perfeccionado únicamente cuando Savia confirma la recepción efectiva del pago en su cuenta.
        Savia se reserva el derecho de no aceptar o de cancelar pedidos ante indicios de fraude,
        error en el precio, falta de disponibilidad o imposibilidad de verificar el pago, en cuyo
        caso reintegrará los valores efectivamente recibidos.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">6. Derecho de retracto y garantía</h2>
      <p className="mt-2">
        En las ventas a distancia el consumidor puede ejercer el <strong>derecho de retracto</strong>
        dentro de los cinco (5) días hábiles siguientes a la entrega, conforme al artículo 47 de la
        Ley 1480 de 2011, salvo las excepciones legales (por ejemplo, productos perecederos, de uso
        personal por higiene o hechos a la medida). Los productos cuentan con la <strong>garantía
        legal</strong> prevista en los artículos 7 y siguientes de la misma ley. Las condiciones de
        envío, retracto, reversión del pago y devoluciones se detallan en la Política de Envíos y
        Devoluciones.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">7. Uso correcto del sitio</h2>
      <p className="mt-2">
        El usuario se obliga a entregar información veraz y a no usar el sitio para fines ilícitos,
        fraudulentos o que afecten su funcionamiento o derechos de terceros. Savia podrá restringir
        el acceso ante un uso indebido.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">8. Propiedad intelectual</h2>
      <p className="mt-2">
        La marca, el logotipo, los textos, ilustraciones, fotografías y demás contenidos del sitio
        son propiedad de Savia o de sus titulares y están protegidos por la ley. Queda prohibida su
        reproducción o uso sin autorización previa y escrita.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">9. Limitación de responsabilidad</h2>
      <p className="mt-2">
        En la máxima medida permitida por la ley, Savia no será responsable por el uso inadecuado de
        los productos, por reacciones derivadas de no realizar la prueba de parche o de ignorar las
        advertencias e instrucciones, ni por daños indirectos. Nada en estos Términos limita los
        derechos irrenunciables que la ley reconoce al consumidor.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">10. Modificaciones</h2>
      <p className="mt-2">
        Savia puede actualizar estos Términos en cualquier momento. La versión vigente es la
        publicada en el sitio con su fecha de actualización. El uso posterior implica aceptación de
        los cambios.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">11. Ley aplicable y solución de controversias</h2>
      <p className="mt-2">
        Estos Términos se rigen por las leyes de la República de Colombia. Las controversias se
        resolverán ante los jueces competentes de {LEGAL.ciudad}. El consumidor puede presentar sus
        peticiones, quejas y reclamos (PQR) al correo {LEGAL.email} y, de ser el caso, acudir a la
        Superintendencia de Industria y Comercio (SIC).
      </p>
    </section>
  );
}
