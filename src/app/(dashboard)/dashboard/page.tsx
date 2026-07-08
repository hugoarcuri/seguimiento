import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: discipulos } = await supabase
    .from("discipulos")
    .select("id, etapa_id, estado, lider_id, created_at");

  const { data: encuentros } = await supabase
    .from("encuentros")
    .select("id, fecha, discipulo_id, lider_id, tema_tratado")
    .gte("fecha", new Date().toISOString().split("T")[0])
    .order("fecha", { ascending: true })
    .limit(5);

  const { data: oraciones } = await supabase
    .from("oraciones")
    .select("id, discipulo_id, pedido, estado, fecha")
    .eq("estado", "pendiente")
    .order("fecha", { ascending: false })
    .limit(5);

  const totalDiscipulos = discipulos?.length || 0;
  const nuevos = discipulos?.filter((d) => d.etapa_id === 1).length || 0;
  const consolidacion = discipulos?.filter((d) => d.etapa_id === 2).length || 0;
  const caracter = discipulos?.filter((d) => d.etapa_id === 3).length || 0;
  const servicio = discipulos?.filter((d) => d.etapa_id === 4).length || 0;
  const activos = discipulos?.filter((d) => d.estado === "activo").length || 0;
  const oracionesPendientes = oraciones?.length || 0;

  return (
    <DashboardClient
      totalDiscipulos={totalDiscipulos}
      nuevos={nuevos}
      consolidacion={consolidacion}
      caracter={caracter}
      servicio={servicio}
      activos={activos}
      oracionesPendientes={oracionesPendientes}
      proximosEncuentros={encuentros || []}
      oracionesPendientesList={oraciones || []}
    />
  );
}
