"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardCheck, Loader2, CheckCircle2, ChevronLeft, ChevronRight, Plus, Trash2, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ResultadoEvaluacion } from "./resultado-evaluacion";
import { HistorialSemanal } from "./historial-semanal";
import { PasoVidaDevocional, PasoServicioEvangelismo, PasoObservaciones } from "./paso-evaluacion";
import { useEvaluacionWizard } from "./use-evaluacion-wizard";
import {
  areasMeta, opcionesIndicador, paresEvaluacion,
  fmtLocal, inicioSemana, esSemanaDe, MES_ESCALA, pctPromedio,
} from "./data";
import type {
  SupabaseUser, SupabaseDiscipulo, SupabaseArea, SupabaseIndicador,
  SupabaseEvaluacion, SupabaseReunion, SupabaseDesafio, SupabaseAlerta,
} from "./data";

export default function SeguimientoPage() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [discipulos, setDiscipulos] = useState<SupabaseDiscipulo[]>([]);
  const [areas, setAreas] = useState<SupabaseArea[]>([]);
  const [indicadores, setIndicadores] = useState<SupabaseIndicador[]>([]);
  const [objetivosNivel, setObjetivosNivel] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string>("");

  const [reuniones, setReuniones] = useState<SupabaseReunion[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<SupabaseEvaluacion[]>([]);
  const [desafios, setDesafios] = useState<SupabaseDesafio[]>([]);
  const [nuevoDesafio, setNuevoDesafio] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [alertas, setAlertas] = useState<SupabaseAlerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const w = useEvaluacionWizard();

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
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    Promise.all([
      supabase.from("discipulos").select("*, etapas:etapa_id(*)").order("apellido"),
      supabase.from("areas").select("*").eq("activo", true).order("orden"),
      supabase.from("indicadores").select("*").eq("activo", true).order("orden"),
      supabase.from("indicador_nivel").select("*"),
    ]).then(([dRes, aRes, iRes, oRes]) => {
      setDiscipulos(dRes.data || []);
      setAreas(aRes.data || []);
      setIndicadores(iRes.data || []);
      const objMap: Record<string, string> = {};
      (oRes.data || []).forEach((o: { indicador_id: number; nivel_id: number; objetivo: string }) => { objMap[`${o.indicador_id}-${o.nivel_id}`] = o.objetivo; });
      setObjetivosNivel(objMap);
      setLoading(false);
    }).catch(console.error);
  }, [supabase]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelado = false;
    Promise.all([
      supabase.from("reuniones").select("*, evaluaciones(*)").eq("discipulo_id", selectedId).order("fecha", { ascending: false }),
      supabase.from("desafios").select("*").eq("discipulo_id", selectedId).order("fecha_asignado", { ascending: false }),
      supabase.from("alertas").select("*").eq("discipulo_id", selectedId).eq("activa", true).order("created_at", { ascending: false }),
      supabase.from("personas_oracion").select("*").eq("discipulo_id", selectedId).eq("activo", true),
    ]).then(([rRes, dRes, aRes, pRes]) => {
      if (cancelado) return;
      const reunionesData = (rRes.data || []) as SupabaseReunion[];
      setReuniones(reunionesData);
      setEvaluaciones(reunionesData.flatMap((r) => (r.evaluaciones || []).map((e) => ({ ...e }))));
      setDesafios((dRes.data || []) as SupabaseDesafio[]);
      setAlertas(aRes.data || []);
      if (pRes.data?.length) w.setPersonasOracion(pRes.data.map((p: { nombre: string; apellido: string; estado: string }) => ({ nombre: p.nombre, apellido: p.apellido, estado: p.estado })));
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
        if (semanaActual.compromisos) w.setCompromisos(semanaActual.compromisos.split("\n"));
        if (semanaActual.proxima_reunion) w.setProximaReunion(semanaActual.proxima_reunion);
      }
    }).catch(console.error);
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, supabase]);

  const handleSelectDiscipulo = (id: string) => {
    if (id === selectedId) return;
    resetForm();
    setSelectedId(id);
    localStorage.setItem("ultimoDiscipuloId", id);
  };

  const resetForm = () => {
    w.reset();
    setReuniones([]);
    setEvaluaciones([]);
    setDesafios([]);
    setAlertas([]);
    setDeleteId(null);
    setNuevoDesafio("");
  };

  const discipulo = discipulos.find((d) => d.id === selectedId);
  const semanaActualReunion = reuniones.find((r) => esSemanaDe(r.fecha, new Date()));

  const handleGuardarPersonasOracion = async () => {
    if (!user || !selectedId) { toast.error("Seleccioná un discípulo primero"); return; }
    w.setGuardandoPersonas(true);
    const { error: delErr } = await supabase.from("personas_oracion").delete().eq("discipulo_id", selectedId);
    if (delErr) { toast.error("Error al guardar personas"); w.setGuardandoPersonas(false); return; }
    for (const p of w.personasOracion) {
      const { error: insErr } = await supabase.from("personas_oracion").insert({ discipulo_id: selectedId, nombre: p.nombre, apellido: p.apellido, estado: p.estado });
      if (insErr) { toast.error("Error al guardar personas"); w.setGuardandoPersonas(false); return; }
    }
    w.setGuardandoPersonas(false);
    toast.success("Personas guardadas");
  };

  const handleAgregarDesafio = async () => {
    if (!user || !selectedId || !nuevoDesafio.trim()) return;
    const { data, error } = await supabase.from("desafios").insert({
      discipulo_id: selectedId, lider_id: user.id, descripcion: nuevoDesafio.trim(),
    }).select().single();
    if (error) { toast.error("Error al agregar desafío"); return; }
    setDesafios((prev) => [data as SupabaseDesafio, ...prev]);
    setNuevoDesafio("");
    toast.success("Desafío agregado");
  };

  const handleEliminarDesafio = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("desafios").delete().eq("id", deleteId);
    if (error) { toast.error("Error al eliminar desafío"); return; }
    setDesafios((prev) => prev.filter((d) => d.id !== deleteId));
    setDeleteId(null);
    toast.success("Desafío eliminado");
  };

  const handleSave = async () => {
    setSaving(true);
    if (!user) { toast.error("Debés iniciar sesión"); setSaving(false); return; }
    const today = format(new Date(), "yyyy-MM-dd");
    const extras: string[] = [];
    if (w.pasajeLeido) extras.push(`Pasaje leído: ${w.pasajeLeido}`);
    if (w.materialLeido) extras.push(`Material leído: ${w.materialLeido}`);
    if (w.motivosOracion) extras.push(`Motivos de oración: ${w.motivosOracion}`);
    if (w.mensajeoAlguien !== undefined) extras.push(`Contactó a alguien: ${w.mensajeoAlguien === 1 ? `Sí — ${w.mensajeoQuien || "(no especificó)"}` : "No"}`);
    if (w.visitoAlguien !== undefined) extras.push(`Visitó a alguien: ${w.visitoAlguien === 1 ? `Sí — ${w.visitoQuien || "(no especificó)"}` : "No"}`);
    if (w.actoServicio !== undefined) extras.push(`Acto de servicio: ${w.actoServicio === 1 ? `Sí — ${w.actoServicioDesc || "(no especificó)"}` : "No"}`);
    if (w.ministerioSeleccionado) extras.push(`Ministerio: ${w.ministerioSeleccionado}${w.ministerioCustom ? ` (${w.ministerioCustom})` : ""}`);
    if (w.personasOracion.length > 0) {
      extras.push(`Personas por las que ora: ${w.personasOracion.map((p) => `${p.nombre} ${p.apellido} (${p.estado})`).join(", ")}`);
    }
    const obsFinal = [w.obsGenerales, ...extras].filter(Boolean).join("\n\n");

    const compromisosText = w.compromisos.length > 0 || w.desafioPersonalizado ? [...w.compromisos, ...(w.desafioPersonalizado ? [w.desafioPersonalizado] : [])].join("\n") : null;

    const hoy = new Date();
    const ws = inicioSemana(hoy);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 7);
    const { data: reunionExistente } = await supabase
      .from("reuniones")
      .select("id")
      .eq("discipulo_id", selectedId)
      .gte("fecha", fmtLocal(ws))
      .lt("fecha", fmtLocal(we))
      .maybeSingle();

    let reunionId: string;
    if (reunionExistente) {
      const { error: upErr } = await supabase
        .from("reuniones")
        .update({
          observaciones_generales: obsFinal || null,
          compromisos: compromisosText,
          proxima_reunion: w.proximaReunion || null,
        })
        .eq("id", reunionExistente.id);
      if (upErr) { toast.error("Error al actualizar la evaluación de la semana"); setSaving(false); return; }
      reunionId = reunionExistente.id;
    } else {
      const { data: reunion, error: insErr } = await supabase.from("reuniones").insert({
        discipulo_id: selectedId, lider_id: user.id, fecha: today,
        observaciones_generales: obsFinal || null,
        compromisos: compromisosText,
        proxima_reunion: w.proximaReunion || null,
      }).select().single();
      if (insErr || !reunion) { toast.error("Error al guardar"); setSaving(false); return; }
      reunionId = reunion.id;
    }

    const inserts = indicadores.map((ind) => {
      if (w.valores[ind.id] === undefined) return null;
      return { reunion_id: reunionId, indicador_id: ind.id, valor: w.valores[ind.id], no_evaluado: false, observaciones: w.evalObs[ind.id] || null };
    }).filter(Boolean);

    if (inserts.length > 0) {
      for (const ins of inserts) {
        const { error } = await supabase.from("evaluaciones").upsert(ins as Record<string, unknown>, { onConflict: "reunion_id, indicador_id" });
        if (error) { toast.error("Error al guardar las evaluaciones"); setSaving(false); return; }
      }
    }

    if (reunionExistente) {
      const { error } = await supabase.from("desafios").delete().eq("reunion_id", reunionId);
      if (error) { toast.error("Error al guardar los desafíos"); setSaving(false); return; }
    }
    const desafiosACrear = [...w.compromisos];
    if (w.desafioPersonalizado.trim()) desafiosACrear.push(w.desafioPersonalizado.trim());
    for (const desc of desafiosACrear) {
      const { error } = await supabase.from("desafios").insert({ discipulo_id: selectedId, lider_id: user.id, reunion_id: reunionId, descripcion: desc });
      if (error) { toast.error("Error al guardar los desafíos"); setSaving(false); return; }
    }

    const { error: delPersonasErr } = await supabase.from("personas_oracion").delete().eq("discipulo_id", selectedId);
    if (delPersonasErr) { toast.error("Error al guardar las personas"); setSaving(false); return; }
    for (const p of w.personasOracion) {
      const { error: insPersonaErr } = await supabase.from("personas_oracion").insert({ discipulo_id: selectedId, nombre: p.nombre, apellido: p.apellido, estado: p.estado });
      if (insPersonaErr) { toast.error("Error al guardar las personas"); setSaving(false); return; }
    }

    w.setSaved(true);
    setSaving(false);
    toast.success(reunionExistente ? "Evaluación de la semana actualizada" : "Evaluación guardada");

    void supabase.from("reuniones").select("*, evaluaciones(*)").eq("discipulo_id", selectedId).order("fecha", { ascending: false }).then((r) => {
      const reunionesData = (r.data || []) as SupabaseReunion[];
      setReuniones(reunionesData);
      setEvaluaciones(reunionesData.flatMap((rr) => (rr.evaluaciones || []).map((e) => ({ ...e }))));
    });
    void supabase.from("desafios").select("*").eq("discipulo_id", selectedId).order("fecha_asignado", { ascending: false }).then((d) => setDesafios((d.data || []) as SupabaseDesafio[]));
  };

  const avgByArea = (areaId: number) => {
    const items = indicadores.filter((i) => i.area_id === areaId);
    if (items.length === 0) return 0;
    const vals = items.map((i) => w.valores[i.id] ?? -1).filter((v) => v >= 0);
    if (vals.length === 0) {
      const evs = evaluaciones.filter((ev) => items.some((i) => i.id === ev.indicador_id) && ev.valor !== null);
      if (evs.length === 0) return 0;
      return pctPromedio(evs.reduce((s, ev) => s + (ev.valor ?? 0), 0) / evs.length);
    }
    return pctPromedio(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const allEvalData = [...evaluaciones, ...(w.saved ? indicadores.map((i) => ({ indicador_id: i.id, valor: w.valores[i.id], reunion_id: undefined as string | undefined })).filter((x) => x.valor !== undefined) : [])];
  const radarData = areas.map((a) => ({ area: a.nombre, valor: avgByArea(a.id) }));
  const areasConValor = (arr: Array<{ id: number; nombre: string; valor: number }>) => arr.filter((a) => a.valor > 0);
  const fortalezas = areasConValor(areas.map((a) => ({ id: a.id, nombre: a.nombre, valor: avgByArea(a.id) }))).sort((a, b) => b.valor - a.valor).slice(0, 3);
  const debilidades = areasConValor(areas.map((a) => ({ id: a.id, nombre: a.nombre, valor: avgByArea(a.id) }))).sort((a, b) => a.valor - b.valor).slice(0, 3);

  const evolutionData = () => {
    const byDate: Record<string, Record<number, number[]>> = {};
    const allEvs = w.saved ? allEvalData : evaluaciones;
    allEvs.forEach((ev) => {
      if (ev.valor === null) return;
      const ind = indicadores.find((i) => i.id === ev.indicador_id);
      if (!ind) return;
      const fecha = ev.reunion_id ? reuniones.find((r) => r.id === ev.reunion_id)?.fecha : format(new Date(), "yyyy-MM-dd");
      if (!fecha) return;
      if (!byDate[fecha]) byDate[fecha] = {};
      if (!byDate[fecha][ind.area_id]) byDate[fecha][ind.area_id] = [];
      byDate[fecha][ind.area_id].push(ev.valor);
    });
    return Object.entries(byDate).map(([fecha, areas]) => ({
      fecha, ...Object.fromEntries(Object.entries(areas).map(([aid, vals]) => [aid, Math.round((vals as number[]).reduce((a, b) => a + b, 0) / (vals as number[]).length)])),
    })).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-12);
  };

  const monthlyData = () => {
    const byMonth: Record<string, Record<number, number[]>> = {};
    const allEvs = w.saved ? allEvalData : evaluaciones;
    allEvs.forEach((ev) => {
      if (ev.valor === null) return;
      const ind = indicadores.find((i) => i.id === ev.indicador_id);
      if (!ind) return;
      const fecha = ev.reunion_id ? reuniones.find((r) => r.id === ev.reunion_id)?.fecha : format(new Date(), "yyyy-MM-dd");
      if (!fecha) return;
      const mes = fecha.slice(0, 7);
      if (!byMonth[mes]) byMonth[mes] = {};
      if (!byMonth[mes][ind.area_id]) byMonth[mes][ind.area_id] = [];
      byMonth[mes][ind.area_id].push(ev.valor);
    });
    return Object.entries(byMonth).map(([mes, areas]) => ({
      mes, ...Object.fromEntries(Object.entries(areas).map(([aid, vals]) => [aid, Math.round((vals as number[]).reduce((a, b) => a + b, 0) / (vals as number[]).length * MES_ESCALA)])),
    })).sort((a, b) => a.mes.localeCompare(b.mes)).slice(-6);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Seguimiento</h1>
          <p className="text-xs text-muted-foreground">Reunión de discipulado</p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
          {discipulos.map((d) => (
            <button key={d.id} type="button" onClick={() => handleSelectDiscipulo(d.id)}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                selectedId === d.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            ><UserIcon className="h-3 w-3" />{d.nombre}</button>
          ))}
        </div>
      </div>

      {!selectedId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Seleccioná un discípulo para iniciar la evaluación</CardContent></Card>
      ) : discipulo ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* DISCIPLE INFO BAR */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {discipulo.nombre?.[0]}{discipulo.apellido?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{discipulo.nombre} {discipulo.apellido}</p>
                <p className="text-[11px] text-muted-foreground">{discipulo.etapas?.nombre || `Nivel ${discipulo.etapa_id}`}{reuniones.length > 0 && ` · ${reuniones.length} reuniones`}</p>
                {semanaActualReunion && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Evaluación de esta semana guardada · se actualizará al guardar
                  </p>
                )}
              </div>
            </div>

            {/* DESAFÍOS CRUD */}
            <Card>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Desafíos</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Nuevo desafío..." className="h-9 text-sm" value={nuevoDesafio} onChange={(e) => setNuevoDesafio(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAgregarDesafio(); }}
                  />
                  <Button size="sm" variant="outline" onClick={handleAgregarDesafio} disabled={!nuevoDesafio.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {desafios.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">Sin desafíos pendientes</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {desafios.filter((d) => d.estado !== "completado" && d.estado !== "no_realizado").map((d) => (
                      <div key={d.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-muted/30 text-sm">
                        <span className="truncate">{d.descripcion}</span>
                        <button type="button" onClick={() => setDeleteId(d.id)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* HISTORIAL SEMANAL */}
          <HistorialSemanal
            reuniones={reuniones}
            indicadores={indicadores}
            areas={areas}
            opcionesIndicador={opcionesIndicador}
          />

          {/* WIZARD */}
          {!w.saved ? (
            <>
              {/* STEP INDICATOR */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {paresEvaluacion.map((title, i) => (
                    <button key={i} type="button" onClick={() => w.setPar(i + 1)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                        w.par === i + 1 ? "bg-primary text-primary-foreground shadow-sm" : w.par > i + 1 ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground/60"
                      }`}
                    >
                      {w.par > i + 1 ? <CheckCircle2 className="h-3 w-3" /> : null}
                      {title}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">Paso {w.par} de 3</span>
              </div>

              {w.par === 1 && (
                <PasoVidaDevocional w={w} areas={areas} indicadores={indicadores} objetivosNivel={objetivosNivel} etapaId={discipulo?.etapa_id} />
              )}
              {w.par === 2 && (
                <PasoServicioEvangelismo w={w} areas={areas} indicadores={indicadores} objetivosNivel={objetivosNivel} etapaId={discipulo?.etapa_id} onGuardarPersonas={handleGuardarPersonasOracion} />
              )}
              {w.par === 3 && (
                <PasoObservaciones w={w} />
              )}

              {/* NAVIGATION */}
              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" size="sm" disabled={w.par === 1} onClick={() => w.setPar(w.par - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                {w.par < 3 ? (
                  <Button size="sm" onClick={() => w.setPar(w.par + 1)}>
                    Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Guardar evaluación
                  </Button>
                )}
              </div>
            </>
          ) : (
            <ResultadoEvaluacion
              radarData={radarData}
              evolutionData={evolutionData()}
              monthlyData={monthlyData()}
              fortalezas={fortalezas}
              debilidades={debilidades}
              alertas={alertas}
              areas={areas}
              areasMeta={areasMeta}
              indicadores={indicadores}
              saving={saving}
              onNuevaEvaluacion={w.reset}
            />
          )}
        </>
      ) : null}

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar desafío</DialogTitle>
            <DialogDescription>¿Estás seguro de eliminar este desafío? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={handleEliminarDesafio}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
