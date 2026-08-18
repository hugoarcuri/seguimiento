"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MiembroDetailClient } from "../miembro-detail-client";
import { calcularSalud, contarEncuentrosMes } from "@/lib/discipulo-health";
import type {
  Miembro, Etapa, Agenda, Oracion, Tarea, Timeline, Seguimiento,
  SeguimientoEvaluacion, SeguimientoObjetivo,
} from "@/types/database";

function MiembroVerInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState<{
    miembro: Miembro;
    etapas: Etapa[];
    agendas: Agenda[];
    oraciones: Oracion[];
    tareas: Tarea[];
    timeline: Timeline[];
    seguimientos: Seguimiento[];
    evaluacion: SeguimientoEvaluacion | null;
    objetivos: SeguimientoObjetivo[];
    discipulador?: { nombre: string; apellido: string } | null;
    discipuladores?: Array<{ id: string; nombre: string; apellido: string }>;
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
        const [miembroRes, etapasRes, agendasRes, oracionesRes, tareasRes, timelineRes, seguimientosRes] = await Promise.all([
          supabase.from("miembros").select("*").eq("id", id).single(),
          supabase.from("etapas").select("*").order("orden", { ascending: true }),
          supabase.from("agenda").select("*").eq("miembro_id", id).order("fecha", { ascending: false }),
          supabase.from("oraciones").select("*").eq("miembro_id", id).order("fecha", { ascending: false }),
          supabase.from("tareas").select("*").eq("miembro_id", id).order("created_at", { ascending: false }),
          supabase.from("timeline").select("*").eq("miembro_id", id).order("created_at", { ascending: false }),
          supabase.from("seguimientos").select("*").eq("miembro_id", id).order("created_at", { ascending: false }),
        ]);
        if (cancelado) return;
        if (!miembroRes.data) { setLoading(false); return; }
        const miembro = miembroRes.data as Miembro;
        let discipulador: { nombre: string; apellido: string } | null = null;
        let discipuladores: Array<{ id: string; nombre: string; apellido: string }> = [];
        if (miembro.lider_id) {
          const { data: liderRes } = await supabase
            .from("profiles")
            .select("nombre, apellido")
            .eq("id", miembro.lider_id)
            .maybeSingle();
          if (!cancelado && liderRes) discipulador = liderRes as { nombre: string; apellido: string };
        }
        const { data: listaDiscipuladores } = await supabase
          .from("profiles")
          .select("id, nombre, apellido")
          .or("rol.eq.discipulador,rol.eq.admin")
          .order("apellido", { ascending: true });
        if (!cancelado) discipuladores = (listaDiscipuladores || []) as Array<{ id: string; nombre: string; apellido: string }>;
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
          miembro,
          etapas: etapasRes.data || [],
          agendas: agendasRes.data || [],
          oraciones: oracionesRes.data || [],
          tareas: tareasRes.data || [],
          timeline: timelineRes.data || [],
          seguimientos,
          evaluacion,
          objetivos,
          discipulador,
          discipuladores,
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
  if (!data) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Miembro no encontrado</p></div>;

  const { miembro, agendas, oraciones, objetivos } = data;
  const salud = calcularSalud({
    encuentrosMes: contarEncuentrosMes(agendas.map((a) => ({ fecha: a.fecha, realizada: a.realizada }))),
    etapa: miembro.etapa_id,
    bautizado: miembro.bautizado ?? false,
    es_miembro: miembro.es_miembro ?? false,
    objetivosPendientes: objetivos.filter((o) => !o.completado).length,
    oracionesPendientes: oraciones.filter((o) => o.estado !== "respondida").length,
  });

  return <MiembroDetailClient key={miembro.id} {...data} salud={salud} />;
}

export function MiembroVerWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>}>
      <MiembroVerInner />
    </Suspense>
  );
}
