"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DiscipuladoresDashboardClient, type DiscipuladoresDashboardData } from "./discipuladores-dashboard-client";
import { useEtapas } from "@/hooks/useEtapas";
import { useRequireRol } from "@/hooks/useRequireRol";
import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DEFAULT_PERIODO,
  DIAS_POR_PERIODO,
  PROGRESO_BAJO,
  SIN_CONTACTO_DIAS,
  calcularEstado,
  type Periodo,
} from "./constants";

interface DiscipuloRaw {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url?: string | null;
  etapa_id: number;
  estado: string;
  lider_id?: string | null;
  created_at: string;
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
  lider_id: string;
  fecha: string;
  tema_tratado?: string | null;
  realizada?: boolean | null;
  discipulos?: { nombre: string; apellido: string } | null;
}

interface TareaRaw {
  id: string;
  discipulo_id: string;
  lider_id: string;
  titulo: string;
  estado: string;
  completed_at?: string | null;
  created_at: string;
}

interface DiscipuladorRaw {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  avatar_url?: string | null;
}

interface RawData {
  discipuladores: DiscipuladorRaw[];
  discipulos: DiscipuloRaw[];
  seguimientos: SeguimientoRaw[];
  agenda: AgendaRaw[];
  tareas: TareaRaw[];
}

const ESTADO_RANK: Record<string, number> = {
  critico: 0,
  necesita_ayuda: 1,
  en_riesgo: 2,
  bueno: 3,
  excelente: 4,
  sin_discipulos: 5,
};

const BUCKET_DIAS: Record<Periodo, number> = {
  "7d": 1,
  "30d": 1,
  "90d": 7,
  todo: 30,
};

export default function DiscipuladoresDashboardPage() {
  const { etapas } = useEtapas();
  const { permitido, loading: autorizando } = useRequireRol(["admin"]);
  const [periodo, setPeriodo] = useState<Periodo>(DEFAULT_PERIODO);
  const [raw, setRaw] = useState<RawData | null>(null);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("profiles").select("id, nombre, apellido, email, avatar_url").eq("rol", "discipulador").order("apellido", { ascending: true }),
      supabase.from("discipulos").select("id, nombre, apellido, avatar_url, etapa_id, estado, lider_id, created_at"),
      supabase.from("seguimientos").select("id, discipulo_id, progreso, estado"),
      supabase.from("agenda").select("id, discipulo_id, lider_id, fecha, tema_tratado, realizada, discipulos:discipulo_id(nombre, apellido)").order("fecha", { ascending: false }),
      supabase.from("tareas").select("id, discipulo_id, lider_id, titulo, estado, completed_at, created_at").order("created_at", { ascending: false }).limit(200),
    ]).then(([discipuladoresRes, discipulosRes, seguimientosRes, agendaRes, tareasRes]) => {
      setRaw({
        discipuladores: (discipuladoresRes.data || []) as DiscipuladorRaw[],
        discipulos: (discipulosRes.data || []) as DiscipuloRaw[],
        seguimientos: (seguimientosRes.data || []) as SeguimientoRaw[],
        agenda: (agendaRes.data || []) as unknown as AgendaRaw[],
        tareas: (tareasRes.data || []) as TareaRaw[],
      });
    }).catch(console.error);
  }, []);

  const data = useMemo<DiscipuladoresDashboardData | null>(() => {
    if (!raw || etapas.length === 0) return null;
    const { discipuladores, discipulos, seguimientos, agenda, tareas } = raw;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const dias = DIAS_POR_PERIODO[periodo];
    let inicio: Date;
    if (Number.isFinite(dias)) {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - dias);
    } else {
      const fechas = [
        ...discipulos.map((d) => new Date(d.created_at)),
        ...agenda.map((a) => new Date(a.fecha + "T00:00:00")),
      ];
      inicio = fechas.length ? new Date(Math.min(...fechas.map((f) => f.getTime()))) : new Date(hoy.getTime() - 180 * 86400000);
    }

    const enPeriodoFecha = (fechaStr: string): boolean => {
      const f = new Date(fechaStr + "T00:00:00");
      return f >= inicio && f <= hoy;
    };
    const enPeriodoDate = (d: Date): boolean => d >= inicio && d <= hoy;
    const diasDesde = (fechaStr: string) => differenceInCalendarDays(hoy, new Date(fechaStr + "T00:00:00"));

    const segPorDiscipulo = new Map<string, SeguimientoRaw>();
    for (const s of seguimientos) {
      const existente = segPorDiscipulo.get(s.discipulo_id);
      if (!existente || (s.estado === "activo" && existente.estado !== "activo")) {
        segPorDiscipulo.set(s.discipulo_id, s);
      }
    }

    const ultimoEncuentro = new Map<string, string>();
    for (const a of agenda) {
      if (!a.realizada) continue;
      if (!ultimoEncuentro.has(a.discipulo_id)) ultimoEncuentro.set(a.discipulo_id, a.fecha);
    }

    const reunidosEnPeriodo = new Set<string>();
    for (const a of agenda) {
      if (a.realizada && a.fecha <= hoy.toISOString().slice(0, 10) && enPeriodoFecha(a.fecha)) reunidosEnPeriodo.add(a.discipulo_id);
    }

    const enRiesgo = (d: DiscipuloRaw, seg?: SeguimientoRaw): string[] => {
      const razones: string[] = [];
      if (!seg) razones.push("Sin seguimiento");
      else if (seg.progreso < PROGRESO_BAJO) razones.push(`Progreso bajo (${seg.progreso}%)`);
      const f = ultimoEncuentro.get(d.id);
      if (!f) razones.push("Sin encuentros");
      else if (diasDesde(f) >= SIN_CONTACTO_DIAS) razones.push(`Sin encuentro (${diasDesde(f)} días)`);
      return razones;
    };

    const discipuloNombre = new Map(discipulos.map((d) => [d.id, d]));
    const liderNombre = new Map(discipuladores.map((p) => [p.id, p]));
    const nombreCompleto = (nombre?: string, apellido?: string) => (nombre ? `${apellido}, ${nombre}` : "—");
    const nombreLider = (id?: string | null) => {
      const p = id ? liderNombre.get(id) : undefined;
      return p ? `${p.nombre} ${p.apellido}` : "Un discipulador";
    };

    const activos = discipulos.filter((d) => d.estado === "activo");
    const discipulosActivosAsignados = activos.filter((d) => d.lider_id);

    const porLider = new Map<string, DiscipuloRaw[]>();
    for (const d of discipulos) {
      if (!d.lider_id) continue;
      const arr = porLider.get(d.lider_id) || [];
      arr.push(d);
      porLider.set(d.lider_id, arr);
    }

    const tabla = discipuladores.map((disc) => {
      const susDiscipulos = porLider.get(disc.id) || [];
      const susActivos = susDiscipulos.filter((d) => d.estado === "activo");
      const conSeg = susActivos.map((d) => ({ d, seg: segPorDiscipulo.get(d.id) }));
      const progresos = conSeg.filter((x) => x.seg && x.seg.estado === "activo" && x.seg.progreso != null).map((x) => x.seg!.progreso);
      const progresoPromedio = progresos.length ? Math.round(progresos.reduce((a, b) => a + b, 0) / progresos.length) : null;
      const reunidos = susActivos.filter((d) => reunidosEnPeriodo.has(d.id)).length;
      const reunionesPct = susActivos.length ? Math.round((reunidos / susActivos.length) * 100) : null;
      const estado = calcularEstado(progresoPromedio, reunionesPct);

      const enRiesgoCount = susActivos.filter((d) => enRiesgo(d, segPorDiscipulo.get(d.id)).length > 0).length;
      const sinContacto = susActivos.filter((d) => {
        const f = ultimoEncuentro.get(d.id);
        return !f || diasDesde(f) >= SIN_CONTACTO_DIAS;
      }).length;
      const listosAvanzar = conSeg.filter((x) => x.seg && x.seg.estado === "activo" && x.seg.progreso >= 80).length;

      const fechasEncuentro = susActivos
        .map((d) => ultimoEncuentro.get(d.id))
        .filter((f): f is string => Boolean(f));
      const diasUltimaReunion = fechasEncuentro.length
        ? Math.min(...fechasEncuentro.map((f) => diasDesde(f)))
        : null;

      const susIds = new Set(susDiscipulos.map((d) => d.id));
      const reunionesRecientes = agenda
        .filter((a) => susIds.has(a.discipulo_id))
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          discipulo: a.discipulos ? nombreCompleto(a.discipulos.nombre, a.discipulos.apellido) : "—",
          fecha: a.fecha,
          tema: a.tema_tratado || null,
        }));

      const alerta = (() => {
        if (estado === "critico") return "Situación crítica: revisá a este discipulador hoy mismo.";
        if (estado === "necesita_ayuda") return "Necesita acompañamiento: hay discípulos con progreso bajo o sin reuniones.";
        if (estado === "en_riesgo") return "En riesgo: conviene acercarse y acompañar.";
        return null;
      })();

      return {
        id: disc.id,
        nombre: disc.nombre,
        apellido: disc.apellido,
        email: disc.email,
        avatar_url: disc.avatar_url || null,
        activos: susActivos.length,
        progresoPromedio,
        reunidos,
        reunionesPct,
        estado,
        enRiesgo: enRiesgoCount,
        sinContacto,
        diasUltimaReunion,
        listosAvanzar,
        detalle: {
          discipulos: susDiscipulos.map((d) => {
            const seg = segPorDiscipulo.get(d.id);
            const f = ultimoEncuentro.get(d.id);
            const etapa = etapas.find((e) => e.id === d.etapa_id);
            return {
              id: d.id,
              nombre: d.nombre,
              apellido: d.apellido,
              avatar_url: d.avatar_url || null,
              estado: d.estado,
              etapa: etapa?.nombre ? etapa.nombre.replace(/^\d+\.\s*/, "") : `Etapa ${d.etapa_id}`,
              progreso: seg?.progreso ?? null,
              razones: enRiesgo(d, seg),
              diasSinContacto: f ? diasDesde(f) : null,
              listoAvanzar: Boolean(seg && seg.estado === "activo" && seg.progreso >= 80),
            };
          }),
          reunionesRecientes,
          alerta,
        },
      };
    });

    const actividad: DiscipuladoresDashboardData["actividad"] = [];

    for (const a of agenda) {
      const d = a.discipulo_id ? discipuloNombre.get(a.discipulo_id) : undefined;
      const nombreD = d ? nombreCompleto(d.nombre, d.apellido) : "un discípulo";
      if (a.realizada && enPeriodoFecha(a.fecha) && a.fecha <= hoy.toISOString().slice(0, 10)) {
        actividad.push({
          id: `r-${a.id}`,
          tipo: "reunion",
          discipulador_id: a.lider_id,
          discipulador: nombreLider(a.lider_id),
          descripcion: `se reunió con ${nombreD}`,
          fecha: a.fecha + "T00:00:00",
        });
      } else if (a.fecha > hoy.toISOString().slice(0, 10) && diasDesde(a.fecha) >= -7) {
        actividad.push({
          id: `p-${a.id}`,
          tipo: "reunion_programada",
          discipulador_id: a.lider_id,
          discipulador: nombreLider(a.lider_id),
          descripcion: `tiene una reunión programada con ${nombreD}`,
          fecha: a.fecha + "T00:00:00",
        });
      }
    }

    for (const d of discipulos) {
      if (enPeriodoDate(new Date(d.created_at))) {
        actividad.push({
          id: `n-${d.id}`,
          tipo: "nuevo_discipulo",
          discipulador_id: d.lider_id || undefined,
          discipulador: nombreLider(d.lider_id),
          descripcion: `agregó a ${nombreCompleto(d.nombre, d.apellido)}`,
          fecha: d.created_at,
        });
      }
    }

    for (const t of tareas) {
      if (t.estado === "completada" && t.completed_at && enPeriodoDate(new Date(t.completed_at))) {
        const d = t.discipulo_id ? discipuloNombre.get(t.discipulo_id) : undefined;
        actividad.push({
          id: `t-${t.id}`,
          tipo: "tarea",
          discipulador_id: t.lider_id || undefined,
          discipulador: nombreLider(t.lider_id),
          descripcion: `${d ? nombreCompleto(d.nombre, d.apellido) : "Un discípulo"} completó "${t.titulo}"`,
          fecha: t.completed_at,
        });
      }
    }

    for (const disc of tabla) {
      if (disc.sinContacto > 0) {
        actividad.push({
          id: `s-${disc.id}`,
          tipo: "sin_actividad",
          discipulador_id: disc.id,
          discipulador: `${disc.nombre} ${disc.apellido}`,
          descripcion: `tiene ${disc.sinContacto} discípulo(s) sin actividad`,
          fecha: hoy.toISOString(),
        });
      }
    }

    actividad.sort((a, b) => b.fecha.localeCompare(a.fecha));

    const atencion = tabla
      .filter((d) => d.estado === "en_riesgo" || d.estado === "necesita_ayuda" || d.estado === "critico")
      .sort((a, b) => ESTADO_RANK[a.estado] - ESTADO_RANK[b.estado] || b.enRiesgo - a.enRiesgo)
      .map((d) => ({
        id: d.id,
        nombre: d.nombre,
        apellido: d.apellido,
        avatar_url: d.avatar_url,
        estado: d.estado,
        enRiesgo: d.enRiesgo,
        diasUltimaReunion: d.diasUltimaReunion,
        progreso: d.progresoPromedio,
        reunionesPct: d.reunionesPct,
      }));

    // Serie para el gráfico
    const bucketDias = BUCKET_DIAS[periodo];
    const serie: DiscipuladoresDashboardData["grafico"]["serie"] = [];
    for (let t = new Date(inicio); t <= hoy; t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + bucketDias)) {
      const fin = new Date(Math.min(t.getTime() + (bucketDias - 1) * 86400000, hoy.getTime()));
      const finISO = fin.toISOString().slice(0, 10);
      const etiqueta =
        bucketDias >= 30
          ? format(t, "MMM yyyy", { locale: es })
          : format(t, "d MMM", { locale: es });
      serie.push({
        etiqueta,
        reuniones: agenda.filter((a) => a.realizada && a.fecha <= finISO && a.fecha >= t.toISOString().slice(0, 10)).length,
        discipulosActivos: discipulos.filter((d) => {
          const c = new Date(d.created_at);
          return c <= fin && c >= t && d.estado === "activo";
        }).length,
      });
    }

    const progresoPorEtapa = etapas
      .map((e) => {
        const segs = segPorDiscipulo;
        const ids = discipulos.filter((d) => d.etapa_id === e.id).map((d) => d.id);
        const progs = ids
          .map((id) => segs.get(id))
          .filter((s): s is SeguimientoRaw => Boolean(s) && s?.estado === "activo")
          .map((s) => s.progreso)
          .filter((p): p is number => p != null);
        return {
          nombre: e.nombre.replace(/^\d+\.\s*/, ""),
          promedio: progs.length ? Math.round(progs.reduce((a, b) => a + b, 0) / progs.length) : 0,
          cantidad: progs.length,
        };
      })
      .filter((x) => x.cantidad > 0);

    const discipuladoresActivos = tabla.filter((d) => d.activos > 0 || (porLider.get(d.id)?.length ?? 0) > 0).length;
    const pctActivos = discipuladores.length ? Math.round((discipuladoresActivos / discipuladores.length) * 100) : 0;

    const segActivos = seguimientos.filter((s) => s.estado === "activo");
    const progresoPromedioGlobal = segActivos.length
      ? Math.round(segActivos.reduce((acc, s) => acc + s.progreso, 0) / segActivos.length)
      : null;

    const reunionesRealizadas = agenda.filter((a) => a.realizada && a.fecha <= hoy.toISOString().slice(0, 10) && enPeriodoFecha(a.fecha)).length;
    const objetivoReuniones = discipulosActivosAsignados.length;
    const reunionesPctGlobal = objetivoReuniones ? Math.min(100, Math.round((reunionesRealizadas / objetivoReuniones) * 100)) : 0;

    const nuevosEnPeriodo = discipulos.filter((d) => enPeriodoDate(new Date(d.created_at))).length;

    return {
      periodo,
      kpis: {
        discipuladoresActivos,
        pctActivos,
        discipulosActivos: discipulosActivosAsignados.length,
        nuevosEnPeriodo,
        reunionesRealizadas,
        objetivoReuniones,
        reunionesPct: reunionesPctGlobal,
        progresoPromedio: progresoPromedioGlobal,
        conSeguimiento: segActivos.length,
        requierenAtencion: atencion.length,
      },
      tabla: tabla
        .slice()
        .sort((a, b) => ESTADO_RANK[a.estado] - ESTADO_RANK[b.estado] || b.enRiesgo - a.enRiesgo || (b.reunionesPct ?? 0) - (a.reunionesPct ?? 0)),
      atencion,
      grafico: { serie, progresoPorEtapa },
      actividad: actividad.slice(0, 8),
    };
  }, [raw, etapas, periodo]);

  if (!data || autorizando) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!permitido) return null;

  return <DiscipuladoresDashboardClient data={data} periodo={periodo} onPeriodoChange={setPeriodo} />;
}
