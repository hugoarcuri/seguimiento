"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEtapas } from "@/hooks/useEtapas";
import { useRequireRol } from "@/hooks/useRequireRol";
import { differenceInCalendarDays } from "date-fns";
import { calcularSalud, SALUD_CONFIG } from "@/lib/discipulo-health";
import { ReportesClient, type PeriodoReporte, PERIODOS } from "./reportes-client";
import type { ReporteData, EncuentroReporte } from "@/lib/reporte-pdf";

interface DiscipuladorRaw {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
}

interface DiscipuloRaw {
  id: string;
  nombre: string;
  apellido: string;
  lider_id?: string | null;
  etapa_id: number;
  estado: string;
  bautizado: boolean;
  es_miembro: boolean;
}

interface SeguimientoRaw {
  id: string;
  discipulo_id: string;
  discipulador_id: string;
  progreso: number;
  estado: string;
}

interface AgendaRaw {
  id: string;
  discipulo_id: string;
  fecha: string;
  tema_tratado?: string | null;
  realizada?: boolean | null;
}

interface TareaRaw {
  id: string;
  discipulo_id: string;
  titulo: string;
  tipo: string;
  estado: string;
  fecha_limite?: string | null;
  completed_at?: string | null;
}

interface ObjetivoRaw {
  id: string;
  seguimiento_id: string;
  descripcion: string;
  completado: boolean;
  fecha_cumplimiento?: string | null;
}

interface OracionRaw {
  id: string;
  discipulo_id: string;
  estado: string;
}

interface PersonaEvangelismoRaw {
  id: string;
  discipulo_id?: string | null;
  creado_por: string;
  nombre: string;
  apellido: string;
  estado: string;
  fecha_creacion: string;
}

interface EventoEvangelismoRaw {
  id: string;
  persona_id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
}

interface RawData {
  discipuladores: DiscipuladorRaw[];
  discipulos: DiscipuloRaw[];
  seguimientos: SeguimientoRaw[];
  agenda: AgendaRaw[];
  tareas: TareaRaw[];
  objetivos: ObjetivoRaw[];
  oraciones: OracionRaw[];
  personasEvangelismo: PersonaEvangelismoRaw[];
  eventosEvangelismo: EventoEvangelismoRaw[];
}

const ESTADO_DISCIPULO: Record<string, string> = {
  activo: "Activo",
  pausado: "Pausado",
  completado: "Completado",
  retirado: "Retirado",
};

const TIPO_TAREA: Record<string, string> = {
  lectura: "Lectura",
  memorizacion: "Memorización",
  preguntas: "Preguntas",
  practica: "Práctica",
};

const ESTADO_TAREA: Record<string, string> = {
  pendiente: "Pendiente",
  completada: "Completada",
  vencida: "Vencida",
};

export default function ReportesPage() {
  const { etapas } = useEtapas();
  const { permitido, loading: autorizando } = useRequireRol(["admin"]);
  const [periodo, setPeriodo] = useState<PeriodoReporte>("3m");
  const [discipuladorId, setDiscipuladorId] = useState<string>("");
  const [raw, setRaw] = useState<RawData | null>(null);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("profiles").select("id, nombre, apellido, email").eq("rol", "discipulador").order("apellido", { ascending: true }),
      supabase.from("discipulos").select("id, nombre, apellido, lider_id, etapa_id, estado, bautizado, es_miembro"),
      supabase.from("seguimientos").select("id, discipulo_id, discipulador_id, progreso, estado"),
      supabase.from("agenda").select("id, discipulo_id, fecha, tema_tratado, realizada"),
      supabase.from("tareas").select("id, discipulo_id, titulo, tipo, estado, fecha_limite, completed_at"),
      supabase.from("seguimiento_objetivos").select("id, seguimiento_id, descripcion, completado, fecha_cumplimiento"),
      supabase.from("oraciones").select("id, discipulo_id, estado"),
      supabase.from("acompanamiento_evangelistico").select("id, discipulo_id, creado_por, nombre, apellido, estado, fecha_creacion"),
      supabase.from("eventos_evangelismo").select("id, persona_id, tipo, descripcion, fecha"),
    ]).then(([dRes, discRes, segRes, agendaRes, tareasRes, objRes, oraRes, evgRes, evtRes]) => {
      setRaw({
        discipuladores: (dRes.data || []) as DiscipuladorRaw[],
        discipulos: (discRes.data || []) as DiscipuloRaw[],
        seguimientos: (segRes.data || []) as SeguimientoRaw[],
        agenda: (agendaRes.data || []) as AgendaRaw[],
        tareas: (tareasRes.data || []) as TareaRaw[],
        objetivos: (objRes.data || []) as ObjetivoRaw[],
        oraciones: (oraRes.data || []) as OracionRaw[],
        personasEvangelismo: (evgRes.data || []) as PersonaEvangelismoRaw[],
        eventosEvangelismo: (evtRes.data || []) as EventoEvangelismoRaw[],
      });
      if (dRes.data && dRes.data.length > 0 && !discipuladorId) {
        setDiscipuladorId(dRes.data[0].id);
      }
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = useMemo<ReporteData | null>(() => {
    if (!raw || etapas.length === 0 || !discipuladorId) return null;
    const { discipuladores, discipulos, seguimientos, agenda, tareas, objetivos, oraciones, personasEvangelismo, eventosEvangelismo } = raw;

    const discipulador = discipuladores.find((d) => d.id === discipuladorId) || null;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyISO = hoy.toISOString().slice(0, 10);
    const periodoDef = PERIODOS.find((p) => p.id === periodo) || PERIODOS[0];
    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - periodoDef.dias);
    const desdeISO = desde.toISOString().slice(0, 10);

    const enPeriodo = (fecha: string | null | undefined): boolean => {
      if (!fecha) return false;
      const f = fecha.length === 10 ? fecha : fecha.split("T")[0];
      return f >= desdeISO && f <= hoyISO;
    };

    const susDiscipulos = discipulos.filter((d) => d.lider_id === discipuladorId);
    const susIds = new Set(susDiscipulos.map((d) => d.id));

    const segPorDiscipulo = new Map<string, SeguimientoRaw>();
    for (const s of seguimientos) {
      if (!susIds.has(s.discipulo_id)) continue;
      const existente = segPorDiscipulo.get(s.discipulo_id);
      if (!existente || (s.estado === "activo" && existente.estado !== "activo")) {
        segPorDiscipulo.set(s.discipulo_id, s);
      }
    }

    const agendaDelLider = agenda.filter((a) => susIds.has(a.discipulo_id));
    const agendaRealizada = agendaDelLider.filter((a) => a.realizada === true);

    const ultimoEncuentro = new Map<string, string>();
    for (const a of agendaRealizada) {
      const prev = ultimoEncuentro.get(a.discipulo_id);
      if (!prev || a.fecha > prev) ultimoEncuentro.set(a.discipulo_id, a.fecha);
    }

    const tareasDelLider = tareas.filter((t) => susIds.has(t.discipulo_id));
    const tareasPendientesDelLider = tareasDelLider.filter((t) => t.estado !== "completada");

    const segActivos = [...segPorDiscipulo.values()].filter((s) => s.estado === "activo" && s.progreso != null);
    const progresoPromedio = segActivos.length
      ? Math.round(segActivos.reduce((a, b) => a + b.progreso, 0) / segActivos.length)
      : null;

    const objetivosDelLider = objetivos.filter((o) => {
      const seg = segPorDiscipulo.get(o.seguimiento_id);
      return Boolean(seg);
    });

    const nombreDiscipulo = (id: string) => {
      const d = discipulos.find((x) => x.id === id);
      return d ? `${d.apellido}, ${d.nombre}` : "—";
    };

    const reporteDiscipulos = susDiscipulos.map((d) => {
      const seg = segPorDiscipulo.get(d.id);
      const f = ultimoEncuentro.get(d.id);
      const etapa = etapas.find((e) => e.id === d.etapa_id);
      const encuentrosPeriodo = agendaRealizada.filter((a) => a.discipulo_id === d.id && enPeriodo(a.fecha)).length;

      const objetivosPendientes = objetivosDelLider.filter((o) => {
        const seg = segPorDiscipulo.get(d.id);
        return seg && o.seguimiento_id === seg.id && !o.completado;
      }).length;

      const oracionesPendientes = oraciones.filter((o) => o.discipulo_id === d.id && o.estado === "pendiente").length;

      const salud = calcularSalud({
        encuentrosMes: agendaRealizada.filter((a) => a.discipulo_id === d.id && enPeriodo(a.fecha)).length,
        etapa: d.etapa_id,
        bautizado: d.bautizado,
        es_miembro: d.es_miembro,
        objetivosPendientes,
        oracionesPendientes,
      });

      return {
        id: d.id,
        nombre: d.nombre,
        apellido: d.apellido,
        etapa: etapa?.nombre ? etapa.nombre.replace(/^\d+\.\s*/, "") : `Etapa ${d.etapa_id}`,
        estado: ESTADO_DISCIPULO[d.estado] || d.estado,
        salud: SALUD_CONFIG[salud.salud].etiqueta,
        progreso: seg?.progreso ?? null,
        encuentrosPeriodo,
        ultimaReunion: f || null,
        diasSinContacto: f ? differenceInCalendarDays(hoy, new Date(f + "T00:00:00")) : null,
        tareasPendientes: tareasPendientesDelLider.filter((t) => t.discipulo_id === d.id).length,
        bautizado: d.bautizado,
        esMiembro: d.es_miembro,
      };
    });

    const encuentrosPeriodo: EncuentroReporte[] = agendaRealizada
      .filter((a) => enPeriodo(a.fecha))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((a) => ({
        id: a.id,
        discipulo: nombreDiscipulo(a.discipulo_id),
        fecha: a.fecha,
        tema: a.tema_tratado || null,
        realizada: true,
      }));

    const reporteTareas = tareasDelLider
      .slice()
      .sort((a, b) => a.estado.localeCompare(b.estado))
      .map((t) => ({
        id: t.id,
        discipulo: nombreDiscipulo(t.discipulo_id),
        titulo: t.titulo,
        tipo: TIPO_TAREA[t.tipo] || t.tipo,
        estado: ESTADO_TAREA[t.estado] || t.estado,
        fechaLimite: t.fecha_limite || null,
      }));

    const reporteObjetivos = objetivosDelLider.map((o) => ({
      discipulo: nombreDiscipulo(segPorDiscipulo.get(o.seguimiento_id)!.discipulo_id),
      descripcion: o.descripcion,
      completado: o.completado,
    }));

    const personasVinculadas = personasEvangelismo.filter((p) => {
      if (p.creado_por === discipuladorId) return true;
      if (p.discipulo_id && susIds.has(p.discipulo_id)) return true;
      return false;
    });

    const ultimoEventoPorPersona = new Map<string, EventoEvangelismoRaw>();
    for (const e of eventosEvangelismo) {
      const prev = ultimoEventoPorPersona.get(e.persona_id);
      if (!prev || e.fecha > prev.fecha) ultimoEventoPorPersona.set(e.persona_id, e);
    }

    const reporteEvangelismo = personasVinculadas
      .slice()
      .sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion))
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        estado: p.estado,
        fechaCreacion: p.fecha_creacion,
        eventoDescripcion: ultimoEventoPorPersona.get(p.id)?.descripcion || null,
      }));

    return {
      discipulador: discipulador
        ? { nombre: discipulador.nombre, apellido: discipulador.apellido, email: discipulador.email }
        : null,
      periodoLabel: periodoDef.label,
      desde: desdeISO,
      hasta: hoyISO,
      kpis: {
        discipulosTotal: susDiscipulos.length,
        discipulosActivos: susDiscipulos.filter((d) => d.estado === "activo").length,
        encuentrosPeriodo: encuentrosPeriodo.length,
        progresoPromedio,
        tareasPendientes: tareasPendientesDelLider.length,
        tareasCompletadasPeriodo: tareasDelLider.filter((t) => t.estado === "completada" && enPeriodo(t.completed_at)).length,
        objetivosCompletados: objetivosDelLider.filter((o) => o.completado).length,
        objetivosPendientes: objetivosDelLider.filter((o) => !o.completado).length,
        personasEvangelismo: personasVinculadas.length,
      },
      discipulos: reporteDiscipulos,
      encuentros: encuentrosPeriodo,
      tareas: reporteTareas,
      objetivos: reporteObjetivos,
      evangelismo: reporteEvangelismo,
    };
  }, [raw, etapas, discipuladorId, periodo]);

  if (!data || autorizando) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!permitido) return null;

  return (
    <ReportesClient
      data={data}
      discipuladores={raw?.discipuladores.map((d) => ({ id: d.id, nombre: d.nombre, apellido: d.apellido })) || []}
      discipuladorId={discipuladorId}
      onDiscipuladorChange={setDiscipuladorId}
      periodo={periodo}
      onPeriodoChange={setPeriodo}
    />
  );
}
