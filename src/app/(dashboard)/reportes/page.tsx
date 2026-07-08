"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ReportesClient } from "./reportes-client";

export default function ReportesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("discipulos").select("*"),
      supabase.from("encuentros").select("*"),
      supabase.from("oraciones").select("*"),
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
    ]).then(([discipulosRes, encuentrosRes, oracionesRes, etapasRes]) => {
      const discipulos = discipulosRes.data || [];
      const encuentros = encuentrosRes.data || [];
      const oraciones = oracionesRes.data || [];
      const etapas = etapasRes.data || [];

      const discipulosPorEtapa = etapas.map((etapa: any) => ({
        nombre: etapa.nombre,
        cantidad: discipulos.filter((d: any) => d.etapa_id === etapa.id).length,
      }));

      const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const meses: Record<string, number> = {};
      encuentros.forEach((e: any) => {
        const fecha = new Date(e.fecha);
        const key = `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear()}`;
        meses[key] = (meses[key] || 0) + 1;
      });

      setData({
        totalDiscipulos: discipulos.length,
        totalEncuentros: encuentros.length,
        totalOraciones: oraciones.length,
        oracionesRespondidas: oraciones.filter((o: any) => o.estado === "respondida").length,
        discipulosPorEtapa,
        encuentrosPorMes: Object.entries(meses).map(([mes, cantidad]) => ({ mes, cantidad })),
        activos: discipulos.filter((d: any) => d.estado === "activo").length,
        completados: discipulos.filter((d: any) => d.estado === "completado").length,
        pausados: discipulos.filter((d: any) => d.estado === "pausado").length,
        retirados: discipulos.filter((d: any) => d.estado === "retirado").length,
      });
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return <ReportesClient {...data} />;
}
