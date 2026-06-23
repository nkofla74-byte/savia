export const USES = ["cuerpo", "cabello", "rostro", "masaje"] as const;
export type Uso = (typeof USES)[number];

export type Product = {
  slug: string;
  nombre: string;
  linea: string;
  usos: Uso[];
  tamanoMl: number;
  precioCOP: number;
  descripcion: string;
  porQueFunciona: string;
  ingredientes: string[];
  modoDeUso: string;
  advertencia: string;
  ilustracion: "lavanda" | "cafe" | "cacao" | "menta" | "uva" | "rosa";
  /** Ruta a la foto del producto en /public (ej. "/products/calma.png"). Si falta, se usa la ilustración SVG. */
  imagen?: string;
  destacado: boolean;
  edicionEspecial?: boolean;
};

const ADVERTENCIA =
  "Uso cosmético externo. Realice una prueba de parche antes del primer uso. Evite el contacto con los ojos.";

export const products: Product[] = [
  {
    slug: "calma", nombre: "Calma", linea: "Relajante · Lavanda",
    usos: ["cuerpo", "masaje"], tamanoMl: 100, precioCOP: 13900,
    descripcion: "Aceite corporal de masaje que suaviza la piel; su aroma a lavanda ayuda a relajar.",
    porQueFunciona: "La lavanda aporta un aroma asociado a la sensación de calma; la base de aceites vegetales suaviza y nutre la piel.",
    ingredientes: ["Aceite de almendra dulce", "Aceite de coco fraccionado", "Aceite esencial de lavanda", "Vitamina E"],
    modoDeUso: "Aplica de noche, después del baño, con masajes suaves en brazos, pecho y cuello.",
    advertencia: ADVERTENCIA, ilustracion: "lavanda", imagen: "/products/calma.png", destacado: true,
  },
  {
    slug: "despierta", nombre: "Despierta", linea: "Café Energizante",
    usos: ["cuerpo", "masaje"], tamanoMl: 100, precioCOP: 13900,
    descripcion: "Aceite vigorizante con café; aroma café-cítrico, ideal para piernas.",
    porQueFunciona: "La cafeína se asocia a la sensación de ligereza; la fórmula deja la piel suave con un aroma estimulante.",
    ingredientes: ["Aceite de girasol", "Extracto de café", "Aceite esencial cítrico", "Vitamina E"],
    modoDeUso: "Masajea en piernas y zonas a tonificar, con movimientos ascendentes.",
    advertencia: ADVERTENCIA, ilustracion: "cafe", imagen: "/products/despierta.png", destacado: false,
  },
  {
    slug: "cacao", nombre: "Cacao", linea: "Nutritivo",
    usos: ["cuerpo"], tamanoMl: 100, precioCOP: 13900,
    descripcion: "Aceite muy emoliente para piel seca; aroma envolvente a cacao.",
    porQueFunciona: "Los lípidos del cacao son altamente emolientes y ayudan a nutrir la piel seca.",
    ingredientes: ["Manteca/aceite de cacao", "Aceite de almendra dulce", "Vitamina E"],
    modoDeUso: "Aplica sobre piel limpia, especialmente en zonas secas.",
    advertencia: ADVERTENCIA, ilustracion: "cacao", destacado: false,
  },
  {
    slug: "frescor", nombre: "Frescor", linea: "Menta Refrescante",
    usos: ["cuerpo"], tamanoMl: 100, precioCOP: 13900,
    descripcion: "Aceite ligero de aroma refrescante; de rápida absorción.",
    porQueFunciona: "La menta aporta una sensación refrescante; la base ligera se absorbe rápido sin sensación grasa.",
    ingredientes: ["Aceite de girasol", "Aceite esencial de menta", "Vitamina E"],
    modoDeUso: "Aplica en cuerpo tras el baño para una sensación fresca.",
    advertencia: ADVERTENCIA, ilustracion: "menta", imagen: "/products/frescor.jpeg", destacado: false,
  },
  {
    slug: "raiz", nombre: "Raíz", linea: "Capilar Acondicionador",
    usos: ["cabello"], tamanoMl: 100, precioCOP: 13900,
    descripcion: "Suaviza, da brillo y reduce el frizz; aroma herbal.",
    porQueFunciona: "Los aceites vegetales ayudan a sellar la cutícula del cabello, aportando brillo y suavidad.",
    ingredientes: ["Aceite de coco", "Aceite de argán", "Aceite esencial herbal"],
    modoDeUso: "Aplica una pequeña cantidad en puntas y medios; no enjuagar.",
    advertencia: ADVERTENCIA, ilustracion: "uva", imagen: "/products/raiz.jpeg", destacado: false,
  },
  {
    slug: "luz", nombre: "Luz", linea: "Sérum Facial",
    usos: ["rostro"], tamanoMl: 30, precioCOP: 21900,
    descripcion: "Aporta luminosidad y suavidad; mejora la apariencia de la elasticidad. Sin fragancia.",
    porQueFunciona: "El argán y la semilla de uva ayudan a mejorar la apariencia de la piel y a reforzar su sensación de suavidad.",
    ingredientes: ["Aceite de argán", "Aceite de semilla de uva", "Vitamina E"],
    modoDeUso: "Aplica unas gotas en el rostro por la noche, sobre piel limpia.",
    advertencia: ADVERTENCIA, ilustracion: "uva", imagen: "/products/luz.jpeg", destacado: true,
  },
  {
    slug: "rocio-de-rosas", nombre: "Rocío de Rosas", linea: "Tónico facial",
    usos: ["rostro"], tamanoMl: 200, precioCOP: 13900,
    descripcion: "Tónico facial de agua de rosas; producto fresco, edición especial por pedido.",
    porQueFunciona: "El agua de rosas aporta una sensación refrescante y de confort a la piel del rostro.",
    ingredientes: ["Agua de rosas", "Conservante cosmético apto"],
    modoDeUso: "Aplica con algodón sobre el rostro limpio. Mantener refrigerado.",
    advertencia: ADVERTENCIA + " Producto fresco de vida útil corta; conservar en frío.",
    ilustracion: "rosa", imagen: "/products/agua_de_rosas.jpeg", destacado: false, edicionEspecial: true,
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
