"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardClient } from "./dashboard-client";
import { useEtapas } from "@/hooks/useEtapas";
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

interface SeguimientoBasico {
  id: string;
  etapa: number;
  progreso: number;
  estado: string;
  discipulos?: { nombre: string; apellido: string };
}

interface DiscipuloBasico {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url?: string | null;
  fecha_nacimiento?: string | null;
  etapa_id: number;
  bautizado?: boolean;
  es_miembro?: boolean;
}

interface CumpleInfo extends DiscipuloBasico {
  fecha_nacimiento: string;
  proxima_fecha: string;
  dias: number;
  edad: number;
}

interface RawData {
  discipulos: Discipulo[];
  proximasAgendas: AgendaBasico[];
  oracionesPendientesList: OracionBasica[];
  seguimientos: SeguimientoBasico[];
}

interface DashboardData {
  totalDiscipulos: number;
  activos: number;
  discipulosPorEtapa: Array<{ id: number; nombre: string; cantidad: number }>;
  etapaFinal: { id: number; nombre: string };
  enEtapaFinal: number;
  faltanParaMeta: number;
  metaPct: number;
  multiplicadores: DiscipuloBasico[];
  cercaDeMeta: DiscipuloBasico[];
  cumpleProximos7: number;
  cumpleMes: CumpleInfo[];
  oracionesPendientes: number;
  proximasAgendas: AgendaBasico[];
  oracionesPendientesList: OracionBasica[];
  seguimientosActivos: number;
  promedioProgreso: number;
  seguimientoAtencion: SeguimientoBasico[];
  pendientes: DiscipuloBasico[];
}

export default function DashboardPage() {
  const { etapas } = useEtapas();
  const [raw, setRaw] = useState<RawData | null>(null);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("discipulos").select("id, nombre, apellido, avatar_url, fecha_nacimiento, etapa_id, estado, lider_id, created_at, bautizado, es_miembro"),
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
      supabase
        .from("seguimientos")
        .select("id, etapa, progreso, estado, discipulos:discipulo_id(nombre, apellido)"),
    ]).then(([discipulosRes, agendasRes, oracionesRes, seguimientosRes]) => {
      setRaw({
        discipulos: (discipulosRes.data || []) as Discipulo[],
        proximasAgendas: (agendasRes.data || []) as AgendaBasico[],
        oracionesPendientesList: (oracionesRes.data || []) as OracionBasica[],
        seguimientos: (seguimientosRes.data || []) as unknown as SeguimientoBasico[],
      });
    }).catch(console.error);
  }, []);

  const data = useMemo<DashboardData | null>(() => {
    if (!raw || etapas.length === 0) return null;
    const { discipulos, proximasAgendas, oracionesPendientesList, seguimientos } = raw;
    const hoy = new Date();
    const hoyInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();

    const totalDiscipulos = discipulos.length;
    const activos = discipulos.filter((d) => d.estado === "activo").length;

    const discipulosPorEtapa = etapas.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      cantidad: discipulos.filter((d) => d.etapa_id === e.id).length,
    }));

    const etapaFinal = etapas[etapas.length - 1];
    const etapaPrevia = etapas.length > 1 ? etapas[etapas.length - 2] : null;

    const enEtapaFinal = discipulos.filter((d) => d.etapa_id === etapaFinal.id).length;
    const faltanParaMeta = totalDiscipulos - enEtapaFinal;
    const metaPct = totalDiscipulos ? Math.round((enEtapaFinal / totalDiscipulos) * 100) : 0;

    const toBasico = (d: Discipulo): DiscipuloBasico => ({
      id: d.id,
      nombre: d.nombre,
      apellido: d.apellido,
      avatar_url: d.avatar_url,
      fecha_nacimiento: d.fecha_nacimiento,
      etapa_id: d.etapa_id,
      bautizado: d.bautizado,
      es_miembro: d.es_miembro,
    });

    const multiplicadores = discipulos.filter((d) => d.etapa_id === etapaFinal.id).map(toBasico);
    const cercaDeMeta = (etapaPrevia ? discipulos.filter((d) => d.etapa_id === etapaPrevia.id) : []).map(toBasico);

    const pendientes = discipulos
      .filter((d) => d.etapa_id >= 2 && (!d.bautizado || !d.es_miembro))
      .map(toBasico);

    const cumples = discipulos
      .filter((d) => d.fecha_nacimiento)
      .map((d) => {
        const [anio, mes, dia] = d.fecha_nacimiento!.split("T")[0].split("-").map(Number);
        let proxima = new Date(hoy.getFullYear(), mes - 1, dia).getTime();
        let edad = hoy.getFullYear() - anio;
        if (proxima < hoyInicio) {
          proxima = new Date(hoy.getFullYear() + 1, mes - 1, dia).getTime();
          edad += 1;
        }
        return {
          ...toBasico(d),
          fecha_nacimiento: d.fecha_nacimiento!,
          proxima_fecha: new Date(proxima).toISOString(),
          dias: Math.round((proxima - hoyInicio) / 86400000),
          edad,
        };
      })
      .sort((a, b) => a.dias - b.dias);

    const cumpleMes = cumples.filter((c) => c.dias <= 30).slice(0, 8);
    const cumpleProximos7 = cumples.filter((c) => c.dias <= 7).length;

    const seguimientosActivos = seguimientos.filter((s) => s.estado === "activo");
    const promedioProgreso = seguimientosActivos.length
      ? Math.round(seguimientosActivos.reduce((acc, s) => acc + s.progreso, 0) / seguimientosActivos.length)
      : 0;

    return {
      totalDiscipulos,
      activos,
      discipulosPorEtapa,
      etapaFinal: { id: etapaFinal.id, nombre: etapaFinal.nombre },
      enEtapaFinal,
      faltanParaMeta,
      metaPct,
      multiplicadores,
      cercaDeMeta,
      cumpleMes,
      cumpleProximos7,
      oracionesPendientes: oracionesPendientesList.length,
      proximasAgendas,
      oracionesPendientesList,
      seguimientosActivos: seguimientosActivos.length,
      promedioProgreso,
      seguimientoAtencion: [...seguimientosActivos].sort((a, b) => a.progreso - b.progreso).slice(0, 5),
      pendientes,
    };
  }, [raw, etapas]);

  if (!data) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return <DashboardClient {...data} etapas={etapas} />;
}
