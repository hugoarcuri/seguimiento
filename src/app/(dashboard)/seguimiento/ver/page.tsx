"use client";

import { Fragment, useCallback, Suspense, useEffect, useMemo, useRef, useState } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Loader2, Save, Plus, Trash2, User, CalendarDays, UserCheck, TrendingUp,
  Phone, Mail, MapPin, Church, Pencil, CalendarPlus, Check, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { calcularEdad, estadoColors } from "@/lib/utils";
import { estadoEncuentrosMes, contarEncuentrosMes, SALUD_CONFIG } from "@/lib/discipulo-health";
import {
  CAMPOS_EVALUACION, codificarCampoEvaluacion, decodificarCampoEvaluacion,
  OBJETIVOS_SUGERIDOS, calcularProgreso,
} from "../seguimiento-constants";
import type {
  Seguimiento, SeguimientoEvaluacion, SeguimientoObjetivo, SeguimientoObservacion, SeguimientoHistorial,
  Discipulo, Etapa, Agenda,
} from "@/types/database";

type EvalDraft = Record<string, { opcion: string; detalle: string }>;

const draftVacio = (): EvalDraft => {
  const d: EvalDraft = {};
  CAMPOS_EVALUACION.forEach((c) => { d[c.key] = { opcion: "", detalle: "" }; });
  return d;
};

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
    discipulos?: Discipulo;
    discipuladores?: { nombre: string; apellido: string };
  }) | null>(null);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [evaluacion, setEvaluacion] = useState<SeguimientoEvaluacion | null>(null);
  const [objetivos, setObjetivos] = useState<SeguimientoObjetivo[]>([]);
  const [observaciones, setObservaciones] = useState<(SeguimientoObservacion & { perfiles?: { nombre: string; apellido: string } })[]>([]);
  const [historial, setHistorial] = useState<SeguimientoHistorial[]>([]);

  const [evalDraft, setEvalDraft] = useState<EvalDraft>({});
  const [habitosDraft, setHabitosDraft] = useState<string[]>([]);
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");
  const [nuevaObservacion, setNuevaObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [encuentroOpen, setEncuentroOpen] = useState(false);
  const [encuentroEditing, setEncuentroEditing] = useState<Agenda | null>(null);
  const [encuentroDelete, setEncuentroDelete] = useState<Agenda | null>(null);
  const [encuentroDraft, setEncuentroDraft] = useState({ fecha: "", notas: "", proximo_encuentro: "" });
  const [guardandoEncuentro, setGuardandoEncuentro] = useState(false);

  const searchParams = useSearchParams();
  const abrioEncuentro = useRef(false);
  const [tab, setTab] = useState("resumen");

  const refresh = useCallback(async () => {
    const [segRes, evalRes, objRes, obsRes, histRes, etapasRes] = await Promise.all([
      supabase
        .from("seguimientos")
        .select("*, discipulos:discipulo_id(*), discipuladores:discipulador_id(nombre, apellido)")
        .eq("id", id)
        .single(),
      supabase.from("seguimiento_evaluaciones").select("*").eq("seguimiento_id", id).maybeSingle(),
      supabase.from("seguimiento_objetivos").select("*").eq("seguimiento_id", id).order("created_at", { ascending: true }),
      supabase.from("seguimiento_observaciones").select("*, perfiles:usuario(nombre, apellido)").eq("seguimiento_id", id).order("fecha", { ascending: false }),
      supabase.from("seguimiento_historial").select("*").eq("seguimiento_id", id).order("fecha", { ascending: false }),
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
    ]);
    setSeguimiento((segRes.data as typeof seguimiento) || null);
    setEtapas((etapasRes.data as Etapa[]) || []);
    const seg = segRes.data as typeof seguimiento;
    if (seg?.discipulos?.id) {
      const { data: agendaData } = await supabase.from("agenda").select("*").eq("discipulo_id", seg.discipulos.id).order("fecha", { ascending: false });
      setAgendas((agendaData as Agenda[]) || []);
    } else {
      setAgendas([]);
    }
    const ev = (evalRes.data as SeguimientoEvaluacion) || null;
    setEvaluacion(ev);
    if (ev) {
      const draft = draftVacio();
      CAMPOS_EVALUACION.forEach((c) => { draft[c.key] = decodificarCampoEvaluacion(c, ev[c.key as keyof SeguimientoEvaluacion] ?? ""); });
      setEvalDraft(draft);
    } else {
      setEvalDraft(draftVacio());
    }
    setObjetivos((objRes.data as SeguimientoObjetivo[]) || []);
    const objetivosData = (objRes.data as SeguimientoObjetivo[]) || [];
    const habitoRows = objetivosData.filter((o) => o.es_habito);
    if (habitoRows.length) {
      setHabitosDraft(habitoRows.map((h) => h.descripcion));
    } else {
      const txt = ev?.habitos_pecaminosos;
      setHabitosDraft(txt ? txt.split("\n").map((s) => s.trim()).filter(Boolean) : []);
    }
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

  useEffect(() => {
    if (!abrioEncuentro.current && searchParams.get("encuentro") === "1") {
      abrioEncuentro.current = true;
      setEncuentroOpen(true);
    }
  }, [searchParams]);

  const registrarHistorial = useCallback(async (tipo: SeguimientoHistorial["tipo"], descripcion: string) => {
    await supabase.from("seguimiento_historial").insert({ seguimiento_id: id, tipo, descripcion });
  }, [id, supabase]);

  const persistirProgreso = useCallback(async (obj: SeguimientoObjetivo[]) => {
    const prog = calcularProgreso(obj);
    const { data, error } = await supabase
      .from("seguimientos")
      .update({ progreso: prog, ultima_actualizacion: new Date().toISOString() })
      .eq("id", id)
      .select("*, discipulos:discipulo_id(*), discipuladores:discipulador_id(nombre, apellido)")
      .single();
    if (!error && data) setSeguimiento(data as typeof seguimiento);
  }, [id, supabase]);

  const guardarEvaluacion = async () => {
    setGuardando(true);
    const habitosLimpios = habitosDraft.map((h) => h.trim()).filter(Boolean);
    const payload: Record<string, string | null> = { seguimiento_id: id, fecha: new Date().toISOString().split("T")[0] };
    CAMPOS_EVALUACION.forEach((c) => {
      if (c.key === "habitos_pecaminosos") return;
      const v = codificarCampoEvaluacion(c, evalDraft[c.key]?.opcion ?? "", evalDraft[c.key]?.detalle ?? "");
      payload[c.key] = v || null;
    });
    payload.habitos_pecaminosos = habitosLimpios.join("\n") || null;

    const { error } = evaluacion
      ? await supabase.from("seguimiento_evaluaciones").update(payload).eq("seguimiento_id", id)
      : await supabase.from("seguimiento_evaluaciones").insert(payload);

    if (error) { toast.error("Error al guardar la evaluación"); setGuardando(false); return; }

    const ev = { ...payload } as unknown as SeguimientoEvaluacion;
    ev.id = evaluacion?.id || "";
    ev.seguimiento_id = id;
    setEvaluacion(ev);

    const habitoRows = objetivos.filter((o) => o.es_habito);
    for (const row of habitoRows) {
      if (!habitosLimpios.includes(row.descripcion)) {
        await supabase.from("seguimiento_objetivos").delete().eq("id", row.id);
      }
    }
    for (const h of habitosLimpios) {
      if (habitoRows.some((r) => r.descripcion === h)) continue;
      const { error: insErr } = await supabase.from("seguimiento_objetivos").insert({ seguimiento_id: id, descripcion: h, es_habito: true });
      if (insErr) { toast.error("Error al sincronizar los hábitos con los objetivos"); setGuardando(false); return; }
    }
    const { data: objNuevos } = await supabase.from("seguimiento_objetivos").select("*").eq("seguimiento_id", id).order("created_at", { ascending: true });
    const lista = (objNuevos as SeguimientoObjetivo[]) || [];
    setObjetivos(lista);
    await registrarHistorial("evaluacion", "Evaluación guardada");
    await persistirProgreso(lista);
    toast.success("Evaluación guardada");
    setGuardando(false);
  };

  const cambiarEtapa = async (etapa: number) => {
    if (!seguimiento || etapa === seguimiento.etapa) return;
    const { error } = await supabase.from("seguimientos").update({ etapa }).eq("id", id);
    if (error) { toast.error("Error al actualizar la etapa"); return; }
    setSeguimiento((prev) => prev ? { ...prev, etapa } : prev);
    await registrarHistorial("etapa", `Etapa cambiada a: ${etapas.find((e) => e.id === etapa)?.nombre || `Etapa ${etapa}`}`);
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
    await persistirProgreso(nuevos);
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
    await persistirProgreso(nuevos);
    toast.success(completado ? "Objetivo cumplido" : "Objetivo pendiente");
  };

  const eliminarObjetivo = async (obj: SeguimientoObjetivo) => {
    const { error } = await supabase.from("seguimiento_objetivos").delete().eq("id", obj.id);
    if (error) { toast.error("Error al eliminar el objetivo"); return; }
    const nuevos = objetivos.filter((o) => o.id !== obj.id);
    setObjetivos(nuevos);
    await persistirProgreso(nuevos);
    toast.success("Objetivo eliminado");
  };

  const objetivosOrdenados = useMemo(
    () => [...objetivos].sort(
      (a, b) =>
        Number(b.es_habito ?? false) - Number(a.es_habito ?? false) ||
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
    [objetivos]
  );

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

  const abrirEncuentro = (agenda?: Agenda) => {
    setEncuentroEditing(agenda || null);
    setEncuentroDraft({
      fecha: agenda?.fecha?.split("T")[0] || "",
      notas: agenda?.notas || "",
      proximo_encuentro: agenda?.proximo_encuentro?.slice(0, 16) || "",
    });
    setEncuentroOpen(true);
  };

  const guardarEncuentro = async () => {
    const discipuloId = seguimiento?.discipulos?.id;
    if (!discipuloId) { toast.error("No se encontró el discípulo"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Debés iniciar sesión"); return; }
    if (!encuentroDraft.fecha) { toast.error("Completá la fecha"); return; }

    setGuardandoEncuentro(true);
    const payload = {
      discipulo_id: discipuloId,
      lider_id: user.id,
      fecha: encuentroDraft.fecha,
      tema_tratado: "",
      realizada: encuentroEditing ? (encuentroEditing.realizada ?? false) : false,
      notas: encuentroDraft.notas || null,
      proximo_encuentro: encuentroDraft.proximo_encuentro || null,
    };
    const { error, data } = encuentroEditing
      ? await supabase.from("agenda").update(payload).eq("id", encuentroEditing.id).select().single()
      : await supabase.from("agenda").insert(payload).select().single();

    if (error) { toast.error("Error al guardar el encuentro"); setGuardandoEncuentro(false); return; }
    setAgendas((prev) => encuentroEditing
      ? prev.map((e) => e.id === encuentroEditing.id ? (data as Agenda) : e)
      : [data as Agenda, ...prev]);
    setEncuentroOpen(false);
    setEncuentroEditing(null);
    setGuardandoEncuentro(false);
    toast.success(encuentroEditing ? "Encuentro actualizado" : "Encuentro registrado");
  };

  const eliminarEncuentro = async () => {
    if (!encuentroDelete) return;
    const { error } = await supabase.from("agenda").delete().eq("id", encuentroDelete.id);
    if (error) { toast.error("Error al eliminar el encuentro"); setEncuentroDelete(null); return; }
    setAgendas((prev) => prev.filter((e) => e.id !== encuentroDelete.id));
    setEncuentroDelete(null);
    toast.success("Encuentro eliminado");
  };

  const toggleEncuentroRealizado = async (agenda: Agenda) => {
    const nueva = !agenda.realizada;
    const { error, data } = await supabase.from("agenda").update({ realizada: nueva }).eq("id", agenda.id).select().single();
    if (error) { toast.error("Error al actualizar el encuentro"); return; }
    setAgendas((prev) => prev.map((e) => e.id === agenda.id ? (data as Agenda) : e));
    toast.success(nueva ? "Encuentro marcado como realizado" : "Encuentro marcado como pendiente");
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
  const encuentrosMes = contarEncuentrosMes(agendas.map((a) => ({ fecha: a.fecha, realizada: a.realizada })));
  const estadoSeguimiento = estadoEncuentrosMes(encuentrosMes);
  const estadoSeguimientoCfg = SALUD_CONFIG[estadoSeguimiento];
  const objetivosPendientes = objetivos.filter((o) => !o.completado);

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/seguimiento" className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted size-9 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold truncate">{nombreDiscipulo}</h1>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0", estadoSeguimientoCfg.badge)}>
              <span className={cn("h-1.5 w-1.5 rounded-full bg-white/80")} />
              {estadoSeguimientoCfg.etiqueta}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Ficha de seguimiento espiritual</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="w-full justify-start flex-wrap h-auto">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="evaluacion">Evaluación</TabsTrigger>
          <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
          <TabsTrigger value="encuentros">Encuentros</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          {seguimiento.etapa >= 2 && seguimiento.discipulos && (!seguimiento.discipulos.bautizado || !seguimiento.discipulos.es_miembro) && (
            <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Pasos pendientes del discipulado</p>
              </div>
              <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
                {!seguimiento.discipulos.bautizado && (
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    Pendiente: bautizarse
                  </li>
                )}
                {!seguimiento.discipulos.es_miembro && (
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    Pendiente: clase de membresía
                  </li>
                )}
              </ul>
              <Link href={`/discipulos/editar?id=${seguimiento.discipulos.id}`}>
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Completar bautismo / membresía
                </Button>
              </Link>
            </div>
          )}
          {seguimiento.discipulos && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ficha personal del discípulo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {seguimiento.discipulos.avatar_url ? (
                    <img src={seguimiento.discipulos.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover ring-4 ring-background shadow" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl ring-4 ring-background shadow">
                      {seguimiento.discipulos.nombre?.charAt(0)?.toUpperCase()}{seguimiento.discipulos.apellido?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-lg font-bold truncate">{nombreDiscipulo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{etapas.find((e) => e.id === seguimiento.discipulos?.etapa_id)?.nombre || "Sin etapa"}</Badge>
                      <span className={`h-3 w-3 rounded-full ${estadoColors[seguimiento.discipulos.estado]}`} />
                      <span className="text-sm capitalize text-muted-foreground">{seguimiento.discipulos.estado}</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><CalendarDays className="h-4 w-4 text-primary" /></div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Edad</p>
                      <p className="text-sm font-medium truncate">{seguimiento.discipulos.fecha_nacimiento ? `${calcularEdad(seguimiento.discipulos.fecha_nacimiento)} años` : "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><User className="h-4 w-4 text-primary" /></div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Sexo</p>
                      <p className="text-sm font-medium truncate">{seguimiento.discipulos.sexo === "M" ? "Masculino" : seguimiento.discipulos.sexo === "F" ? "Femenino" : "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Phone className="h-4 w-4 text-primary" /></div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      <p className="text-sm font-medium truncate">{seguimiento.discipulos.telefono || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Mail className="h-4 w-4 text-primary" /></div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium truncate">{seguimiento.discipulos.email || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><MapPin className="h-4 w-4 text-primary" /></div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Dirección</p>
                      <p className="text-sm font-medium truncate">{seguimiento.discipulos.direccion || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Church className="h-4 w-4 text-primary" /></div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Ministerio</p>
                      <p className="text-sm font-medium truncate">{seguimiento.discipulos.ministerio || "—"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen de seguimiento</CardTitle>
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
                    <p className="text-sm font-medium">Etapa actual: {etapas.find((e) => e.id === seguimiento.etapa)?.nombre || `Etapa ${seguimiento.etapa}`}</p>
                  </div>
                  <div className="w-full flex flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <Label className="text-xs text-muted-foreground">Cambiar etapa</Label>
                    <Select value={String(seguimiento.etapa)} onValueChange={(v) => cambiarEtapa(Number(v))} items={etapas.map((e) => ({ value: String(e.id), label: e.nombre }))}>
                      <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {etapas.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(() => {
                  const idx = etapas.findIndex((e) => e.id === seguimiento.etapa);
                  const actualIdx = idx === -1 ? 0 : idx;
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progreso por etapas (1 a {etapas.length})</span>
                        <span className="text-sm font-medium tabular-nums">Etapa {actualIdx + 1}/{etapas.length}</span>
                      </div>
                      <div className="flex items-start overflow-x-auto">
                        {etapas.map((e, i) => {
                          const completada = i < actualIdx;
                          const actual = i === actualIdx;
                          return (
                            <Fragment key={e.id}>
                              {i > 0 && (
                                <div className={cn("mt-[15px] h-0.5 flex-1", i <= actualIdx ? "bg-primary" : "bg-muted")} />
                              )}
                              <div className="flex w-16 shrink-0 flex-col items-center gap-1.5">
                                <div className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold",
                                  actual && "bg-primary text-primary-foreground border-primary",
                                  completada && "bg-primary/15 text-primary border-primary",
                                  !actual && !completada && "bg-muted text-muted-foreground border-foreground/15",
                                )}>
                                  {completada ? <Check className="h-4 w-4" /> : i + 1}
                                </div>
                                <span className="line-clamp-2 text-center text-[10px] leading-tight text-muted-foreground">
                                  {e.nombre.replace(/^\d+\.\s*/, "")}
                                </span>
                              </div>
                            </Fragment>
                          );
                        })}
                      </div>
                      <Progress value={((actualIdx + 1) / etapas.length) * 100} className="mt-3" />
                    </div>
                  );
                })()}

                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progreso general</span>
                    <span className="font-medium tabular-nums">{seguimiento.progreso}%</span>
                  </div>
                  <Progress value={seguimiento.progreso} />
                  <p className="text-xs text-muted-foreground mt-2">
                    Calculado automáticamente según los objetivos cumplidos.
                  </p>
                </div>

                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">Estado del seguimiento</p>
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", estadoSeguimientoCfg.badge)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full bg-white/80")} />
                      {estadoSeguimientoCfg.etiqueta}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {encuentrosMes} encuentro(s) este mes. Con 2 encuentros por mes el seguimiento está al día.
                  </p>
                </div>

                {objetivosPendientes.length > 0 && (
                  <div className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Objetivos pendientes ({objetivosPendientes.length})</p>
                      <button type="button" onClick={() => setTab("objetivos")} className="text-xs font-medium text-primary hover:underline">Ir a objetivos</button>
                    </div>
                    <ul className="space-y-1">
                      {objetivosPendientes.slice(0, 5).map((o) => (
                        <li key={o.id} className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span className="min-w-0 break-words">{o.descripcion}</span>
                        </li>
                      ))}
                      {objetivosPendientes.length > 5 && (
                        <li className="text-xs text-muted-foreground">+{objetivosPendientes.length - 5} más</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluacion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evaluación</CardTitle>
              <CardDescription>Completá los datos del crecimiento espiritual del discípulo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {CAMPOS_EVALUACION.map((campo) => {
                const draft = evalDraft[campo.key] || { opcion: "", detalle: "" };
                const esTextoLibre = !campo.opciones;
                const mostrarDetalle = !!campo.detalleSi && draft.opcion === campo.detalleSi;
                if (campo.key === "habitos_pecaminosos") {
                  return (
                    <div key={campo.key} className="space-y-2">
                      <Label>{campo.label}</Label>
                      {habitosDraft.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sin hábitos cargados. Agregá los que quieras trabajar.</p>
                      ) : (
                        <div className="space-y-2">
                          {habitosDraft.map((h, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Input
                                value={h}
                                placeholder={`Hábito ${i + 1}`}
                                onChange={(e) => setHabitosDraft((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                              />
                              <Button type="button" variant="ghost" size="icon" title="Quitar hábito" onClick={() => setHabitosDraft((prev) => prev.filter((_, j) => j !== i))}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button type="button" variant="outline" size="sm" onClick={() => setHabitosDraft((prev) => [...prev, ""])}>
                        <Plus className="mr-1 h-4 w-4" /> Agregar hábito
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Cada hábito aparece en la pestaña &quot;Objetivos&quot; para marcarlo como cumplido.
                      </p>
                    </div>
                  );
                }
                return (
                  <div key={campo.key} className="space-y-2">
                    <Label htmlFor={`eval-${campo.key}`}>{campo.label}</Label>
                    {esTextoLibre ? (
                      <Input
                        id={`eval-${campo.key}`}
                        placeholder={campo.placeholder}
                        value={draft.detalle}
                        onChange={(e) => setEvalDraft((prev) => ({ ...prev, [campo.key]: { ...prev[campo.key], detalle: e.target.value } }))}
                      />
                    ) : campo.detalleSi ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Select
                          value={draft.opcion}
                          onValueChange={(v) => setEvalDraft((prev) => ({ ...prev, [campo.key]: { ...prev[campo.key], opcion: v ?? "" } }))}
                        >
                          <SelectTrigger id={`eval-${campo.key}`} className="w-full sm:w-56">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {campo.opciones!.map((op) => (
                              <SelectItem key={op} value={op}>{op}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {mostrarDetalle && (
                          <Input
                            value={draft.detalle}
                            placeholder={campo.detallePlaceholder}
                            onChange={(e) => setEvalDraft((prev) => ({ ...prev, [campo.key]: { ...prev[campo.key], detalle: e.target.value } }))}
                          />
                        )}
                      </div>
                    ) : (
                      <Select
                        value={draft.opcion}
                        onValueChange={(v) => setEvalDraft((prev) => ({ ...prev, [campo.key]: { ...prev[campo.key], opcion: v ?? "" } }))}
                      >
                        <SelectTrigger id={`eval-${campo.key}`} className="w-full">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {campo.opciones!.map((op) => (
                            <SelectItem key={op} value={op}>{op}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })}
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
                        <p className="text-sm whitespace-pre-wrap break-words">{obs.comentario}</p>
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

        <TabsContent value="objetivos" className="space-y-4">
          <Card id="objetivos">
            <CardHeader>
              <CardTitle className="text-base">Objetivos</CardTitle>
              <CardDescription>Objetivos del discipulado. Marcalos al cumplirse.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {objetivos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Todavía no hay objetivos. Agregá hábitos en la pestaña &quot;Evaluación&quot; o creá objetivos acá.
                </p>
              ) : (
                <div className="space-y-2">
                  {objetivosOrdenados.map((obj) => (
                    <div key={obj.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <input
                        type="checkbox"
                        id={`obj-${obj.id}`}
                        checked={obj.completado}
                        onChange={() => toggleObjetivo(obj)}
                        className="size-4 shrink-0 cursor-pointer accent-primary"
                      />
                      <label
                        htmlFor={`obj-${obj.id}`}
                        className={cn("flex-1 min-w-0 text-sm cursor-pointer", obj.completado && "line-through text-muted-foreground")}
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          {obj.es_habito && <Badge variant="secondary">Hábito</Badge>}
                          <span className="break-words">{obj.descripcion}</span>
                        </span>
                        {obj.fecha_cumplimiento && (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                            Cumplido {format(new Date(obj.fecha_cumplimiento + "T12:00:00"), "dd/MM/yyyy")}
                          </span>
                        )}
                      </label>
                      {!obj.es_habito && (
                        <Button variant="ghost" size="icon" onClick={() => eliminarObjetivo(obj)} title="Eliminar">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
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
                      await persistirProgreso((data as SeguimientoObjetivo[]) || []);
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

        <TabsContent value="encuentros" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Encuentros</CardTitle>
                  <CardDescription>Citas de discipulado del discípulo. {agendas.length} registros.</CardDescription>
                </div>
                <Button size="sm" onClick={() => abrirEncuentro()}>
                  <CalendarPlus className="mr-1 h-4 w-4" /> Nuevo encuentro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {agendas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No hay encuentros registrados para este discípulo.</p>
              ) : (
                <div className="space-y-3">
                  {agendas.map((agenda) => (
                    <Card key={agenda.id}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium">{format(new Date(agenda.fecha), "dd/MM/yyyy")}</p>
                              {agenda.realizada ? (
                                <Badge className="gap-1 bg-emerald-500 text-white"><Check className="h-3 w-3" /> Realizada</Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" /> Pendiente</Badge>
                              )}
                            </div>
                            {agenda.notas && (
                              <p className="text-xs text-muted-foreground break-words">Notas: {agenda.notas}</p>
                            )}
                            {agenda.proximo_encuentro && (
                              <p className="text-xs text-muted-foreground">
                                Próximo: {format(new Date(agenda.proximo_encuentro), "dd/MM/yyyy HH:mm")}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            {!agenda.realizada && (
                              <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => toggleEncuentroRealizado(agenda)}>
                                <Check className="h-3.5 w-3.5" /> Marcar realizada
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" title="Editar" onClick={() => abrirEncuentro(agenda)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Eliminar" onClick={() => setEncuentroDelete(agenda)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
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

      <Dialog open={encuentroOpen} onOpenChange={(v) => { setEncuentroOpen(v); if (!v) setEncuentroEditing(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{encuentroEditing ? "Editar encuentro" : "Registrar encuentro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="enc-fecha">Fecha *</Label>
              <Input id="enc-fecha" type="date" value={encuentroDraft.fecha} onChange={(e) => setEncuentroDraft((p) => ({ ...p, fecha: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enc-notas">Notas</Label>
              <Textarea id="enc-notas" rows={2} value={encuentroDraft.notas} onChange={(e) => setEncuentroDraft((p) => ({ ...p, notas: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enc-proximo">Próximo encuentro</Label>
              <Input id="enc-proximo" type="datetime-local" value={encuentroDraft.proximo_encuentro} onChange={(e) => setEncuentroDraft((p) => ({ ...p, proximo_encuentro: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={guardarEncuentro} disabled={guardandoEncuentro}>
              {guardandoEncuentro && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {encuentroEditing ? "Guardar cambios" : "Registrar encuentro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={encuentroDelete !== null} onOpenChange={() => setEncuentroDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar encuentro</DialogTitle>
            <DialogDescription>¿Estás seguro de eliminar este encuentro? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEncuentroDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={eliminarEncuentro}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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