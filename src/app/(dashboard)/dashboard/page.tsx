"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DashboardClient, type DashboardData, type ActividadItem, type EstadoDiscipulo } from "./dashboard-client";
import { useEtapas } from "@/hooks/useEtapas";
import { useUser } from "@/hooks/useUser";
import { useSyncMiembros } from "@/hooks/useSyncMiembros";
import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DEFAULT_PERIODO,
  DIAS_POR_PERIODO,
  PROGRESO_BAJO,
  SIN_CONTACTO_DIAS,
  type Periodo,
} from "./discipuladores/constants";

const BUCKET_DIAS: Record<Periodo, number> = {
  "7d": 1,
  "30d": 1,
  "90d": 7,
  todo: 30,
};

const ESTADO_RANK: Record<EstadoDiscipulo, number> = {
  critico: 0,
  necesita_ayuda: 1,
  en_riesgo: 2,
  bueno: 3,
  excelente: 4,
  sin_discipulos: 5,
};

const ESTADOS_PROBLEMA: EstadoDiscipulo[] = ["en_riesgo", "necesita_ayuda", "critico"];

interface MiembroRaw {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url?: string | null;
  etapa_id: number;
  estado: string;
  lider_id?: string | null;
  bautizado?: boolean | null;
  es_miembro?: boolean | null;
  created_at: string;
}

interface PerfilRaw {
  id: string;
  nombre: string;
  apellido: string;
}

interface SeguimientoRaw {
  id: string;
  miembro_id: string;
  discipulador_id: string;
  etapa: number;
  progreso: number;
  estado: string;
}

interface AgendaRaw {
  id: string;
  miembro_id: string;
  lider_id: string;
  fecha: string;
  hora?: string | null;
  tema_tratado?: string | null;
  realizada?: boolean | null;
}

interface ObjetivoRaw {
  id: string;
  seguimiento_id: string;
  descripcion: string;
  completado: boolean;
  fecha_cumplimiento?: string | null;
  created_at: string;
}

interface TareaRaw {
  id: string;
  miembro_id: string;
  lider_id: string;
  titulo: string;
  estado: string;
  completed_at?: string | null;
  created_at: string;
}

interface RawData {
  miembros: MiembroRaw[];
  perfiles: PerfilRaw[];
  seguimientos: SeguimientoRaw[];
  agenda: AgendaRaw[];
  objetivos: ObjetivoRaw[];
  tareas: TareaRaw[];
}

export default function DashboardPage() {
  const { etapas } = useEtapas();
  const { user, loading: loadingUser } = useUser();
  const router = useRouter();
  useSyncMiembros();
  const [periodo, setPeriodo] = useState<Periodo>(DEFAULT_PERIODO);
  const [raw, setRaw] = useState<RawData | null>(null);

  useEffect(() => {
    if (!loadingUser && (user?.rol === "miembro" || user?.rol === "discipulo")) {
      router.replace("/mi-crecimiento");
    }
  }, [user, loadingUser, router]);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("miembros").select("id, nombre, apellido, avatar_url, etapa_id, estado, lider_id, bautizado, es_miembro, created_at"),
      supabase.from("profiles").select("id, nombre, apellido"),
      supabase.from("seguimientos").select("id, miembro_id, discipulador_id, etapa, progreso, estado"),
      supabase.from("agenda").select("id, miembro_id, lider_id, fecha, hora, tema_tratado, realizada"),
      supabase.from("seguimiento_objetivos").select("id, seguimiento_id, descripcion, completado, fecha_cumplimiento, created_at"),
      supabase.from("tareas").select("id, miembro_id, lider_id, titulo, estado, completed_at, created_at"),
    ]).then(([miembrosRes, perfilesRes, seguimientosRes, agendaRes, objetivosRes, tareasRes]) => {
      setRaw({
        miembros: (miembrosRes.data || []) as MiembroRaw[],
        perfiles: (perfilesRes.data || []) as PerfilRaw[],
        seguimientos: (seguimientosRes.data || []) as SeguimientoRaw[],
        agenda: (agendaRes.data || []) as AgendaRaw[],
        objetivos: (objetivosRes.data || []) as ObjetivoRaw[],
        tareas: (tareasRes.data || []) as TareaRaw[],
      });
    }).catch(console.error);
  }, []);

  const data = useMemo<DashboardData | null>(() => {
    if (!raw || etapas.length === 0) return null;
    const { miembros, perfiles, seguimientos, agenda, objetivos, tareas } = raw;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyISO = hoy.toISOString().slice(0, 10);

    const esDiscipulador = user?.rol === "discipulador";
    const misIds = new Set(
      esDiscipulador ? miembros.filter((d) => d.lider_id === user?.id).map((d) => d.id) : []
    );
    const miembrosVisibles = esDiscipulador ? miembros.filter((d) => misIds.has(d.id)) : miembros;
    const visibles = <T extends { miembro_id: string }>(arr: T[]): T[] =>
      esDiscipulador ? arr.filter((x) => misIds.has(x.miembro_id)) : arr;
    const seguimientosVisibles = visibles(seguimientos);
    const agendaVisibles = visibles(agenda);
    const tareasVisibles = visibles(tareas);

    const segVisiblesIds = new Set(seguimientosVisibles.map((s) => s.id));
    const objetivosPorSeg = new Map<string, ObjetivoRaw[]>();
    for (const o of objetivos) {
      if (!segVisiblesIds.has(o.seguimiento_id)) continue;
      const arr = objetivosPorSeg.get(o.seguimiento_id) || [];
      arr.push(o);
      objetivosPorSeg.set(o.seguimiento_id, arr);
    }

    const dias = DIAS_POR_PERIODO[periodo];
    let inicio: Date;
    if (Number.isFinite(dias)) {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - dias);
    } else {
      const fechas = [
        ...miembrosVisibles.map((d) => new Date(d.created_at)),
        ...agendaVisibles.map((a) => new Date(a.fecha + "T00:00:00")),
      ];
      inicio = fechas.length ? new Date(Math.min(...fechas.map((f) => f.getTime()))) : new Date(hoy.getTime() - 180 * 86400000);
    }

    const enPeriodoFecha = (fecha: string): boolean => {
      const f = new Date(fecha + "T00:00:00");
      return f >= inicio && f <= hoy;
    };
    const enPeriodoDate = (d: Date): boolean => d >= inicio && d <= hoy;
    const diasDesde = (fecha: string) => differenceInCalendarDays(hoy, new Date(fecha + "T00:00:00"));

    let semanasObjetivo: number;
    if (Number.isFinite(dias)) {
      semanasObjetivo = Math.max(1, Math.ceil(dias / 7));
    } else {
      const diasTotales = Math.max(1, differenceInCalendarDays(hoy, inicio));
      semanasObjetivo = Math.max(1, Math.ceil(diasTotales / 7));
    }

    const segPorMiembro = new Map<string, SeguimientoRaw>();
    for (const s of seguimientosVisibles) {
      const existente = segPorMiembro.get(s.miembro_id);
      if (!existente || (s.estado === "activo" && existente.estado !== "activo")) {
        segPorMiembro.set(s.miembro_id, s);
      }
    }
    const segMiembroId = new Map(seguimientosVisibles.map((s) => [s.id, s.miembro_id]));

    const ultimoEncuentro = new Map<string, string>();
    const reunionesEnPeriodo = new Map<string, number>();
    for (const a of agendaVisibles) {
      if (a.fecha > hoyISO || !a.realizada) continue;
      if (!ultimoEncuentro.has(a.miembro_id)) ultimoEncuentro.set(a.miembro_id, a.fecha);
      if (enPeriodoFecha(a.fecha)) {
        reunionesEnPeriodo.set(a.miembro_id, (reunionesEnPeriodo.get(a.miembro_id) || 0) + 1);
      }
    }

    const perfilPorId = new Map(perfiles.map((p) => [p.id, p]));
    const nombreLider = (id?: string | null): string => {
      const p = id ? perfilPorId.get(id) : undefined;
      return p ? `${p.nombre} ${p.apellido}` : "Sin discipulador";
    };

    const activos = miembrosVisibles.filter((d) => d.estado === "activo");
    const pausados = miembrosVisibles.filter((d) => d.estado === "pausado").length;
    const retirados = miembrosVisibles.filter((d) => d.estado === "retirado").length;

    const progresoEnFecha = (objs: ObjetivoRaw[], fin: Date): number | null => {
      const finISO = fin.toISOString().slice(0, 10);
      const hasta = objs.filter((o) => (o.created_at || "").slice(0, 10) <= finISO);
      if (hasta.length === 0) return null;
      const cumplidos = hasta.filter(
        (o) => o.completado && o.fecha_cumplimiento && o.fecha_cumplimiento <= finISO
      ).length;
      return Math.round((cumplidos / hasta.length) * 100);
    };

    const peor = (a: EstadoDiscipulo, b: EstadoDiscipulo): EstadoDiscipulo =>
      ESTADO_RANK[a] <= ESTADO_RANK[b] ? a : b;

    const calcularEstado = (
      progreso: number | null,
      reunionPct: number | null,
      diasSinContacto: number | null,
      sinSeguimiento: boolean
    ): EstadoDiscipulo => {
      let estado: EstadoDiscipulo;
      if (progreso === null) {
        estado = "necesita_ayuda";
      } else {
        const r = reunionPct ?? 0;
        if (progreso < 20) estado = "critico";
        else if (progreso < 40 || r < 40) estado = "necesita_ayuda";
        else if (progreso < 60 || r < 60) estado = "en_riesgo";
        else if (progreso < 80 || r < 80) estado = "bueno";
        else estado = "excelente";
      }
      if (sinSeguimiento) estado = peor(estado, "necesita_ayuda");
      if (diasSinContacto !== null) {
        if (diasSinContacto >= 45) estado = peor(estado, "critico");
        else if (diasSinContacto >= 30) estado = peor(estado, "necesita_ayuda");
        else if (diasSinContacto >= SIN_CONTACTO_DIAS) estado = peor(estado, "en_riesgo");
      }
      return estado;
    };

    const etapaNombre = (id: number): string =>
      etapas.find((e) => e.id === id)?.nombre.replace(/^\d+\.\s*/, "") || `Etapa ${id}`;

    const tabla = activos
      .map((d) => {
        const seg = segPorMiembro.get(d.id);
        const progreso = seg && seg.estado === "activo" && seg.progreso != null ? seg.progreso : null;
        const reuniones = reunionesEnPeriodo.get(d.id) || 0;
        const reunionPct = Math.min(100, Math.round((reuniones / semanasObjetivo) * 100));
        const ultima = ultimoEncuentro.get(d.id) ?? null;
        const diasSinContacto = ultima ? diasDesde(ultima) : null;
        const estado = calcularEstado(progreso, reunionPct, diasSinContacto, !seg);

        const razones: string[] = [];
        if (!seg) razones.push("Sin seguimiento activo");
        else if (progreso !== null && progreso < PROGRESO_BAJO) razones.push(`Progreso bajo (${progreso}%)`);
        if (diasSinContacto === null) razones.push("Sin reuniones registradas");
        else if (diasSinContacto >= SIN_CONTACTO_DIAS) razones.push(`Sin reunión (${diasSinContacto} días)`);
        if (d.etapa_id >= 2) {
          if (!d.bautizado) razones.push("Pendiente bautismo");
          if (!d.es_miembro) razones.push("Pendiente membresía");
        }
        if (!d.lider_id) razones.push("Sin discipulador asignado");

        return {
          id: d.id,
          nombre: d.nombre,
          apellido: d.apellido,
          avatar_url: d.avatar_url ?? null,
          discipulador: nombreLider(d.lider_id),
          etapa: etapaNombre(d.etapa_id),
          progreso,
          reuniones,
          objetivoReuniones: semanasObjetivo,
          reunionPct,
          ultimaReunion: ultima,
          diasSinContacto,
          estado,
          razones,
        };
      })
      .sort(
        (a, b) =>
          ESTADO_RANK[a.estado] - ESTADO_RANK[b.estado] ||
          b.reunionPct - a.reunionPct ||
          (a.ultimaReunion || "9999").localeCompare(b.ultimaReunion || "9999")
      );

    const segsActivos = seguimientosVisibles.filter((s) => s.estado === "activo" && s.progreso != null);
    const progresoPromedio = segsActivos.length
      ? Math.round(segsActivos.reduce((acc, s) => acc + s.progreso, 0) / segsActivos.length)
      : null;

    const seguimientoIds = seguimientosVisibles.map((s) => s.id);
    const progsInicio = seguimientoIds
      .map((id) => progresoEnFecha(objetivosPorSeg.get(id) || [], inicio))
      .filter((p): p is number => p !== null);
    const progresoInicio = progsInicio.length
      ? Math.round(progsInicio.reduce((a, b) => a + b, 0) / progsInicio.length)
      : null;
    const variacionProgreso =
      progresoPromedio !== null && progresoInicio !== null ? progresoPromedio - progresoInicio : null;

    const reunionesRealizadas = agendaVisibles.filter((a) => a.fecha <= hoyISO && a.realizada && enPeriodoFecha(a.fecha)).length;
    const objetivoReuniones = activos.length * semanasObjetivo;
    const reunionesPct = objetivoReuniones ? Math.min(100, Math.round((reunionesRealizadas / objetivoReuniones) * 100)) : 0;

    const enRiesgo = tabla.filter((t) => t.estado === "en_riesgo");
    const necesitanAtencion = tabla.filter((t) => ESTADOS_PROBLEMA.includes(t.estado));

    const atencion = necesitanAtencion
      .map((t) => ({
        id: t.id,
        nombre: t.nombre,
        apellido: t.apellido,
        avatar_url: t.avatar_url,
        estado: t.estado,
        progreso: t.progreso,
        reuniones: t.reuniones,
        objetivoReuniones: t.objetivoReuniones,
        ultimaReunion: t.ultimaReunion,
        diasSinContacto: t.diasSinContacto,
        razones: t.razones,
      }))
      .sort((a, b) => ESTADO_RANK[a.estado] - ESTADO_RANK[b.estado] || b.reuniones - a.reuniones);

    let bucketDias = BUCKET_DIAS[periodo];
    const totalBuckets = differenceInCalendarDays(hoy, inicio);
    if (Number.isFinite(totalBuckets) && totalBuckets > 0 && Math.ceil(totalBuckets / bucketDias) > 60) {
      bucketDias = Math.max(1, Math.ceil(totalBuckets / 60));
    }
    const serie: DashboardData["grafico"]["serie"] = [];
    for (let t = new Date(inicio); t <= hoy; t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + bucketDias)) {
      const fin = new Date(Math.min(t.getTime() + (bucketDias - 1) * 86400000, hoy.getTime()));
      const finISO = fin.toISOString().slice(0, 10);
      const tISO = t.toISOString().slice(0, 10);
      const etiqueta = bucketDias >= 30 ? format(t, "MMM yyyy", { locale: es }) : format(t, "d MMM", { locale: es });

      const reuniones = agendaVisibles.filter((a) => a.fecha <= finISO && a.fecha >= tISO && a.realizada).length;
      const miembrosActivos = miembrosVisibles.filter(
        (d) => d.estado === "activo" && (d.created_at || "").slice(0, 10) <= finISO
      ).length;
      const progs = seguimientoIds
        .map((id) => progresoEnFecha(objetivosPorSeg.get(id) || [], fin))
        .filter((p): p is number => p !== null);
      const progreso = progs.length ? Math.round(progs.reduce((a, b) => a + b, 0) / progs.length) : null;

      serie.push({ etiqueta, reuniones, miembrosActivos, progreso });
    }

    const miembroPorId = new Map(miembrosVisibles.map((d) => [d.id, d]));
    const nombreMiembro = (d?: MiembroRaw): string => (d ? `${d.apellido}, ${d.nombre}` : "un miembro");

    const actividad: ActividadItem[] = [];
    const proxLimite = new Date(hoy.getTime() + 7 * 86400000).toISOString().slice(0, 10);

    for (const a of agendaVisibles) {
      if (a.fecha <= hoyISO) {
        if (!a.realizada) continue;
        if (!enPeriodoFecha(a.fecha)) continue;
        const d = a.miembro_id ? miembroPorId.get(a.miembro_id) : undefined;
        actividad.push({
          id: `r-${a.id}`,
          tipo: "reunion",
          titulo: "Reunión registrada",
          descripcion: `${nombreLider(a.lider_id)} se reunió con ${nombreMiembro(d)}`,
          fecha: a.fecha + "T00:00:00",
          miembro_id: a.miembro_id,
          hora: a.hora ? a.hora.slice(0, 5) : null,
        });
      } else if (a.fecha <= proxLimite) {
        const d = a.miembro_id ? miembroPorId.get(a.miembro_id) : undefined;
        actividad.push({
          id: `p-${a.id}`,
          tipo: "reunion_programada",
          titulo: "Reunión programada",
          descripcion: `${nombreMiembro(d)} tiene una reunión con ${nombreLider(a.lider_id)}`,
          fecha: a.fecha + "T00:00:00",
          miembro_id: a.miembro_id,
          hora: a.hora ? a.hora.slice(0, 5) : null,
        });
      }
    }

    for (const o of objetivos) {
      if (!segVisiblesIds.has(o.seguimiento_id)) continue;
      if (!o.completado || !o.fecha_cumplimiento) continue;
      if (!enPeriodoFecha(o.fecha_cumplimiento)) continue;
      const did = segMiembroId.get(o.seguimiento_id);
      const d = did ? miembroPorId.get(did) : undefined;
      actividad.push({
        id: `o-${o.id}`,
        tipo: "avance",
        titulo: "Avance registrado",
        descripcion: `${nombreMiembro(d)} completó: ${o.descripcion}`,
        fecha: o.fecha_cumplimiento + "T12:00:00",
        miembro_id: did,
      });
    }

    for (const t of tareasVisibles) {
      if (t.estado !== "completada" || !t.completed_at) continue;
      if (!enPeriodoDate(new Date(t.completed_at))) continue;
      const d = t.miembro_id ? miembroPorId.get(t.miembro_id) : undefined;
      actividad.push({
        id: `t-${t.id}`,
        tipo: "avance",
        titulo: "Tarea completada",
        descripcion: `${nombreMiembro(d)} completó la tarea: ${t.titulo}`,
        fecha: t.completed_at,
        miembro_id: t.miembro_id,
      });
    }

    for (const d of miembrosVisibles) {
      if (!enPeriodoDate(new Date(d.created_at))) continue;
      actividad.push({
        id: `n-${d.id}`,
        tipo: "nuevo_miembro",
        titulo: "Nuevo miembro",
        descripcion: `${nombreLider(d.lider_id)} agregó a ${nombreMiembro(d)}`,
        fecha: d.created_at,
        miembro_id: d.id,
      });
    }

    for (const item of atencion.slice(0, 3)) {
      const d = miembroPorId.get(item.id);
      const f = item.ultimaReunion ?? d?.created_at;
      if (!f) continue;
      const fecha = f.includes("T") ? f : f + "T00:00:00";
      actividad.push({
        id: `s-${item.id}`,
        tipo: "sin_actividad",
        titulo: "Sin actividad",
        descripcion: `${nombreMiembro(d)} no tiene actividad reciente${item.diasSinContacto !== null ? ` (${item.diasSinContacto} días)` : ""}`,
        fecha,
        miembro_id: item.id,
        diasSinContacto: item.diasSinContacto,
      });
    }

    actividad.sort((a, b) => b.fecha.localeCompare(a.fecha));

    return {
      periodo,
      kpis: {
        miembrosActivos: activos.length,
        totalAsignados: miembrosVisibles.length,
        pausados,
        retirados,
        progresoPromedio,
        variacionProgreso,
        reunionesRealizadas,
        objetivoReuniones,
        reunionesPct,
        enRiesgo: enRiesgo.length,
        necesitanAtencion: necesitanAtencion.length,
      },
      tabla,
      atencion: atencion.slice(0, 8),
      grafico: { serie },
      actividad: actividad.slice(0, 8),
    };
  }, [raw, etapas, periodo, user]);

  if (!data) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return <DashboardClient data={data} periodo={periodo} onPeriodoChange={setPeriodo} esDiscipulador={user?.rol === "discipulador"} />;
}
