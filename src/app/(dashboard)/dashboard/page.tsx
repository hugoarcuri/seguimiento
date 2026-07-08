"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("discipulos").select("id, etapa_id, estado, lider_id, created_at"),
      supabase
        .from("encuentros")
        .select("id, fecha, discipulo_id, lider_id, tema_tratado")
        .gte("fecha", new Date().toISOString().split("T")[0])
        .order("fecha", { ascending: true })
        .limit(5),
      supabase
        .from("oraciones")
        .select("id, discipulo_id, pedido, estado, fecha")
        .eq("estado", "pendiente")
        .order("fecha", { ascending: false })
        .limit(5),
    ]).then(([discipulosRes, encuentrosRes, oracionesRes]) => {
      const discipulos = discipulosRes.data || [];
      setData({
        totalDiscipulos: discipulos.length,
        nuevos: discipulos.filter((d: any) => d.etapa_id === 1).length,
        consolidacion: discipulos.filter((d: any) => d.etapa_id === 2).length,
        caracter: discipulos.filter((d: any) => d.etapa_id === 3).length,
        servicio: discipulos.filter((d: any) => d.etapa_id === 4).length,
        activos: discipulos.filter((d: any) => d.estado === "activo").length,
        oracionesPendientes: (oracionesRes.data || []).length,
        proximosEncuentros: encuentrosRes.data || [],
        oracionesPendientesList: oracionesRes.data || [],
      });
    });
  }, []);

  if (!data) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return <DashboardClient {...data} />;
}
