"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardClient } from "./dashboard-client";
import type { Discipulo } from "@/types/database";

interface EncuentroBasico {
  id: string;
  fecha: string;
  tema_tratado: string;
  discipulo_id: string;
  lider_id: string;
}

interface OracionBasica {
  id: string;
  discipulo_id: string;
  pedido: string;
  estado: string;
  fecha: string;
}

interface EtapaBasica {
  id: number;
  nombre: string;
  orden: number;
}

interface DiscipuloBasico {
  id: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento?: string;
  etapa_id: number;
}

interface DashboardData {
  totalDiscipulos: number;
  nuevos: number;
  consolidacion: number;
  caracter: number;
  servicio: number;
  activos: number;
  completados: number;
  pausados: number;
  retirados: number;
  oracionesPendientes: number;
  totalEncuentros: number;
  totalOraciones: number;
  oracionesRespondidas: number;
  discipulosPorEtapa: Array<{ nombre: string; cantidad: number }>;
  encuentrosPorMes: Array<{ mes: string; cantidad: number }>;
  proximosEncuentros: EncuentroBasico[];
  oracionesPendientesList: OracionBasica[];
  proximosCumples: DiscipuloBasico[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("discipulos").select("id, nombre, apellido, fecha_nacimiento, etapa_id, estado, lider_id, created_at"),
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
      supabase.from("encuentros").select("fecha"),
      supabase.from("oraciones").select("estado"),
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
    ]).then(([discipulosRes, encuentrosRes, oracionesRes, allEncuentrosRes, allOracionesRes, etapasRes]) => {
      const discipulos = (discipulosRes.data || []) as Discipulo[];
      const encuentros = (allEncuentrosRes.data || []) as { fecha: string }[];
      const oraciones = (allOracionesRes.data || []) as OracionBasica[];
      const etapas = (etapasRes.data || []) as EtapaBasica[];
      const hoy = new Date();

      const proximosCumples = discipulos.filter((d) => {
        if (!d.fecha_nacimiento) return false;
        const nac = new Date(d.fecha_nacimiento);
        const cumple = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate());
        const diff = Math.ceil((cumple.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 7;
      });

      const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const meses: Record<string, number> = {};
      encuentros.forEach((e) => {
        const fecha = new Date(e.fecha);
        const key = `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear()}`;
        meses[key] = (meses[key] || 0) + 1;
      });

      const discipulosPorEtapa = etapas.map((etapa) => ({
        nombre: etapa.nombre,
        cantidad: discipulos.filter((d) => d.etapa_id === etapa.id).length,
      }));

      setData({
        totalDiscipulos: discipulos.length,
        nuevos: discipulos.filter((d) => d.etapa_id === 1).length,
        consolidacion: discipulos.filter((d) => d.etapa_id === 2).length,
        caracter: discipulos.filter((d) => d.etapa_id === 3).length,
        servicio: discipulos.filter((d) => d.etapa_id === 4).length,
        activos: discipulos.filter((d) => d.estado === "activo").length,
        completados: discipulos.filter((d) => d.estado === "completado").length,
        pausados: discipulos.filter((d) => d.estado === "pausado").length,
        retirados: discipulos.filter((d) => d.estado === "retirado").length,
        oracionesPendientes: (oracionesRes.data || []).length,
        totalEncuentros: encuentros.length,
        totalOraciones: oraciones.length,
        oracionesRespondidas: oraciones.filter((o) => o.estado === "respondida").length,
        discipulosPorEtapa,
        encuentrosPorMes: Object.entries(meses).map(([mes, cantidad]) => ({ mes, cantidad })),
        proximosEncuentros: (encuentrosRes.data || []) as EncuentroBasico[],
        oracionesPendientesList: (oracionesRes.data || []) as OracionBasica[],
        proximosCumples,
      });
    }).catch(console.error);
  }, []);

  if (!data) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return <DashboardClient {...data} />;
}
