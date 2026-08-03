"use client";

import { useCallback, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, Loader2, Save, Plus, Trash2, User, CalendarDays, UserCheck, TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ETAPAS, nombreEtapa, AREAS_EVALUACION, NIVELES_EVALUACION, OBJETIVOS_SUGERIDOS, calcularProgreso,
} from "../seguimiento-constants";
import type {
  Seguimiento, SeguimientoEvaluacion, SeguimientoObjetivo, SeguimientoObservacion, SeguimientoHistorial,
} from "@/types/database";

const historialLabel: Record<string, string> = {
  etapa: "Etapa",
  evaluacion: "Evaluación",
  objetivo: "Objetivo",
  observacion: "Observación",
};

function SeguimientoDetalle({ id }: { id: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);

  const [seguimiento, setSeguimiento] = useState<(Seguimiento & {
    discipulos?: { nombre: string; apellido: string };
    discipuladores?: { nombre: string; apellido: string };
  }) | null>(null);
  const [evaluacion, setEvaluacion] = useState<SeguimientoEvaluacion | null>(null);
  const [objetivos, setObjetivos] = useState<SeguimientoObjetivo[]>([]);
  const [observaciones, setObservaciones] = useState<(SeguimientoObservacion & { perfiles?: { nombre: string; apellido: string } })[]>([]);
  const [historial, setHistorial] = useState<SeguimientoHistorial[]>([]);

  const [evalDraft, setEvalDraft] = useState<Record<string, number | null>>({});
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");
  const [nuevaObservacion, setNuevaObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const refresh = useCallback(async () => {
    const [segRes, evalRes, objRes, obsRes, histRes] = await Promise.all([
      supabase
        .from("seguimientos")
        .select("*, discipulos:discipulo_id(nombre, apellido), discipuladores:discipulador_id(nombre, apellido)")
        .eq("id", id)
        .single(),
      supabase.from("seguimiento_evaluaciones").select("*").eq("seguimiento_id", id).maybeSingle(),
      supabase.from("seguimiento_objetivos").select("*").eq("seguimiento_id", id).order("created_at", { ascending: true }),
      supabase.from("seguimiento_observaciones").select("*, perfiles:usuario(nombre, apellido)").eq("seguimiento_id", id).order("fecha", { ascending: false }),
      supabase.from("seguimiento_historial").select("*").eq("seguimiento_id", id).order("fecha", { ascending: false }),
    ]);
    setSeguimiento((segRes.data as typeof seguimiento) || null);
    const ev = (evalRes.data as SeguimientoEvaluacion) || null;
    setEvaluacion(ev);
    if (ev) {
      const draft: Record<string, number | null> = {};
      AREAS_EVALUACION.forEach((a) => { draft[a.key] = ev[a.key] ?? null; });
      setEvalDraft(draft);
    } else {
      setEvalDraft({});
    }
    setObjetivos((objRes.data as SeguimientoObjetivo[]) || []);
    setObservaciones((obsRes.data as typeof observaciones) || []);
    setHistorial((histRes.data as SeguimientoHistorial[]) || []);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const registrarHistorial = useCallback(async (tipo: SeguimientoHistorial["tipo"], descripcion: string) => {
    await supabase.from("seguimiento_historial").insert({ seguimiento_id: id, tipo, descripcion });
  }, [id, supabase]);

  const persistirProgreso = useCallback(async (ev: SeguimientoEvaluacion | null, obj: SeguimientoObjetivo[]) => {
    const prog = calcularProgreso(ev, obj);
    const { data, error } = await supabase
      .from("seguimientos")
      .update({ progreso: prog, ultima_actualizacion: new Date().toISOString() })
      .eq("id", id)
      .select("*, discipulos:discipulo_id(nombre, apellido), discipuladores:discipulador_id(nombre, apellido)")
      .single();
    if (!error && data) setSeguimiento(data as typeof seguimiento);
  }, [id, supabase]);

  const guardarEvaluacion = async () => {
    setGuardando(true);
    const payload: Record<string, number | null | string> = { seguimiento_id: id, fecha: new Date().toISOString().split("T")[0] };
    AREAS_EVALUACION.forEach((a) => { payload[a.key] = evalDraft[a.key] ?? null; });

    const { error } = evaluacion
      ? await supabase.from("seguimiento_evaluaciones").update(payload).eq("seguimiento_id", id)
      : await supabase.from("seguimiento_evaluaciones").insert(payload);

    if (error) { toast.error("Error al guardar la evaluación"); setGuardando(false); return; }

    const ev = { ...payload } as unknown as SeguimientoEvaluacion;
    ev.id = evaluacion?.id || "";
    ev.seguimiento_id = id;
    setEvaluacion(ev);
    await registrarHistorial("evaluacion", "Evaluación guardada");
    await persistirProgreso(ev, objetivos);
    toast.success("Evaluación guardada");
    setGuardando(false);
  };

  const cambiarEtapa = async (etapa: number) => {
    if (!seguimiento || etapa === seguimiento.etapa) return;
    const { error } = await supabase.from("seguimientos").update({ etapa }).eq("id", id);
    if (error) { toast.error("Error al actualizar la etapa"); return; }
    setSeguimiento((prev) => prev ? { ...prev, etapa } : prev);
    await registrarHistorial("etapa", `Etapa cambiada a: ${nombreEtapa(etapa)}`);
    await supabase.from("seguimientos").update({ ultima_actualizacion: new Date().toISOString() }).eq("id", id);
    toast.success("Etapa actualizada");
  };

  const agregarObjetivo = async () => {
    const desc = nuevoObjetivo.trim();
    if (!desc) return;
    const { data, error } = await supabase.from("seguimiento_objetivos").insert({ seguimiento_id: id, descripcion: desc }).select().single();
    if (error) { toast.error("Error al agregar el objetivo"); return; }
    const nuevos = [...objetivos, data as SeguimientoObjetivo];
    setObjetivos(nuevos);
    setNuevoObjetivo("");
    await persistirProgreso(evaluacion, nuevos);
    toast.success("Objetivo agregado");
  };

  const toggleObjetivo = async (obj: SeguimientoObjetivo) => {
    const completado = !obj.completado;
    const payload: Partial<SeguimientoObjetivo> = {
      completado,
      fecha_cumplimiento: completado ? new Date().toISOString().split("T")[0] : null,
    };
    const { error } = await supabase.from("seguimiento_objetivos").update(payload).eq("id", obj.id);
    if (error) { toast.error("Error al actualizar el objetivo"); return; }
    const nuevos = objetivos.map((o) => o.id === obj.id ? { ...o, ...payload, fecha_cumplimiento: payload.fecha_cumplimiento ?? null } : o);
    setObjetivos(nuevos);
    if (completado) {
      await registrarHistorial("objetivo", `Objetivo cumplido: ${obj.descripcion}`);
    }
    await persistirProgreso(evaluacion, nuevos);
    toast.success(completado ? "Objetivo cumplido" : "Objetivo pendiente");
  };

  const eliminarObjetivo = async (obj: SeguimientoObjetivo) => {
    const { error } = await supabase.from("seguimiento_objetivos").delete().eq("id", obj.id);
    if (error) { toast.error("Error al eliminar el objetivo"); return; }
    const nuevos = objetivos.filter((o) => o.id !== obj.id);
    setObjetivos(nuevos);
    await persistirProgreso(evaluacion, nuevos);
    toast.success("Objetivo eliminado");
  };

  const guardarObservacion = async () => {
    const comentario = nuevaObservacion.trim();
    if (!comentario) return;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { toast.error("Debés iniciar sesión"); return; }
    const { data, error } = await supabase
      .from("seguimiento_observaciones")
      .insert({ seguimiento_id: id, usuario: authUser.id, comentario })
      .select("*, perfiles:usuario(nombre, apellido)")
      .single();
    if (error) { toast.error("Error al guardar la observación"); return; }
    setObservaciones((prev) => [data as typeof observaciones[number], ...prev]);
    setNuevaObservacion("");
    await registrarHistorial("observacion", "Observación agregada");
    await supabase.from("seguimientos").update({ ultima_actualizacion: new Date().toISOString() }).eq("id", id);
    toast.success("Observación guardada");
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!seguimiento) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-3">
        <p className="text-muted-foreground">Seguimiento no encontrado</p>
        <Link href="/seguimiento"><Button variant="outline" size="sm">Volver al listado</Button></Link>
      </div>
    </div>
  );

  const nombreDiscipulo = seguimiento.discipulos ? `${seguimiento.discipulos.apellido}, ${seguimiento.discipulos.nombre}` : "—";
  const nombreDiscipulador = seguimiento.discipuladores ? `${seguimiento.discipuladores.apellido}, ${seguimiento.discipuladores.nombre}` : "—";

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/seguimiento" className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted size-9 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{nombreDiscipulo}</h1>
          <p className="text-sm text-muted-foreground">Ficha de seguimiento espiritual</p>
        </div>
        <Badge variant={seguimiento.estado === "activo" ? "default" : "secondary"}>
          {seguimiento.estado === "activo" ? "Activo" : "Pausado"}
        </Badge>
      </div>

      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList className="w-full justify-start flex-wrap h-auto">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="evaluacion">Evaluación</TabsTrigger>
          <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
          <TabsTrigger value="observaciones">Observaciones</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><User className="h-4 w-4 text-primary" /></div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Discípulo</p>
                    <p className="text-sm font-medium truncate">{nombreDiscipulo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><UserCheck className="h-4 w-4 text-primary" /></div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Discipulador</p>
                    <p className="text-sm font-medium truncate">{nombreDiscipulador}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><CalendarDays className="h-4 w-4 text-primary" /></div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Fecha de inicio</p>
                    <p className="text-sm font-medium truncate">{format(new Date(seguimiento.fecha_inicio + "T12:00:00"), "dd/MM/yyyy")}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Etapa actual: {nombreEtapa(seguimiento.etapa)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Cambiar etapa</Label>
                    <Select value={String(seguimiento.etapa)} onValueChange={(v) => cambiarEtapa(Number(v))}>
                      <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ETAPAS.map((e) => (
                          <SelectItem key={e.valor} value={String(e.valor)}>{e.valor}. {e.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progreso general</span>
                    <span className="font-medium tabular-nums">{seguimiento.progreso}%</span>
                  </div>
                  <Progress value={seguimiento.progreso} />
                  <p className="text-xs text-muted-foreground mt-2">
                    Calculado automáticamente según la evaluación y los objetivos cumplidos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluacion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evaluación</CardTitle>
              <CardDescription>Evaluá cada área del crecimiento espiritual del discípulo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {AREAS_EVALUACION.map((area) => (
                <div key={area.key} className="rounded-lg border p-3">
                  <p className="text-sm font-medium mb-2">{area.label}</p>
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label={area.label}>
                    {NIVELES_EVALUACION.map((nivel) => {
                      const activo = evalDraft[area.key] === nivel.valor;
                      return (
                        <button
                          key={nivel.valor}
                          type="button"
                          onClick={() => setEvalDraft((prev) => ({ ...prev, [area.key]: nivel.valor }))}
                          aria-pressed={activo}
                          className={cn(
                            "flex-1 min-w-[110px] h-9 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                            activo
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground"
                          )}
                        >
                          {nivel.nombre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <Button onClick={guardarEvaluacion} disabled={guardando}>
                  {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Guardar evaluación
                </Button>
              </div>
              {evaluacion && (
                <p className="text-xs text-muted-foreground">
                  Última evaluación: {format(new Date(evaluacion.fecha + "T12:00:00"), "dd/MM/yyyy")}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objetivos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Objetivos</CardTitle>
              <CardDescription>Objetivos del discipulado. Marcalos al cumplirse.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {objetivos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Todavía no hay objetivos.</p>
              ) : (
                <div className="space-y-2">
                  {objetivos.map((obj) => (
                    <div key={obj.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <Checkbox
                        id={`obj-${obj.id}`}
                        checked={obj.completado}
                        onCheckedChange={() => toggleObjetivo(obj)}
                      />
                      <label
                        htmlFor={`obj-${obj.id}`}
                        className={cn("flex-1 text-sm cursor-pointer", obj.completado && "line-through text-muted-foreground")}
                      >
                        {obj.descripcion}
                        {obj.fecha_cumplimiento && (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                            Cumplido {format(new Date(obj.fecha_cumplimiento + "T12:00:00"), "dd/MM/yyyy")}
                          </span>
                        )}
                      </label>
                      <Button variant="ghost" size="icon" onClick={() => eliminarObjetivo(obj)} title="Eliminar">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {OBJETIVOS_SUGERIDOS.filter((s) => !objetivos.some((o) => o.descripcion === s)).map((sug) => (
                  <Button
                    key={sug}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const { error } = await supabase.from("seguimiento_objetivos").insert({ seguimiento_id: id, descripcion: sug }).select().single();
                      if (error) { toast.error("Error al agregar el objetivo"); return; }
                      const { data } = await supabase.from("seguimiento_objetivos").select("*").eq("seguimiento_id", id);
                      setObjetivos((data as SeguimientoObjetivo[]) || []);
                      await persistirProgreso(evaluacion, (data as SeguimientoObjetivo[]) || []);
                      toast.success("Objetivo agregado");
                    }}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> {sug}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Nuevo objetivo personalizado..."
                  value={nuevoObjetivo}
                  onChange={(e) => setNuevoObjetivo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarObjetivo(); } }}
                />
                <Button onClick={agregarObjetivo}>
                  <Plus className="mr-2 h-4 w-4" /> Agregar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="observaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observaciones</CardTitle>
              <CardDescription>Notas del discipulador. Cada comentario se agrega sin sobrescribir los anteriores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nueva-obs">Nuevo comentario</Label>
                <Textarea
                  id="nueva-obs"
                  rows={3}
                  value={nuevaObservacion}
                  onChange={(e) => setNuevaObservacion(e.target.value)}
                  placeholder="Escribí una observación sobre el crecimiento del discípulo..."
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={guardarObservacion}>
                  <Save className="mr-2 h-4 w-4" /> Guardar comentario
                </Button>
              </div>

              {observaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin observaciones registradas.</p>
              ) : (
                <div className="space-y-3">
                  {observaciones.map((obs) => (
                    <Card key={obs.id}>
                      <CardContent className="py-3">
                        <p className="text-sm whitespace-pre-wrap">{obs.comentario}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">
                            {obs.perfiles ? `${obs.perfiles.apellido}, ${obs.perfiles.nombre}` : "Usuario"}
                          </Badge>
                          <span>{format(new Date(obs.fecha), "dd/MM/yyyy HH:mm")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial</CardTitle>
              <CardDescription>Cambios de etapa, evaluaciones, comentarios y objetivos cumplidos.</CardDescription>
            </CardHeader>
            <CardContent>
              {historial.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aún no hay actividad registrada.</p>
              ) : (
                <ol className="relative space-y-4 border-l border-border pl-4">
                  {historial.map((h) => (
                    <li key={h.id} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{historialLabel[h.tipo]}</Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(h.fecha), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                      <p className="text-sm mt-1">{h.descripcion}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SeguimientoVerInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <p className="text-muted-foreground">Falta el identificador del seguimiento</p>
        <Link href="/seguimiento"><Button variant="outline" size="sm">Volver al listado</Button></Link>
      </div>
    );
  }
  return <SeguimientoDetalle id={id} />;
}

export default function SeguimientoVerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SeguimientoVerInner />
    </Suspense>
  );
}