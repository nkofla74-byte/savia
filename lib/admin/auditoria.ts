import { createSupabaseServerClient } from "@/lib/supabase/server-ssr";

// ── Recetas (BOM por presentación) ──────────────────────────────────────────
export type RecetaRow = {
  id: string;
  slug: string;
  ml: number;
  insumo: string;
  cantidad_por_unidad: number;
  unidad: string;
};

export async function getRecetas(): Promise<RecetaRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("recetas").select("*").order("insumo", { ascending: true });
  return (data as RecetaRow[] | null) ?? [];
}

// ── Auditoría (derivada: compras vs producción × receta) ────────────────────
export type AuditoriaFila = {
  insumo: string;
  unidad: string;
  comprado: number;
  consumoEstimado: number;
  existenciaTeorica: number;
};

const clave = (insumo: string, unidad: string) => `${insumo.trim().toLowerCase()}|${unidad.trim().toLowerCase()}`;

export async function getAuditoria(): Promise<{ filas: AuditoriaFila[]; sinReceta: boolean }> {
  const supabase = await createSupabaseServerClient();
  const [recetasRes, prodRes, comprasRes] = await Promise.all([
    supabase.from("recetas").select("slug, ml, insumo, cantidad_por_unidad, unidad"),
    supabase.from("producciones").select("slug, ml, cantidad"),
    supabase.from("insumos_compras").select("insumo, unidad, cantidad"),
  ]);

  const recetas = (recetasRes.data as { slug: string; ml: number; insumo: string; cantidad_por_unidad: number; unidad: string }[] | null) ?? [];
  const producciones = (prodRes.data as { slug: string; ml: number; cantidad: number }[] | null) ?? [];
  const compras = (comprasRes.data as { insumo: string; unidad: string; cantidad: number }[] | null) ?? [];

  // Producido por (slug, ml).
  const producido = new Map<string, number>();
  for (const p of producciones) {
    const k = `${p.slug}:${p.ml}`;
    producido.set(k, (producido.get(k) ?? 0) + p.cantidad);
  }

  const acc = new Map<string, AuditoriaFila>();
  const obtener = (insumo: string, unidad: string): AuditoriaFila => {
    const k = clave(insumo, unidad);
    let fila = acc.get(k);
    if (!fila) {
      fila = { insumo, unidad, comprado: 0, consumoEstimado: 0, existenciaTeorica: 0 };
      acc.set(k, fila);
    }
    return fila;
  };

  // Consumo estimado = Σ producido(slug,ml) × cantidad_por_unidad.
  for (const r of recetas) {
    const unidades = producido.get(`${r.slug}:${r.ml}`) ?? 0;
    if (unidades === 0) continue;
    obtener(r.insumo, r.unidad).consumoEstimado += unidades * r.cantidad_por_unidad;
  }

  // Comprado = Σ compras por insumo+unidad.
  for (const c of compras) {
    obtener(c.insumo, c.unidad).comprado += c.cantidad;
  }

  const filas = [...acc.values()]
    .map((f) => ({ ...f, existenciaTeorica: f.comprado - f.consumoEstimado }))
    .sort((a, b) => a.existenciaTeorica - b.existenciaTeorica);

  return { filas, sinReceta: recetas.length === 0 };
}
