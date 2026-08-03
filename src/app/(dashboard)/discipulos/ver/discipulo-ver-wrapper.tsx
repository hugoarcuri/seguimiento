"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DiscipuloDetailClient } from "../discipulo-detail-client";
import type { Discipulo, Etapa, Agenda, Oracion, Tarea, Timeline } from "@/types/database";

interface WrapperData {
  discipulo: Discipulo;
  etapas: Etapa[];
  agendas: Agenda[];
  oraciones: Oracion[];
  tareas: Tarea[];
  timeline: Timeline[];
}

function DiscipuloVerInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState<WrapperData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      const t = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(t);
    }
    let cancelado = false;
    const supabase = createClient();
    Promise.all([
      supabase.from("discipulos").select("*").eq("id", id).single(),
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
      supabase.from("agenda").select("*").eq("discipulo_id", id).order("fecha", { ascending: false }),
      supabase.from("oraciones").select("*").eq("discipulo_id", id).order("fecha", { ascending: false }),
      supabase.from("tareas").select("*").eq("discipulo_id", id).order("created_at", { ascending: false }),
      supabase.from("timeline").select("*").eq("discipulo_id", id).order("created_at", { ascending: false }),
    ]).then(([discipuloRes, etapasRes, agendasRes, oracionesRes, tareasRes, timelineRes]) => {
      if (cancelado) return;
      if (!discipuloRes.data) { setLoading(false); return; }
      setData({
        discipulo: discipuloRes.data,
        etapas: etapasRes.data || [],
        agendas: agendasRes.data || [],
        oraciones: oracionesRes.data || [],
        tareas: tareasRes.data || [],
        timeline: timelineRes.data || [],
      });
      setLoading(false);
    }).catch(console.error);
    return () => { cancelado = true; };
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!data) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Discípulo no encontrado</p></div>;
  return <DiscipuloDetailClient key={data.discipulo.id} {...data} />;
}

export function DiscipuloVerWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>}>
      <DiscipuloVerInner />
    </Suspense>
  );
}
