import { createClient } from "@/lib/supabase/server";
import { ReportesClient } from "./reportes-client";

export default async function ReportesPage() {
  const supabase = await createClient();

  const { data: discipulos } = await supabase.from("discipulos").select("*");
  const { data: encuentros } = await supabase.from("encuentros").select("*");
  const { data: oraciones } = await supabase.from("oraciones").select("*");
  const { data: etapas } = await supabase.from("etapas").select("*").order("orden", { ascending: true });

  const totalDiscipulos = discipulos?.length || 0;
  const totalEncuentros = encuentros?.length || 0;
  const totalOraciones = oraciones?.length || 0;
  const oracionesRespondidas = oraciones?.filter((o) => o.estado === "respondida").length || 0;

  const discipulosPorEtapa = etapas?.map((etapa) => ({
    nombre: etapa.nombre,
    cantidad: discipulos?.filter((d) => d.etapa_id === etapa.id).length || 0,
  })) || [];

  const encuentrosPorMes = obtenerEncuentrosPorMes(encuentros || []);
  const activos = discipulos?.filter((d) => d.estado === "activo").length || 0;
  const completados = discipulos?.filter((d) => d.estado === "completado").length || 0;
  const pausados = discipulos?.filter((d) => d.estado === "pausado").length || 0;
  const retirados = discipulos?.filter((d) => d.estado === "retirado").length || 0;

  return (
    <ReportesClient
      totalDiscipulos={totalDiscipulos}
      totalEncuentros={totalEncuentros}
      totalOraciones={totalOraciones}
      oracionesRespondidas={oracionesRespondidas}
      discipulosPorEtapa={discipulosPorEtapa}
      encuentrosPorMes={encuentrosPorMes}
      activos={activos}
      completados={completados}
      pausados={pausados}
      retirados={retirados}
    />
  );
}

function obtenerEncuentrosPorMes(encuentros: any[]) {
  const meses: Record<string, number> = {};
  const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  encuentros.forEach((e) => {
    const fecha = new Date(e.fecha);
    const key = `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear()}`;
    meses[key] = (meses[key] || 0) + 1;
  });

  return Object.entries(meses).map(([mes, cantidad]) => ({ mes, cantidad }));
}
