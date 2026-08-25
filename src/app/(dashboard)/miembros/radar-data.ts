import { createClient } from "@/lib/supabase/client";
import { calcularSalud, contarEncuentrosMes, type SaludResultado } from "@/lib/discipulo-health";
import { differenceInCalendarDays } from "date-fns";
import type { Miembro, Etapa } from "@/types/database";

export interface MiembroRadar {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url: string | null;
  etapa_id: number;
  etapa_nombre: string;
  estado: Miembro["estado"];
  bautizado: boolean;
  es_miembro: boolean;
  fecha_nacimiento?: string | null;
  lider_id: string | null;
  lider_nombre: string | null;
  seguimiento_id: string | null;
  progreso: number | null;
  diasSinContacto: number | null;
  ultimaReunion: string | null;
  proximaReunion: string | null;
  diasUltimaEvaluacion: number | null;
  objetivosPendientes: number;
  oracionesPendientes: number;
  salud: SaludResultado;
}

interface SeguimientoRaw {
  id: string;
  miembro_id: string;
  progreso: number | null;
  estado: string;
}

interface EvaluacionRaw {
  seguimiento_id: string;
  fecha: string;
}

interface ObjetivoRaw {
  seguimiento_id: string;
  completado: boolean;
}

interface AgendaRaw {
  miembro_id: string;
  fecha: string;
  realizada?: boolean;
}

interface OracionRaw {
  miembro_id: string;
  estado: string;
}

interface ProfileRaw {
  id: string;
  nombre: string;
  apellido: string;
}

export async function cargarRadar(): Promise<{ miembros: MiembroRadar[]; etapas: Etapa[] }> {
  const supabase = createClient();

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hoyISO = hoy.toISOString().slice(0, 10);

  const [miembrosRes, etapasRes, segRes, evalRes, objRes, agendaRes, oraRes, perfRes] =
    await Promise.all([
      supabase.from("miembros").select("*").order("created_at", { ascending: false }),
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
      supabase.from("seguimientos").select("id, miembro_id, progreso, estado"),
      supabase.from("seguimiento_evaluaciones").select("seguimiento_id, fecha"),
      supabase.from("seguimiento_objetivos").select("seguimiento_id, completado"),
      supabase.from("agenda").select("miembro_id, fecha, realizada").order("fecha", { ascending: false }),
      supabase.from("oraciones").select("miembro_id, estado"),
      supabase.from("profiles").select("id, nombre, apellido"),
    ]);

  const etapas = (etapasRes.data as Etapa[]) || [];
  const etapasMap = new Map(etapas.map((e) => [e.id, e]));

  const segPorMiembro = new Map<string, SeguimientoRaw>();
  for (const s of (segRes.data || []) as SeguimientoRaw[]) {
    const existente = segPorMiembro.get(s.miembro_id);
    if (!existente || (s.estado === "activo" && existente.estado !== "activo")) {
      segPorMiembro.set(s.miembro_id, s);
    }
  }

  const fechaEvalPorSeg = new Map<string, string>();
  for (const ev of (evalRes.data || []) as EvaluacionRaw[]) {
    const f = ev.fecha.length === 10 ? ev.fecha : ev.fecha.split("T")[0];
    const cur = fechaEvalPorSeg.get(ev.seguimiento_id);
    if (!cur || f > cur) fechaEvalPorSeg.set(ev.seguimiento_id, f);
  }

  const objPendientesPorSeg = new Map<string, number>();
  for (const o of (objRes.data || []) as ObjetivoRaw[]) {
    if (!o.completado) {
      objPendientesPorSeg.set(o.seguimiento_id, (objPendientesPorSeg.get(o.seguimiento_id) || 0) + 1);
    }
  }

  const ultimaPorMiembro = new Map<string, string>();
  const proximaPorMiembro = new Map<string, string>();
  const diasPorMiembro = new Map<string, number>();
  const fechasMesPorMiembro = new Map<string, { fecha: string; realizada?: boolean }[]>();
  for (const a of (agendaRes.data || []) as AgendaRaw[]) {
    const f = a.fecha.length === 10 ? a.fecha : a.fecha.split("T")[0];
    const fechas = fechasMesPorMiembro.get(a.miembro_id) || [];
    fechas.push({ fecha: f, realizada: a.realizada });
    fechasMesPorMiembro.set(a.miembro_id, fechas);
    if (a.realizada && f <= hoyISO) {
      if (!ultimaPorMiembro.has(a.miembro_id)) ultimaPorMiembro.set(a.miembro_id, f);
    } else if (a.realizada !== true && f > hoyISO) {
      if (!proximaPorMiembro.has(a.miembro_id)) proximaPorMiembro.set(a.miembro_id, f);
    }
  }
  for (const [id, f] of ultimaPorMiembro) {
    diasPorMiembro.set(id, differenceInCalendarDays(hoy, new Date(`${f}T00:00:00`)));
  }

  const oraPendientesPorMiembro = new Map<string, number>();
  for (const o of (oraRes.data || []) as OracionRaw[]) {
    if (o.estado !== "respondida") {
      oraPendientesPorMiembro.set(o.miembro_id, (oraPendientesPorMiembro.get(o.miembro_id) || 0) + 1);
    }
  }

  const perfMap = new Map((perfRes.data || [] as ProfileRaw[]).map((p) => [p.id, p]));

  const miembros: MiembroRadar[] = ((miembrosRes.data || []) as Miembro[])
    .filter((d) => d.estado !== "retirado")
    .map((d) => {
      const seg = segPorMiembro.get(d.id);
      const segId = seg?.id || null;
      const fEval = segId ? fechaEvalPorSeg.get(segId) : undefined;
      const diasEval = fEval ? differenceInCalendarDays(hoy, new Date(`${fEval}T00:00:00`)) : null;
      const diasSinContacto = diasPorMiembro.get(d.id) ?? null;

      const salud = calcularSalud({
        encuentrosMes: contarEncuentrosMes(fechasMesPorMiembro.get(d.id) || []),
        etapa: d.etapa_id,
        bautizado: d.bautizado ?? false,
        es_miembro: d.es_miembro ?? false,
        objetivosPendientes: segId ? objPendientesPorSeg.get(segId) || 0 : 0,
        oracionesPendientes: oraPendientesPorMiembro.get(d.id) || 0,
      });

      const lider = d.lider_id ? perfMap.get(d.lider_id) : undefined;

      return {
        id: d.id,
        nombre: d.nombre,
        apellido: d.apellido,
        avatar_url: d.avatar_url || null,
        etapa_id: d.etapa_id,
        etapa_nombre: etapasMap.get(d.etapa_id)?.nombre || `Etapa ${d.etapa_id}`,
        estado: d.estado,
        bautizado: d.bautizado ?? false,
        es_miembro: d.es_miembro ?? false,
        fecha_nacimiento: d.fecha_nacimiento || null,
        lider_id: d.lider_id || null,
        lider_nombre: lider ? `${lider.nombre} ${lider.apellido}` : null,
        seguimiento_id: segId,
        progreso: seg ? seg.progreso : null,
        diasSinContacto,
        ultimaReunion: ultimaPorMiembro.get(d.id) || null,
        proximaReunion: proximaPorMiembro.get(d.id) || null,
        diasUltimaEvaluacion: diasEval,
        objetivosPendientes: segId ? objPendientesPorSeg.get(segId) || 0 : 0,
        oracionesPendientes: oraPendientesPorMiembro.get(d.id) || 0,
        salud,
      };
    });

  return { miembros, etapas };
}
