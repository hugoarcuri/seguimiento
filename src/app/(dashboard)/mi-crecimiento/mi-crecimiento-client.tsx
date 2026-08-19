"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useMiembroActual } from "@/hooks/useDiscipuloActual";
import { useEtapas } from "@/hooks/useEtapas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, BookOpen, CheckCircle2, Clock, CalendarDays,
  Hand, ChevronDown, ChevronRight, Download, Eye, Flame,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getEstudiosPorEtapa } from "@/lib/constants/estudios-biblicos";
import { BASE_PATH } from "@/lib/constants/paths";
import { calcularSalud, contarEncuentrosMes, SALUD_CONFIG } from "@/lib/discipulo-health";
import { calcularProgreso } from "../seguimiento/seguimiento-constants";
import type {
  Seguimiento, SeguimientoObjetivo, SeguimientoObservacion,
  Agenda, Oracion, Tarea,
} from "@/types/database";

type Encuentro = Agenda;

export function MiCrecimientoClient() {
  const { miembro: discipulo, loading: loadingDiscipulo } = useMiembroActual();
  const { etapas } = useEtapas();

  const [seguimiento, setSeguimiento] = useState<Seguimiento | null>(null);
  const [objetivos, setObjetivos] = useState<SeguimientoObjetivo[]>([]);
  const [observaciones, setObservaciones] = useState<SeguimientoObservacion[]>([]);
  const [encuentros, setEncuentros] = useState<Encuentro[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [oraciones, setOraciones] = useState<Oracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [pasoAbierto, setPasoAbierto] = useState<number | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!discipulo) return;
    let cancelado = false;
    (async () => {
      const [segRes, encRes, tarRes, oraRes] = await Promise.all([
        supabase.from("seguimientos").select("*").eq("miembro_id", discipulo.id).order("created_at", { ascending: false }),
        supabase.from("agenda").select("*").eq("miembro_id", discipulo.id).order("fecha", { ascending: false }).limit(10),
        supabase.from("tareas").select("*").eq("miembro_id", discipulo.id).order("created_at", { ascending: false }),
        supabase.from("oraciones").select("*").eq("miembro_id", discipulo.id).order("fecha", { ascending: false }),
      ]);
      if (cancelado) return;
      const segs = (segRes.data || []) as Seguimiento[];
      const seg = segs.find((s) => s.estado === "activo") || segs[0] || null;
      setSeguimiento(seg);
      setEncuentros((encRes.data || []) as Encuentro[]);
      setTareas((tarRes.data || []) as Tarea[]);
      setOraciones((oraRes.data || []) as Oracion[]);

      if (seg) {
        const [objRes, obsRes] = await Promise.all([
          supabase.from("seguimiento_objetivos").select("*").eq("seguimiento_id", seg.id).order("created_at", { ascending: true }),
          supabase.from("seguimiento_observaciones").select("*").eq("seguimiento_id", seg.id).order("fecha", { ascending: false }),
        ]);
        if (cancelado) return;
        setObjetivos((objRes.data || []) as SeguimientoObjetivo[]);
        setObservaciones((obsRes.data || []) as SeguimientoObservacion[]);
      }
      if (!cancelado) setLoading(false);
    })();
    return () => { cancelado = true; };
  }, [discipulo, supabase]);

  const toggleObjetivo = async (obj: SeguimientoObjetivo) => {
    const nuevo = !obj.completado;
    const { error } = await supabase
      .from("seguimiento_objetivos")
      .update({ completado: nuevo, fecha_cumplimiento: nuevo ? new Date().toISOString() : null })
      .eq("id", obj.id);
    if (error) return;
    setObjetivos((prev) =>
      prev.map((o) => o.id === obj.id ? { ...o, completado: nuevo, fecha_cumplimiento: nuevo ? new Date().toISOString() : null } : o)
    );
    if (seguimiento) {
      const nuevos = objetivos.map((o) => o.id === obj.id ? { ...o, completado: nuevo } : o);
      const progreso = calcularProgreso(nuevos);
      await supabase.from("seguimientos").update({ progreso }).eq("id", seguimiento.id);
      setSeguimiento((prev) => prev ? { ...prev, progreso } : prev);
    }
  };

  if (loadingDiscipulo) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!discipulo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">No se encontró tu perfil de miembro</p>
        <Link href="/configuracion"><Button variant="outline">Ir a Configuración</Button></Link>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const etapaActual = etapas.find((e) => e.id === discipulo.etapa_id);
  const etapaIdx = etapas.findIndex((e) => e.id === discipulo.etapa_id);
  const progresoSeguimiento = seguimiento?.progreso ?? 0;

  const salud = calcularSalud({
    encuentrosMes: contarEncuentrosMes(encuentros.map((e) => ({ fecha: e.fecha, realizada: e.realizada }))),
    etapa: discipulo.etapa_id,
    bautizado: discipulo.bautizado ?? false,
    es_miembro: discipulo.es_miembro ?? false,
    objetivosPendientes: objetivos.filter((o) => !o.completado).length,
    oracionesPendientes: oraciones.filter((o) => o.estado !== "respondida").length,
  });
  const saludCfg = SALUD_CONFIG[salud.salud];

  const tareasCompletadas = tareas.filter((t) => t.estado === "completada");
  const encuentrosMes = encuentros.filter((e) => {
    if (e.realizada !== true) return false;
    const hoy = new Date();
    const inicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
    const fecha = e.fecha.length === 10 ? e.fecha : e.fecha.split("T")[0];
    return fecha >= inicioMes;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {discipulo.avatar_url ? (
          <Image src={discipulo.avatar_url} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {(discipulo.nombre?.[0] || "").toUpperCase()}{(discipulo.apellido?.[0] || "").toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{discipulo.nombre} {discipulo.apellido}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="outline">{etapaActual?.nombre || `Etapa ${discipulo.etapa_id}`}</Badge>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", saludCfg.badge)}>
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              {saludCfg.etiqueta}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6 @container">
        <div className="grid gap-6 @lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Progreso del Crecimiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Etapa {discipulo.etapa_id} de {etapas.length}</span>
                  <span>{progresoSeguimiento}%</span>
                </div>
                <Progress value={progresoSeguimiento} className="h-2" />
              </div>
              <div className="flex items-center gap-1">
                {etapas.map((e, i) => (
                  <span key={e.id} className={cn("h-2.5 flex-1 rounded-sm", i <= etapaIdx ? "bg-primary" : "bg-muted")} />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-lg font-bold">{encuentrosMes.length}</p>
                  <p className="text-[11px] text-muted-foreground">Encuentros mes</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-lg font-bold">{objetivos.filter((o) => o.completado).length}/{objetivos.length}</p>
                  <p className="text-[11px] text-muted-foreground">Objetivos</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-lg font-bold">{tareasCompletadas.length}/{tareas.length}</p>
                  <p className="text-[11px] text-muted-foreground">Tareas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Estudios Bíblicos — Nuevo creyente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {getEstudiosPorEtapa(2).map((paso) => {
                const abierto = pasoAbierto === paso.numero;
                const pdfUrl = `${BASE_PATH}/estudios-biblicos/nivel-1/${paso.archivo}`;
                return (
                  <div key={paso.numero} className="rounded-lg border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPasoAbierto(abierto ? null : paso.numero)}
                      className="flex w-full items-center gap-2.5 p-3 text-left hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {paso.numero}
                      </div>
                      <span className="flex-1 text-sm font-medium truncate">{paso.titulo}</span>
                      {abierto ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    </button>
                    {abierto && (
                      <div className="px-3 pb-3 space-y-2">
                        <p className="text-xs text-muted-foreground">{paso.descripcion}</p>
                        <div className="flex gap-2">
                          <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors">
                            <Eye className="h-3 w-3" /> Ver
                          </a>
                          <a href={pdfUrl} download
                            className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors">
                            <Download className="h-3 w-3" /> Descargar
                          </a>
                        </div>
                        <iframe src={pdfUrl} className="w-full h-[400px] rounded-lg border" title={`Paso ${paso.numero}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 @lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Mis Objetivos</CardTitle>
            </CardHeader>
            <CardContent>
              {objetivos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No hay objetivos registrados</p>
              ) : (
                <div className="space-y-2">
                  {objetivos.map((obj) => (
                    <label key={obj.id} className={cn("flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer hover:bg-accent/30 transition-colors", obj.completado && "bg-muted/30")}>
                      <Checkbox checked={obj.completado} onCheckedChange={() => toggleObjetivo(obj)} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm", obj.completado && "line-through text-muted-foreground")}>{obj.descripcion}</p>
                        {obj.fecha_cumplimiento && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Completado {format(new Date(obj.fecha_cumplimiento), "dd/MM/yyyy")}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" /> Mis Tareas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tareas.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No hay tareas asignadas</p>
              ) : (
                <div className="space-y-2">
                  {tareas.map((tarea) => (
                    <div key={tarea.id} className={cn("flex items-start gap-2.5 rounded-lg border p-2.5", tarea.estado === "completada" && "bg-muted/30")}>
                      <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0", tarea.estado === "completada" ? "text-emerald-500" : tarea.estado === "vencida" ? "text-red-500" : "text-muted-foreground")} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm", tarea.estado === "completada" && "line-through text-muted-foreground")}>{tarea.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{tarea.tipo}</Badge>
                          {tarea.fecha_limite && (
                            <span className="text-[11px] text-muted-foreground">
                              Límite: {format(new Date(tarea.fecha_limite), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 @lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Mis Encuentros
              </CardTitle>
            </CardHeader>
            <CardContent>
              {encuentros.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No hay encuentros registrados</p>
              ) : (
                <div className="space-y-2">
                  {encuentros.slice(0, 8).map((enc) => (
                    <div key={enc.id} className="flex items-start gap-2.5 rounded-lg border p-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {format(new Date(enc.fecha.length === 10 ? `${enc.fecha}T00:00:00` : enc.fecha), "dd")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{enc.tema_tratado || "Encuentro"}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(enc.fecha.length === 10 ? `${enc.fecha}T00:00:00` : enc.fecha), "dd/MM/yyyy")}
                          {enc.lugar ? ` · ${enc.lugar}` : ""}
                        </p>
                      </div>
                      {enc.realizada ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Hand className="h-4 w-4" /> Mis Pedidos de Oración
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oraciones.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No hay pedidos de oración</p>
              ) : (
                <div className="space-y-2">
                  {oraciones.slice(0, 8).map((ora) => (
                    <div key={ora.id} className="rounded-lg border p-2.5">
                      <p className="text-sm">{ora.pedido}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={ora.estado === "respondida" ? "default" : ora.estado === "en_oracion" ? "secondary" : "outline"} className="text-[10px]">
                          {ora.estado === "respondida" ? "Respondida" : ora.estado === "en_oracion" ? "En oración" : "Pendiente"}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {format(new Date(ora.fecha.length === 10 ? `${ora.fecha}T00:00:00` : ora.fecha), "dd/MM/yyyy")}
                        </span>
                      </div>
                      {ora.respuesta && (
                        <p className="text-xs text-muted-foreground mt-1 italic">&ldquo;{ora.respuesta}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {observaciones.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Notas de mi Discipulador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {observaciones.map((obs) => (
                  <div key={obs.id} className="rounded-lg border p-2.5">
                    <p className="text-sm">{obs.comentario}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {format(new Date(obs.fecha.length === 10 ? `${obs.fecha}T00:00:00` : obs.fecha), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {salud.alertas.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Flame className="h-4 w-4" /> Señales a atender
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {salud.alertas.map((alerta, i) => (
                  <div key={i} className={cn("flex items-center gap-2 rounded-lg border-l-4 p-2.5 bg-muted/30", saludCfg.border)}>
                    <span className="text-sm">{alerta.mensaje}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
