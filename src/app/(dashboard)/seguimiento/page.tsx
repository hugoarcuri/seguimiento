"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { FormularioSeguimiento } from "./formulario-seguimiento";
import { TimelineSeguimiento } from "./timeline-seguimiento";
import { useReunionForm } from "./use-reunion-form";
import { SeguimientoHeader } from "./seguimiento-header";
import { areaEstudios, areaTrabajo, fmtLocal, inicioSemana, esSemanaDe } from "./data";
import type { SupabaseDiscipulo, SupabaseArea, SupabaseIndicador, SupabaseReunion } from "./data";

export default function SeguimientoPage() {
  const supabase = useMemo(() => createClient(), []);
  const [discipulos, setDiscipulos] = useState<SupabaseDiscipulo[]>([]);
  const [areas, setAreas] = useState<SupabaseArea[]>([]);
  const [indicadores, setIndicadores] = useState<SupabaseIndicador[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [reuniones, setReuniones] = useState<SupabaseReunion[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargandoReuniones, setCargandoReuniones] = useState(false);
  const [saving, setSaving] = useState(false);

  const w = useReunionForm();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ultimoDiscipuloId");
      if (stored) {
        const t = setTimeout(() => setSelectedId(stored), 0);
        return () => clearTimeout(t);
      }
    }
  }, []);

  useEffect(() => {
    Promise.all([
      supabase.from("discipulos").select("*, etapas:etapa_id(*)").order("apellido"),
      supabase.from("areas").select("*").eq("activo", true).order("orden"),
      supabase.from("indicadores").select("*").eq("activo", true).order("orden"),
    ]).then(([dRes, aRes, iRes]) => {
      setDiscipulos(dRes.data || []);
      setAreas(aRes.data || []);
      setIndicadores(iRes.data || []);
      setLoading(false);
    }).catch(console.error);
  }, [supabase]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelado = false;
    const mostrarCarga = setTimeout(() => { if (!cancelado) setCargandoReuniones(true); }, 150);
    supabase
      .from("reuniones")
      .select("*, evaluaciones(*)")
      .eq("discipulo_id", selectedId)
      .order("fecha", { ascending: false })
      .then((rRes) => {
        if (cancelado) return;
        const reunionesData = (rRes.data || []) as SupabaseReunion[];
        setReuniones(reunionesData);
        const semanaActual = reunionesData.find((r) => esSemanaDe(r.fecha, new Date()));
        if (semanaActual) {
          const vals: Record<number, number> = {};
          const obs: Record<number, string> = {};
          (semanaActual.evaluaciones || []).forEach((e) => {
            if (e.valor !== null && e.valor !== undefined) vals[e.indicador_id] = e.valor;
            if (e.observaciones) obs[e.indicador_id] = e.observaciones;
          });
          w.setValores(vals);
          w.setEvalObs(obs);
          const indEstudios = indicadores.find((i) => i.area_id === areaEstudios);
          const indTrabajo = indicadores.find((i) => i.area_id === areaTrabajo);
          if (indEstudios) w.setEstudios(vals[indEstudios.id] !== undefined);
          if (indTrabajo) w.setTrabajo(vals[indTrabajo.id] !== undefined);
        } else {
          w.reset();
        }
        setCargandoReuniones(false);
        clearTimeout(mostrarCarga);
      },
      () => { if (!cancelado) { setCargandoReuniones(false); clearTimeout(mostrarCarga); } }
    );
    return () => { cancelado = true; clearTimeout(mostrarCarga); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, supabase]);

  const handleSelectDiscipulo = (id: string) => {
    if (id === selectedId) return;
    w.reset();
    setReuniones([]);
    setSelectedId(id);
    localStorage.setItem("ultimoDiscipuloId", id);
  };

  const discipulo = discipulos.find((d) => d.id === selectedId);
  const semanaActualReunion = reuniones.find((r) => esSemanaDe(r.fecha, new Date()));
  const indEstudios = indicadores.find((i) => i.area_id === areaEstudios);
  const indTrabajo = indicadores.find((i) => i.area_id === areaTrabajo);
  const respondidos = indicadores.filter((i) => w.valores[i.id] !== undefined).length;
  const pct = indicadores.length > 0 ? Math.round((respondidos / indicadores.length) * 100) : 0;

  const handleSave = async () => {
    setSaving(true);
    const today = format(new Date(), "yyyy-MM-dd");
    const hoy = new Date();
    const ws = inicioSemana(hoy);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 7);
    const { data: reunionExistente, error: errExists } = await supabase
      .from("reuniones")
      .select("id")
      .eq("discipulo_id", selectedId)
      .gte("fecha", fmtLocal(ws))
      .lt("fecha", fmtLocal(we))
      .maybeSingle();
    if (errExists) { toast.error("Error al guardar"); setSaving(false); return; }

    let reunionId: string;
    if (reunionExistente) {
      reunionId = reunionExistente.id;
    } else {
      const { data: reunion, error: insErr } = await supabase.from("reuniones").insert({
        discipulo_id: selectedId, fecha: today,
      }).select().single();
      if (insErr || !reunion) { toast.error("Error al guardar"); setSaving(false); return; }
      reunionId = reunion.id as string;
    }

    // Eliminar evaluaciones de estudios/trabajo si el discípulo ya no estudia/trabaja
    if (!w.estudios && indEstudios) {
      await supabase.from("evaluaciones").delete().eq("reunion_id", reunionId).eq("indicador_id", indEstudios.id);
    }
    if (!w.trabajo && indTrabajo) {
      await supabase.from("evaluaciones").delete().eq("reunion_id", reunionId).eq("indicador_id", indTrabajo.id);
    }

    const inserts = indicadores
      .filter((ind) => w.valores[ind.id] !== undefined)
      .map((ind) => ({
        reunion_id: reunionId,
        indicador_id: ind.id,
        valor: w.valores[ind.id],
        no_evaluado: false,
        observaciones: w.evalObs[ind.id] || null,
      }));
    if (inserts.length > 0) {
      for (const ins of inserts) {
        const { error } = await supabase.from("evaluaciones").upsert(ins, { onConflict: "reunion_id, indicador_id" });
        if (error) { toast.error("Error al guardar las evaluaciones"); setSaving(false); return; }
      }
    }

    setSaving(false);
    toast.success(reunionExistente ? "Reunión de la semana actualizada" : "Reunión guardada");
    void supabase.from("reuniones").select("*, evaluaciones(*)").eq("discipulo_id", selectedId).order("fecha", { ascending: false }).then((r) => {
      setReuniones((r.data || []) as SupabaseReunion[]);
    });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-[920px] mx-auto">
      <SeguimientoHeader
        discipulos={discipulos}
        selectedId={selectedId}
        onSelect={handleSelectDiscipulo}
        discipulo={discipulo}
        reuniones={reuniones}
        pct={pct}
        cargandoReuniones={cargandoReuniones}
      />

      {!selectedId ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Seleccioná un discípulo para iniciar la reunión de seguimiento
        </p>
      ) : discipulo ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">¿Cómo va tu semana?</h2>
            {semanaActualReunion && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Semana guardada · se actualizará al guardar
              </p>
            )}
          </div>

          <FormularioSeguimiento w={w} areas={areas} indicadores={indicadores} />

          <div className="flex justify-end pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <Save className="h-4 w-4 mr-1" />
              {semanaActualReunion ? "Actualizar reunión" : "Guardar reunión"}
            </Button>
          </div>

          <TimelineSeguimiento reuniones={reuniones} indicadores={indicadores} areas={areas} />
        </>
      ) : null}
    </div>
  );
}