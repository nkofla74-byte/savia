import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-primary/10 bg-surface/90">

      <div className="mx-auto max-w-7xl px-5 py-16">

        <div className="grid gap-12 md:grid-cols-4">


          {/* Marca */}
          <div className="md:col-span-2">

            <h3 className="text-2xl font-semibold tracking-wide text-primary">
              Savia
            </h3>

            <p className="mt-4 max-w-md text-sm leading-7 text-muted">
              Cosmética consciente creada para acompañar el cuidado
              diario de tu piel con ingredientes seleccionados
              y una filosofía inspirada en la naturaleza.
            </p>


            <div className="mt-6 rounded-2xl border border-primary/10 bg-background/40 p-5">

              <p className="text-sm font-medium text-primary">
                Información importante
              </p>

              <p className="mt-2 text-xs leading-5 text-muted">
                Productos cosméticos. No son medicamentos.
                Notificación Sanitaria Obligatoria (INVIMA) en trámite.
                Recomendamos realizar prueba de parche antes del primer uso.
              </p>

            </div>

          </div>



          {/* Contacto */}
          <div>

            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-primary">
              Contacto
            </h4>


            <div className="space-y-4 text-sm text-muted">

              <p>
                📍 Carrera 116B #80A-69
                <br />
                Barrio El Cortijo
                <br />
                Bogotá, Colombia
              </p>


              <p>
                📞 +57 300 000 0000
              </p>


              <p>
                ✉️ contacto@savia.com
              </p>


              <p>
                🕒 Lunes - Sábado
                <br />
                9:00 AM - 6:00 PM
              </p>

            </div>

          </div>




          {/* Navegación */}
          <div>

            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-primary">
              Explorar
            </h4>


            <nav className="flex flex-col gap-3 text-sm text-muted">

              <Link
                href="/sobre"
                className="transition hover:text-primary"
              >
                Sobre Savia
              </Link>


              <Link
                href="/contacto"
                className="transition hover:text-primary"
              >
                Contacto
              </Link>


              <Link
                href="/envios-devoluciones"
                className="transition hover:text-primary"
              >
                Envíos y Devoluciones
              </Link>


              <Link
                href="/terminos"
                className="transition hover:text-primary"
              >
                Términos y Condiciones
              </Link>


              <Link
                href="/privacidad"
                className="transition hover:text-primary"
              >
                Privacidad
              </Link>


            </nav>


            <div className="mt-8">

              <p className="mb-3 text-sm font-medium text-primary">
                Síguenos
              </p>

              <div className="flex gap-3">

                <span className="rounded-full border border-primary/20 px-3 py-1 text-xs text-muted">
                  Instagram
                </span>

                <span className="rounded-full border border-primary/20 px-3 py-1 text-xs text-muted">
                  Facebook
                </span>

              </div>

            </div>


          </div>


        </div>



        {/* Barra inferior */}

        <div className="mt-14 flex flex-col gap-4 border-t border-primary/10 pt-8 text-xs text-muted md:flex-row md:items-center md:justify-between">

          <p>
            © {new Date().getFullYear()} Savia · Bogotá, Colombia
          </p>


          <div className="flex items-center gap-4">

            <p>
              Cuidado natural para tu piel 🌱
            </p>

            <Link
              href="/admin"
              className="transition hover:text-primary"
            >
              Admin
            </Link>

          </div>

        </div>


      </div>

    </footer>
  );
}