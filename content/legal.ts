// Datos del comerciante para las páginas legales (fuente única de verdad).
// IMPORTANTE: reemplaza los valores entre corchetes por los datos reales antes
// de publicar. Estos campos son obligatorios bajo el Estatuto del Consumidor
// (Ley 1480 de 2011) y la Ley de Protección de Datos (Ley 1581 de 2012).
export const LEGAL = {
  /** Razón social o nombre completo del comerciante responsable. */
  comerciante: "[RAZÓN SOCIAL O NOMBRE DEL COMERCIANTE]",
  /** NIT (si es empresa) o número de cédula (si es persona natural). */
  documento: "[NIT o C.C.]",
  /** Dirección física de notificaciones. */
  direccion: "[DIRECCIÓN], Bogotá D.C., Colombia",
  /** Correo electrónico de contacto y de atención de PQR / datos personales. */
  email: "[CORREO ELECTRÓNICO DE CONTACTO]",
  ciudad: "Bogotá D.C., Colombia",
  /** Fecha de última actualización de los documentos legales. */
  actualizado: "22 de junio de 2026",
} as const;
