"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardClient, type DashboardData } from "./dashboard-client";
import { useEtapas } from "@/hooks/useEtapas";
import { differenceInCalendarDays } from "date-fns";

const PROGRESO_BAJO = 40;
const LISTO_AVANZAR = 80;
const SIN_CONTACTO_DIAS = 15;
const ORACION_VEJEZ_DIAS = 30;
const EVANGELISMO_LISTO_DIAS = 30;

interface DiscipuloRaw {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url?: string | null;
  etapa_id: number;
  estado: string;
  lider_id?: string | null;
  bautizado?: boolean | null;
  es_miembro?: boolean | null;
}

interface PerfilRaw {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
}

interface SeguimientoRaw {
  id: string;
  discipulo_id: string;
  progreso: number;
  estado: string;
}

interface AgendaRaw {
  id: string;
  discipulo_id: string;
  fecha: string;
}

interface OracionRaw {
  id: string;
  pedido: string;
  estado: string;
  fecha: string;
}

interface TareaRaw {
  id: string;
  estado: string;
}

interface EvangelismoRaw {
  id: string;
  nombre: string;
  apellido: string;
  estado: string;
  fecha_inicio_estado: string;
}

interface RawData {
  discipulos: DiscipuloRaw[];
  perfiles: PerfilRaw[];
  seguimientos: SeguimientoRaw[];
  agenda: AgendaRaw[];
  oraciones: OracionRaw[];
  tareas: TareaRaw[];
  evangelismo: EvangelismoRaw[];
}

export default function DashboardPage() {
  const { etapas } = useEtapas();
  const [raw, setRaw] = useState<RawData | null>(null);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("discipulos").select("id, nombre, apellido, avatar_url, etapa_id, estado, lider_id, bautizado, es_miembro"),
      supabase.from("profiles").select("id, nombre, apellido, rol"),
      supabase.from("seguimientos").select("id, discipulo_id, progreso, estado"),
      supabase.from("agenda").select("id, discipulo_id, fecha").order("fecha", { ascending: false }),
      supabase.from("oraciones").select("id, pedido, estado, fecha"),
      supabase.from("tareas").select("id, estado"),
      supabase.from("acompanamiento_evangelistico").select("id, nombre, apellido, estado, fecha_inicio_estado"),
    ]).then(([discipulosRes, perfilesRes, seguimientosRes, agendaRes, oracionesRes, tareasRes, evRes]) => {
      setRaw({
        discipulos: (discipulosRes.data || []) as DiscipuloRaw[],
        perfiles: (perfilesRes.data || []) as PerfilRaw[],
        seguimientos: (seguimientosRes.data || []) as SeguimientoRaw[],
        agenda: (agendaRes.data || []) as AgendaRaw[],
        oraciones: (oracionesRes.data || []) as OracionRaw[],
        tareas: (tareasRes.data || []) as TareaRaw[],
        evangelismo: (evRes.data || []) as EvangelismoRaw[],
      });
    }).catch(console.error);
  }, []);

  const data = useMemo<DashboardData | null>(() => {
    if (!raw || etapas.length === 0) return null;
    const { discipulos, perfiles, seguimientos, agenda, oraciones, tareas, evangelismo } = raw;
    const hoy = new Date();
    const diasDesde = (fecha: string) => differenceInCalendarDays(hoy, new Date(fecha + "T00:00:00"));

    const activos = discipulos.filter((d) => d.estado === "activo");
    const pausados = discipulos.filter((d) => d.estado === "pausado").length;
    const retirados = discipulos.filter((d) => d.estado === "retirado").length;
    const totalDiscipulos = discipulos.length;
    const retencionPct = totalDiscipulos ? Math.round((activos.length / totalDiscipulos) * 100) : 0;

    const etapaFinal = etapas[etapas.length - 1];
    const enEtapaFinal = activos.filter((d) => d.etapa_id === etapaFinal.id).length;
    const metaPct = activos.length ? Math.round((enEtapaFinal / activos.length) * 100) : 0;

    const discipulosPorEtapa = etapas.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      cantidad: discipulos.filter((d) => d.etapa_id === e.id).length,
    }));

    const segPorDiscipulo = new Map<string, SeguimientoRaw>();
    for (const s of seguimientos) {
      const existente = segPorDiscipulo.get(s.discipulo_id);
      if (!existente || (s.estado === "activo" && existente.estado !== "activo")) {
        segPorDiscipulo.set(s.discipulo_id, s);
      }
    }
    const segActivos = seguimientos.filter((s) => s.estado === "activo");
    const promedioProgreso = segActivos.length
      ? Math.round(segActivos.reduce((acc, s) => acc + s.progreso, 0) / segActivos.length)
      : 0;

    const ultimoEncuentro = new Map<string, string>();
    for (const a of agenda) {
      if (!ultimoEncuentro.has(a.discipulo_id)) ultimoEncuentro.set(a.discipulo_id, a.fecha);
    }
    const diasSinContacto = (id: string): number | null => {
      const f = ultimoEncuentro.get(id);
      if (!f) return null;
      return diasDesde(f);
    };

    const urgentesFull = activos
      .map((d) => {
        const razones: string[] = [];
        const seg = segPorDiscipulo.get(d.id);
        if (!seg) razones.push("Sin seguimiento activo");
        else if (seg.progreso < PROGRESO_BAJO) razones.push(`Progreso bajo (${seg.progreso}%)`);
        const dias = diasSinContacto(d.id);
        if (dias === null) razones.push("Sin encuentros registrados");
        else if (dias >= SIN_CONTACTO_DIAS) razones.push(`Sin encuentro (${dias} días)`);
        if (d.etapa_id >= 2) {
          if (!d.bautizado) razones.push("Pendiente bautismo");
          if (!d.es_miembro) razones.push("Pendiente membresía");
        }
        if (!d.lider_id) razones.push("Sin discipulador asignado");
        return { discipulo: d, razones };
      })
      .filter((x) => x.razones.length > 0)
      .sort((a, b) => b.razones.length - a.razones.length);

    const urgentes = urgentesFull.slice(0, 8);

    const oracionesViejas = oraciones
      .filter((o) => o.estado !== "respondida")
      .map((o) => ({ id: o.id, pedido: o.pedido, dias: diasDesde(o.fecha) }))
      .filter((o) => o.dias >= ORACION_VEJEZ_DIAS)
      .sort((a, b) => b.dias - a.dias)
      .slice(0, 4);

    const listosAvanzar = activos
      .map((d) => ({ discipulo: d, seg: segPorDiscipulo.get(d.id) }))
      .filter((x): x is { discipulo: DiscipuloRaw; seg: SeguimientoRaw } =>
        x.seg !== undefined && x.seg.estado === "activo" && x.seg.progreso >= LISTO_AVANZAR && x.discipulo.etapa_id !== etapaFinal.id
      )
      .map(({ discipulo, seg }) => {
        const idx = etapas.findIndex((e) => e.id === discipulo.etapa_id);
        const prox = idx >= 0 && idx < etapas.length - 1 ? etapas[idx + 1] : undefined;
        return {
          discipulo,
          progreso: seg.progreso,
          proximaEtapa: prox?.nombre.replace(/^\d+\.\s*/, ""),
        };
      })
      .sort((a, b) => b.progreso - a.progreso)
      .slice(0, 6);

    const evangelismoListos = evangelismo
      .map((p) => ({ ...p, dias: diasDesde(p.fecha_inicio_estado) }))
      .filter((p) => p.dias >= EVANGELISMO_LISTO_DIAS)
      .sort((a, b) => b.dias - a.dias)
      .slice(0, 6);

    const riesgoIds = new Set(urgentesFull.map((x) => x.discipulo.id));
    const sinContactoIds = new Set(
      activos.filter((d) => {
        const ds = diasSinContacto(d.id);
        return ds === null || ds >= SIN_CONTACTO_DIAS;
      }).map((d) => d.id)
    );
    const perfilPorId = new Map(perfiles.map((p) => [p.id, p]));
    const porLider = new Map<string, DiscipuloRaw[]>();
    for (const d of activos) {
      if (!d.lider_id) continue;
      const arr = porLider.get(d.lider_id) || [];
      arr.push(d);
      porLider.set(d.lider_id, arr);
    }
    const discipuladores = [...porLider.entries()]
      .map(([id, lista]) => {
        const perfil = perfilPorId.get(id);
        return {
          id,
          nombre: perfil?.nombre || "Discipulador",
          apellido: perfil?.apellido || "",
          total: lista.length,
          enRiesgo: lista.filter((d) => riesgoIds.has(d.id)).length,
          sinContacto: lista.filter((d) => sinContactoIds.has(d.id)).length,
        };
      })
      .filter((x) => x.enRiesgo > 0 || x.sinContacto > 0)
      .sort((a, b) => b.enRiesgo - a.enRiesgo || b.sinContacto - a.sinContacto)
      .slice(0, 5);

    const tareasTotal = tareas.length;
    const tareasCompletadas = tareas.filter((t) => t.estado === "completada").length;
    const tareasCumplimientoPct = tareasTotal ? Math.round((tareasCompletadas / tareasTotal) * 100) : 0;
    const tareasVencidas = tareas.filter((t) => t.estado === "vencida").length;

    const bautizadosPct = totalDiscipulos ? Math.round((discipulos.filter((d) => d.bautizado).length / totalDiscipulos) * 100) : 0;
    const miembrosPct = totalDiscipulos ? Math.round((discipulos.filter((d) => d.es_miembro).length / totalDiscipulos) * 100) : 0;

    const oracionesRespondidas = oraciones.filter((o) => o.estado === "respondida").length;
    const oracionesRespondidasPct = oraciones.length ? Math.round((oracionesRespondidas / oraciones.length) * 100) : 0;
    const oracionesPendientes = oraciones.filter((o) => o.estado !== "respondida").length;

    const conContacto = activos.filter((d) => {
      const ds = diasSinContacto(d.id);
      return ds !== null && ds <= SIN_CONTACTO_DIAS;
    }).length;
    const contactoPct = activos.length ? Math.round((conContacto / activos.length) * 100) : 0;

    return {
      etapaFinal: { id: etapaFinal.id, nombre: etapaFinal.nombre },
      salud: {
        totalDiscipulos,
        activos: activos.length,
        pausados,
        retirados,
        retencionPct,
        enEtapaFinal,
        metaPct,
        promedioProgreso,
        tareasCumplimientoPct,
        tareasVencidas,
        bautizadosPct,
        miembrosPct,
        oracionesPendientes,
        oracionesRespondidasPct,
        contactoPct,
        discipulosPorEtapa,
      },
      urgentes,
      oracionesViejas,
      listosAvanzar,
      evangelismoListos,
      discipuladores,
    };
  }, [raw, etapas]);

  if (!data) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return <DashboardClient data={data} />;
}
