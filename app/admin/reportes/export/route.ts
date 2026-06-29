import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";
import { generarReporteCSV, type TipoReporte } from "@/lib/admin/reportes";

const TIPOS: TipoReporte[] = [
  "ventas-por-vendedor",
  "productos-mas-vendidos",
  "clientes-con-saldo",
  "inventario-actual",
  "compras-insumos",
];

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const tipo = req.nextUrl.searchParams.get("tipo");
  if (!tipo || !TIPOS.includes(tipo as TipoReporte)) {
    return new NextResponse("Reporte no válido", { status: 400 });
  }

  const { filename, csv } = await generarReporteCSV(tipo as TipoReporte);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
