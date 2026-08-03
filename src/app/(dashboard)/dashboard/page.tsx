"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardClient } from "./dashboard-client";
import { ETAPAS } from "../seguimiento/seguimiento-constants";
import type { Discipulo } from "@/types/database";

interface AgendaBasico {
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

interface DiscipuloBasico {
  id: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento?: string;
  etapa_id: number;
}

interface SeguimientoBasico {
  id: string;
  etapa: number;
  progreso: number;
  estado: string;
  discipulos?: { nombre: string; apellido: string };
}

interface DashboardData {
  totalDiscipulos: number;
  discipulosPorEtapa: Array<{ nombre: string; cantidad: number }>;
  activos: number;
  completados: number;
  pausados: number;
  retirados: number;
  oracionesPendientes: number;
  totalAgendas: number;
  totalOraciones: number;
  oracionesRespondidas: number;
  agendasPorMes: Array<{ mes: string; cantidad: number }>;
  proximasAgendas: AgendaBasico[];
  oracionesPendientesList: OracionBasica[];
  proximosCumples: DiscipuloBasico[];
  seguimientosActivos: number;
  promedioProgreso: number;
  seguimientosPorEtapa: Array<{ nombre: string; cantidad: number }>;
  seguimientoAtencion: SeguimientoBasico[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("discipulos").select("id, nombre, apellido, fecha_nacimiento, etapa_id, estado, lider_id, created_at"),
      supabase
        .from("agenda")
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
      supabase.from("agenda").select("fecha"),
      supabase.from("oraciones").select("estado"),
      supabase
        .from("seguimientos")
        .select("id, etapa, progreso, estado, discipulos:discipulo_id(nombre, apellido)"),
    ]).then(([discipulosRes, agendasRes, oracionesRes, allAgendasRes, allOracionesRes, seguimientosRes]) => {
      const discipulos = (discipulosRes.data || []) as Discipulo[];
      const agendas = (allAgendasRes.data || []) as { fecha: string }[];
      const oraciones = (allOracionesRes.data || []) as OracionBasica[];
      const seguimientos = (seguimientosRes.data || []) as unknown as SeguimientoBasico[];
      const hoy = new Date();

      const seguimientosActivos = seguimientos.filter((s) => s.estado === "activo");
      const promedioProgreso = seguimientosActivos.length
        ? Math.round(seguimientosActivos.reduce((acc, s) => acc + s.progreso, 0) / seguimientosActivos.length)
        : 0;

      const proximosCumples = discipulos.filter((d) => {
        if (!d.fecha_nacimiento) return false;
        const nac = new Date(d.fecha_nacimiento);
        const cumple = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate());
        const diff = Math.ceil((cumple.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 7;
      });

      const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const meses: Record<string, number> = {};
      agendas.forEach((e) => {
        const fecha = new Date(e.fecha);
        const key = `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear()}`;
        meses[key] = (meses[key] || 0) + 1;
      });

      setData({
        totalDiscipulos: discipulos.length,
        discipulosPorEtapa: ETAPAS.map((e) => ({
          nombre: e.nombre,
          cantidad: discipulos.filter((d) => d.etapa_id === e.valor).length,
        })),
        activos: discipulos.filter((d) => d.estado === "activo").length,
        completados: discipulos.filter((d) => d.estado === "completado").length,
        pausados: discipulos.filter((d) => d.estado === "pausado").length,
        retirados: discipulos.filter((d) => d.estado === "retirado").length,
        oracionesPendientes: (oracionesRes.data || []).length,
        totalAgendas: agendas.length,
        totalOraciones: oraciones.length,
        oracionesRespondidas: oraciones.filter((o) => o.estado === "respondida").length,
        agendasPorMes: Object.entries(meses).map(([mes, cantidad]) => ({ mes, cantidad })),
        proximasAgendas: (agendasRes.data || []) as AgendaBasico[],
        oracionesPendientesList: (oracionesRes.data || []) as OracionBasica[],
        proximosCumples,
        seguimientosActivos: seguimientosActivos.length,
        promedioProgreso,
        seguimientosPorEtapa: ETAPAS.map((e) => ({
          nombre: e.nombre,
          cantidad: seguimientosActivos.filter((s) => s.etapa === e.valor).length,
        })),
        seguimientoAtencion: [...seguimientosActivos]
          .sort((a, b) => a.progreso - b.progreso)
          .slice(0, 5),
      });
    }).catch(console.error);
  }, []);

  if (!data) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return <DashboardClient {...data} />;
}
