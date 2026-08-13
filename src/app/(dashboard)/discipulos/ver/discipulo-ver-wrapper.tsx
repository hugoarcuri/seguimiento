"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DiscipuloDetailClient } from "../discipulo-detail-client";
import { calcularSalud, contarEncuentrosMes } from "@/lib/discipulo-health";
import type {
  Discipulo, Etapa, Agenda, Oracion, Tarea, Timeline, Seguimiento,
  SeguimientoEvaluacion, SeguimientoObjetivo,
} from "@/types/database";

function DiscipuloVerInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState<{
    discipulo: Discipulo;
    etapas: Etapa[];
    agendas: Agenda[];
    oraciones: Oracion[];
    tareas: Tarea[];
    timeline: Timeline[];
    seguimientos: Seguimiento[];
    evaluacion: SeguimientoEvaluacion | null;
    objetivos: SeguimientoObjetivo[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      const t = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(t);
    }
    let cancelado = false;
    const supabase = createClient();
    (async () => {
      try {
        const [discipuloRes, etapasRes, agendasRes, oracionesRes, tareasRes, timelineRes, seguimientosRes] = await Promise.all([
          supabase.from("discipulos").select("*").eq("id", id).single(),
          supabase.from("etapas").select("*").order("orden", { ascending: true }),
          supabase.from("agenda").select("*").eq("discipulo_id", id).order("fecha", { ascending: false }),
          supabase.from("oraciones").select("*").eq("discipulo_id", id).order("fecha", { ascending: false }),
          supabase.from("tareas").select("*").eq("discipulo_id", id).order("created_at", { ascending: false }),
          supabase.from("timeline").select("*").eq("discipulo_id", id).order("created_at", { ascending: false }),
          supabase.from("seguimientos").select("*").eq("discipulo_id", id).order("created_at", { ascending: false }),
        ]);
        if (cancelado) return;
        if (!discipuloRes.data) { setLoading(false); return; }
        const discipulo = discipuloRes.data as Discipulo;
        const seguimientos = (seguimientosRes.data || []) as Seguimiento[];
        const seg = seguimientos.find((s) => s.estado === "activo") || seguimientos[0];
        let evaluacion: SeguimientoEvaluacion | null = null;
        let objetivos: SeguimientoObjetivo[] = [];
        if (seg) {
          const [evRes, objRes] = await Promise.all([
            supabase.from("seguimiento_evaluaciones").select("*").eq("seguimiento_id", seg.id).maybeSingle(),
            supabase.from("seguimiento_objetivos").select("*").eq("seguimiento_id", seg.id).order("created_at", { ascending: true }),
          ]);
          if (!cancelado) {
            evaluacion = (evRes.data as SeguimientoEvaluacion) || null;
            objetivos = (objRes.data as SeguimientoObjetivo[]) || [];
          }
        }
        setData({
          discipulo,
          etapas: etapasRes.data || [],
          agendas: agendasRes.data || [],
          oraciones: oracionesRes.data || [],
          tareas: tareasRes.data || [],
          timeline: timelineRes.data || [],
          seguimientos,
          evaluacion,
          objetivos,
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (!cancelado) setLoading(false);
      }
    })();
    return () => { cancelado = true; };
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!data) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Discípulo no encontrado</p></div>;

  const { discipulo, agendas, oraciones, objetivos } = data;
  const salud = calcularSalud({
    encuentrosMes: contarEncuentrosMes(agendas.map((a) => a.fecha)),
    etapa: discipulo.etapa_id,
    bautizado: discipulo.bautizado ?? false,
    es_miembro: discipulo.es_miembro ?? false,
    objetivosPendientes: objetivos.filter((o) => !o.completado).length,
    oracionesPendientes: oraciones.filter((o) => o.estado !== "respondida").length,
  });

  return <DiscipuloDetailClient key={discipulo.id} {...data} salud={salud} />;
}

export function DiscipuloVerWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>}>
      <DiscipuloVerInner />
    </Suspense>
  );
}
