import type { Metadata } from "next";
import { LEGAL } from "@/content/legal";

export const metadata: Metadata = {
  title: "Política de Privacidad — Savia",
  description: "Política de tratamiento de datos personales de Savia (Ley 1581 de 2012).",
};

export default function PrivacidadPage() {
  return (
    <section className="prose-invert max-w-2xl py-16 text-ink/85">
      <h1 className="font-display text-4xl font-bold text-primary">Política de Tratamiento de Datos Personales</h1>
      <p className="mt-2 text-sm text-muted">Última actualización: {LEGAL.actualizado}</p>

      <p className="mt-6">
        En cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas
        concordantes, Savia informa su política de tratamiento de datos personales.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">1. Responsable del tratamiento</h2>
      <p className="mt-2">
        {LEGAL.comerciante}, identificado con {LEGAL.documento}, domicilio en {LEGAL.direccion}.
        Canal de contacto para asuntos de datos personales: {LEGAL.email}.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">2. Datos que recolectamos</h2>
      <p className="mt-2">
        Recolectamos los datos que el usuario nos suministra para gestionar su pedido: nombre,
        número de teléfono/WhatsApp, ciudad y dirección de entrega, y la información del pedido. No
        recolectamos datos sensibles ni datos de menores de edad de forma intencional.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">3. Finalidades</h2>
      <p className="mt-2">
        Tratamos los datos para: (i) procesar, coordinar y entregar los pedidos; (ii) verificar y
        gestionar los pagos; (iii) comunicarnos con el cliente sobre su compra y atención
        postventa; (iv) atender peticiones, quejas y reclamos; y (v) cumplir obligaciones legales y
        contables. Solo enviaremos comunicaciones promocionales si el titular lo autoriza
        expresamente.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">4. Autorización</h2>
      <p className="mt-2">
        Al suministrar sus datos para realizar un pedido, el titular autoriza su tratamiento conforme
        a esta política. La autorización puede ser revocada en cualquier momento, sin efectos
        retroactivos, salvo deberes legales de conservación.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">5. Derechos del titular</h2>
      <p className="mt-2">
        Conforme al artículo 8 de la Ley 1581 de 2012, el titular puede: conocer, actualizar y
        rectificar sus datos; solicitar prueba de la autorización; ser informado del uso dado a sus
        datos; presentar quejas ante la SIC; revocar la autorización y solicitar la supresión de los
        datos cuando proceda; y acceder gratuitamente a ellos.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">6. Cómo ejercer sus derechos</h2>
      <p className="mt-2">
        El titular puede ejercer sus derechos enviando una solicitud al correo {LEGAL.email},
        indicando su nombre, identificación, la solicitud concreta y los datos de contacto.
        Atenderemos las consultas en un máximo de diez (10) días hábiles y los reclamos en un máximo
        de quince (15) días hábiles, conforme a la ley.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">7. Conservación y seguridad</h2>
      <p className="mt-2">
        Conservamos los datos por el tiempo necesario para las finalidades descritas y para cumplir
        obligaciones legales. Adoptamos medidas razonables de seguridad para proteger la información
        contra acceso no autorizado, pérdida o alteración.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">8. Transferencia y encargados</h2>
      <p className="mt-2">
        Para operar (mensajería/WhatsApp, transportadoras, pasarelas o servicios de pago) podemos
        compartir los datos estrictamente necesarios con terceros que actúan como encargados, quienes
        deben tratarlos conforme a esta política y a la ley. No vendemos datos personales.
      </p>

      <h2 className="mt-8 font-display text-xl text-primary">9. Vigencia</h2>
      <p className="mt-2">
        Esta política rige desde su publicación y puede ser actualizada. La versión vigente es la
        publicada en el sitio con su fecha de actualización.
      </p>
    </section>
  );
}
