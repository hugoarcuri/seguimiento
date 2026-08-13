"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  Camera,
  Loader2,
  CalendarPlus,
  Plus,
  Phone,
  Mail,
  Trash2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { estadoColors } from "@/lib/utils";
import { SALUD_CONFIG, ACCION_LABEL, type SaludResultado } from "@/lib/discipulo-health";
import { CAMPOS_EVALUACION, decodificarCampoEvaluacion, calcularProgreso } from "../seguimiento/seguimiento-constants";
import type {
  Discipulo,
  Agenda,
  Oracion,
  Tarea,
  Timeline,
  Etapa,
  Seguimiento,
  SeguimientoEvaluacion,
  SeguimientoObjetivo,
} from "@/types/database";

export interface DetalleDiscipulo {
  discipulo: Discipulo;
  etapas: Etapa[];
  agendas: Agenda[];
  oraciones: Oracion[];
  tareas: Tarea[];
  timeline: Timeline[];
  seguimientos: Seguimiento[];
  evaluacion: SeguimientoEvaluacion | null;
  objetivos: SeguimientoObjetivo[];
  salud: SaludResultado | null;
  onCambio?: () => void;
}

const hoyISO = new Date().toISOString().split("T")[0];

function fechaCorta(iso?: string | null): string {
  if (!iso) return "—";
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return format(d, "dd/MM/yyyy");
}

function diasDesde(fecha: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const d = fecha.length === 10 ? new Date(`${fecha}T00:00:00`) : new Date(fecha);
  return Math.max(0, Math.round((hoy.getTime() - d.getTime()) / 86_400_000));
}

const esFutura = (fecha: string) => (fecha.length === 10 ? fecha : fecha.split("T")[0]) > hoyISO;

export function DiscipuloDetailClient({
  discipulo: initialDiscipulo,
  etapas,
  agendas: initialAgendas,
  oraciones: initialOraciones,
  tareas,
  timeline,
  seguimientos,
  evaluacion: initialEvaluacion,
  objetivos: initialObjetivos,
  salud,
  onCambio,
}: DetalleDiscipulo) {
  const router = useRouter();
  const supabase = createClient();
  const etapaActual = etapas.find((e) => e.id === initialDiscipulo.etapa_id);
  const [discipulo, setDiscipulo] = useState(initialDiscipulo);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [agendas, setAgendas] = useState(initialAgendas);
  const [oraciones, setOraciones] = useState(initialOraciones);
  const [objetivos, setObjetivos] = useState(initialObjetivos);
  const [evaluacion] = useState(initialEvaluacion);

  const seguimientoActivo = seguimientos.find((s) => s.estado === "activo") || seguimientos[0];
  const [seguimiento, setSeguimiento] = useState<Seguimiento | null>(seguimientoActivo || null);

  const [encuentroOpen, setEncuentroOpen] = useState(false);
  const [encuentroDraft, setEncuentroDraft] = useState({ fecha: hoyISO, hora: "", lugar: "", tema_tratado: "", notas: "" });
  const [guardandoEncuentro, setGuardandoEncuentro] = useState(false);

  const [oracionOpen, setOracionOpen] = useState(false);
  const [oracionDraft, setOracionDraft] = useState({ pedido: "" });
  const [guardandoOracion, setGuardandoOracion] = useState(false);

  const [nuevoObjetivo, setNuevoObjetivo] = useState("");

  const ultimaReunion = agendas.find((a) => !esFutura(a.fecha));
  const proximaReunion = [...agendas].reverse().find((a) => esFutura(a.fecha));
  const diasSinContacto = ultimaReunion ? diasDesde(ultimaReunion.fecha) : null;
  const objetivosTotal = objetivos.length;
  const objetivosCompletados = objetivos.filter((o) => o.completado).length;
  const progreso = seguimiento?.progreso ?? (objetivosTotal ? calcularProgreso(objetivos) : null);

  const handleSubirAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${discipulo.id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("discipulo-avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Error al subir: " + uploadError.message); setSubiendoAvatar(false); return; }
    const { data: urlData } = supabase.storage.from("discipulo-avatars").getPublicUrl(path);
    const { error: updateError } = await supabase.from("discipulos").update({ avatar_url: urlData.publicUrl }).eq("id", discipulo.id);
    if (updateError) { toast.error("Error al guardar"); setSubiendoAvatar(false); return; }
    setDiscipulo((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
    setSubiendoAvatar(false);
    toast.success("Foto actualizada");
  };

  const registrarEncuentro = async () => {
    if (!encuentroDraft.fecha || !encuentroDraft.tema_tratado.trim()) {
      toast.error("Completá la fecha y el tema");
      return;
    }
    setGuardandoEncuentro(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error, data } = await supabase
      .from("agenda")
      .insert({
        discipulo_id: discipulo.id,
        lider_id: user?.id || discipulo.lider_id || null,
        fecha: encuentroDraft.fecha,
        realizada: false,
        hora: encuentroDraft.hora || null,
        lugar: encuentroDraft.lugar || null,
        tema_tratado: encuentroDraft.tema_tratado,
        notas: encuentroDraft.notas || null,
      })
      .select()
      .single();
    setGuardandoEncuentro(false);
    if (error) { toast.error("Error al registrar el encuentro"); return; }
    toast.success("Encuentro registrado");
    setEncuentroOpen(false);
    setEncuentroDraft({ fecha: hoyISO, hora: "", lugar: "", tema_tratado: "", notas: "" });
    setAgendas((prev) => [data as Agenda, ...prev]);
    onCambio?.();
  };

  const agregarOracion = async () => {
    const pedido = oracionDraft.pedido.trim();
    if (!pedido) return;
    setGuardandoOracion(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error, data } = await supabase
      .from("oraciones")
      .insert({
        discipulo_id: discipulo.id,
        lider_id: user?.id || discipulo.lider_id || null,
        fecha: hoyISO,
        pedido,
        estado: "pendiente",
      })
      .select()
      .single();
    setGuardandoOracion(false);
    if (error) { toast.error("Error al agregar el pedido"); return; }
    toast.success("Pedido de oración agregado");
    setOracionOpen(false);
    setOracionDraft({ pedido: "" });
    setOraciones((prev) => [data as Oracion, ...prev]);
    onCambio?.();
  };

  const cambiarEstadoOracion = async (o: Oracion, estado: Oracion["estado"]) => {
    const { error } = await supabase.from("oraciones").update({ estado }).eq("id", o.id);
    if (error) { toast.error("Error al actualizar el pedido"); return; }
    setOraciones((prev) => prev.map((x) => (x.id === o.id ? { ...x, estado } : x)));
    toast.success(estado === "respondida" ? "Pedido respondido" : "Pedido actualizado");
    onCambio?.();
  };

  const toggleObjetivo = async (obj: SeguimientoObjetivo) => {
    if (!seguimiento) return;
    const completado = !obj.completado;
    const { error } = await supabase
      .from("seguimiento_objetivos")
      .update({
        completado,
        fecha_cumplimiento: completado ? hoyISO : null,
      })
      .eq("id", obj.id);
    if (error) { toast.error("Error al actualizar el objetivo"); return; }
    const nuevos = objetivos.map((o) =>
      o.id === obj.id ? { ...o, completado, fecha_cumplimiento: completado ? hoyISO : null } : o
    );
    setObjetivos(nuevos);
    const prog = calcularProgreso(nuevos);
    await supabase
      .from("seguimientos")
      .update({ progreso: prog, ultima_actualizacion: new Date().toISOString() })
      .eq("id", seguimiento.id);
    setSeguimiento((prev) => (prev ? { ...prev, progreso: prog } : prev));
    toast.success(completado ? "Objetivo cumplido" : "Objetivo pendiente");
    onCambio?.();
  };

  const agregarObjetivo = async () => {
    const desc = nuevoObjetivo.trim();
    if (!desc || !seguimiento) return;
    const { error, data } = await supabase
      .from("seguimiento_objetivos")
      .insert({ seguimiento_id: seguimiento.id, descripcion: desc })
      .select()
      .single();
    if (error) { toast.error("Error al agregar el objetivo"); return; }
    const nuevos = [...objetivos, data as SeguimientoObjetivo];
    setObjetivos(nuevos);
    setNuevoObjetivo("");
    const prog = calcularProgreso(nuevos);
    await supabase
      .from("seguimientos")
      .update({ progreso: prog, ultima_actualizacion: new Date().toISOString() })
      .eq("id", seguimiento.id);
    setSeguimiento((prev) => (prev ? { ...prev, progreso: prog } : prev));
    toast.success("Objetivo agregado");
    onCambio?.();
  };

  const eliminarObjetivo = async (obj: SeguimientoObjetivo) => {
    if (!seguimiento) return;
    const { error } = await supabase.from("seguimiento_objetivos").delete().eq("id", obj.id);
    if (error) { toast.error("Error al eliminar el objetivo"); return; }
    const nuevos = objetivos.filter((o) => o.id !== obj.id);
    setObjetivos(nuevos);
    const prog = calcularProgreso(nuevos);
    await supabase
      .from("seguimientos")
      .update({ progreso: prog, ultima_actualizacion: new Date().toISOString() })
      .eq("id", seguimiento.id);
    setSeguimiento((prev) => (prev ? { ...prev, progreso: prog } : prev));
    toast.success("Objetivo eliminado");
    onCambio?.();
  };

  const iniciarSeguimiento = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error, data } = await supabase
      .from("seguimientos")
      .insert({
        discipulo_id: discipulo.id,
        discipulador_id: discipulo.lider_id || user.id,
        etapa: discipulo.etapa_id,
        estado: "activo",
        fecha_inicio: hoyISO,
        progreso: 0,
      })
      .select()
      .single();
    if (error) { toast.error("Error al iniciar el seguimiento"); return; }
    toast.success("Seguimiento iniciado");
    setSeguimiento(data as Seguimiento);
    onCambio?.();
  };

  const ejecutarAccionSugerida = () => {
    if (!salud) return;
    switch (salud.accion) {
      case "agendar_encuentro":
        setEncuentroOpen(true);
        return;
      case "evaluar":
      case "revisar_objetivos":
        if (seguimiento) router.push(`/seguimiento/ver?id=${seguimiento.id}`);
        else iniciarSeguimiento();
        return;
      case "pastorear_bautismo":
      case "pastorear_membresia":
        router.push(`/discipulos/editar?id=${discipulo.id}`);
        return;
      case "iniciar_seguimiento":
        iniciarSeguimiento();
        return;
      case "celebrar":
        return;
    }
  };

  const alertas = salud?.alertas || [];

  return (
    <div className="space-y-6">
      {/* BARRA SUPERIOR */}
      <div className="flex items-center justify-between">
        <Link
          href="/discipulos"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted size-11 md:size-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          {seguimiento && (
            <Link href={`/seguimiento/ver?id=${seguimiento.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Seguimiento completo
              </Button>
            </Link>
          )}
          <Link
            href={`/discipulos/editar?id=${discipulo.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 min-h-11 md:min-h-8 gap-1.5 px-3 text-sm font-medium shrink-0"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Link>
        </div>
      </div>

      {/* PERFIL */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative group shrink-0">
          {discipulo.avatar_url ? (
            <img src={discipulo.avatar_url} alt="" className="w-[115px] h-[115px] rounded-full object-cover ring-4 ring-background shadow-lg" />
          ) : (
            <div className="w-[115px] h-[115px] rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl ring-4 ring-background shadow-lg">
              {discipulo.nombre?.charAt(0)?.toUpperCase()}{discipulo.apellido?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={subiendoAvatar}
            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {subiendoAvatar ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSubirAvatar} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <h1 className="text-2xl font-bold">{discipulo.apellido}, {discipulo.nombre}</h1>
          <span className={cn("h-3 w-3 rounded-full shrink-0", estadoColors[discipulo.estado])} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {salud && (
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", SALUD_CONFIG[salud.salud].badge)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", SALUD_CONFIG[salud.salud].dot)} />
              {SALUD_CONFIG[salud.salud].etiqueta}
            </span>
          )}
          <Badge variant="secondary">{etapaActual?.nombre || "Sin etapa"}</Badge>
          {discipulo.etapa_id >= 2 && !discipulo.bautizado && (
            <Badge variant="destructive">Bautismo pend.</Badge>
          )}
          {discipulo.etapa_id >= 2 && !discipulo.es_miembro && (
            <Badge variant="destructive">Membresía pend.</Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground max-w-sm truncate">
          {discipulo.telefono && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{discipulo.telefono}</span>}
          {discipulo.telefono && discipulo.email && <span className="mx-2">·</span>}
          {discipulo.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{discipulo.email}</span>}
        </p>
      </div>

      {/* MÉTRICAS CLAVE */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Progreso del seguimiento</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{progreso !== null ? `${progreso}%` : "—"}</p>
            {progreso !== null && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all", salud ? SALUD_CONFIG[salud.salud].bar : "bg-primary")}
                  style={{ width: `${Math.max(0, Math.min(100, progreso))}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Último encuentro</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {diasSinContacto === null ? "Sin reuniones" : `hace ${diasSinContacto} días`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {ultimaReunion ? fechaCorta(ultimaReunion.fecha) : "Sin registros"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Próximo encuentro</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {proximaReunion ? fechaCorta(proximaReunion.fecha) : "—"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {objetivosTotal ? `${objetivosCompletados}/${objetivosTotal} objetivos` : "Sin objetivos"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SEÑALES A ATENDER + ACCIONES */}
      {alertas.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Señales a atender</p>
          {alertas.map((a) => (
            <p key={a.tipo} className="text-sm flex items-center gap-2">
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", a.severidad === "alta" ? "bg-red-600" : a.severidad === "media" ? "bg-amber-500" : "bg-slate-400")} />
              {a.mensaje}
            </p>
          ))}
          <div className="flex flex-wrap gap-2 pt-1.5">
            {salud && salud.accion !== "celebrar" && (
              <Button size="sm" onClick={ejecutarAccionSugerida} className="gap-1.5">
                {ACCION_LABEL[salud.accion]}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setOracionOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Pedido de oración
            </Button>
          </div>
        </div>
      )}

      {!seguimiento && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm flex-1">
            <strong>Sin seguimiento activo.</strong> Iniciá un seguimiento para empezar a pastorear a {discipulo.nombre}.
          </p>
          <Button size="sm" onClick={iniciarSeguimiento}>Iniciar seguimiento</Button>
        </div>
      )}

      {/* PESTAÑAS */}
      <Tabs defaultValue="hoy" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="hoy">Hoy</TabsTrigger>
          <TabsTrigger value="encuentros">Encuentros ({agendas.length})</TabsTrigger>
          <TabsTrigger value="salud">Salud espiritual</TabsTrigger>
          <TabsTrigger value="oracion">Oración ({oraciones.length})</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        {/* HOY */}
        <TabsContent value="hoy" className="w-full min-w-0 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Próximos encuentros</CardTitle>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEncuentroOpen(true)}>
                    <CalendarPlus className="mr-1 h-3.5 w-3.5" />Registrar encuentro
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {agendas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Todavía no hay encuentros registrados.</p>
                ) : (
                  agendas.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{a.tema_tratado}</p>
                        <p className="text-[11px] text-muted-foreground">{a.lugar || "Sin lugar"}</p>
                      </div>
                      <Badge variant={esFutura(a.fecha) ? "default" : "outline"}>{fechaCorta(a.fecha)}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Tareas</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {tareas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay tareas asignadas.</p>
                ) : (
                  tareas.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{t.titulo}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {t.tipo}
                          {t.fecha_limite && ` · Límite: ${fechaCorta(t.fecha_limite)}`}
                        </p>
                      </div>
                      <Badge
                        variant={
                          t.estado === "completada"
                            ? "default"
                            : t.estado === "vencida"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {t.estado}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {oraciones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pedidos de oración activos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {oraciones.slice(0, 4).map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{o.pedido}</p>
                      <p className="text-[11px] text-muted-foreground">{fechaCorta(o.fecha)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      onClick={() => cambiarEstadoOracion(o, "respondida")}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                      Respondida
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ENCUENTROS */}
        <TabsContent value="encuentros" className="w-full min-w-0 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setEncuentroOpen(true)} className="gap-1.5">
              <CalendarPlus className="h-4 w-4" />Registrar encuentro
            </Button>
          </div>
          {agendas.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay encuentros registrados</CardContent></Card>
          ) : (
            agendas.map((a) => (
              <Card key={a.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{a.tema_tratado}</CardTitle>
                    <Badge variant="outline">{fechaCorta(a.fecha)}</Badge>
                  </div>
                  {a.hora && <CardDescription>{a.hora}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {a.lugar && <p><span className="text-muted-foreground">Lugar:</span> {a.lugar}</p>}
                  {a.notas && <p><span className="text-muted-foreground">Notas:</span> {a.notas}</p>}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* SALUD ESPIRITUAL */}
        <TabsContent value="salud" className="w-full min-w-0 space-y-4">
          {!seguimiento ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Sin seguimiento activo.{" "}
                <button type="button" className="text-primary underline" onClick={iniciarSeguimiento}>
                  Iniciar seguimiento
                </button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Evaluación integral</CardTitle>
                    <Link href={`/seguimiento/ver?id=${seguimiento.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        {evaluacion ? "Editar evaluación" : "Hacer evaluación"}
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {!evaluacion ? (
                    <p className="text-sm text-muted-foreground">
                      Todavía no se hizo una evaluación. La evaluación revela la salud espiritual y las áreas de pastoreo.
                    </p>
                  ) : (
                    <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      {CAMPOS_EVALUACION.map((campo) => {
                        const raw = evaluacion[campo.key as keyof SeguimientoEvaluacion];
                        const { opcion, detalle } = decodificarCampoEvaluacion(campo, typeof raw === "string" ? raw : undefined);
                        const valor = campo.key === "habitos_pecaminosos"
                          ? (typeof raw === "string" && raw ? raw : "—")
                          : detalle || opcion || "—";
                        return (
                          <div key={campo.key} className="text-sm min-w-0">
                            <p className="text-muted-foreground">{campo.label}</p>
                            <p className="font-medium break-words">{valor}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Objetivos y hábitos ({objetivosCompletados}/{objetivosTotal})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {objetivos.length === 0 && (
                    <p className="text-sm text-muted-foreground">Sin objetivos. Agregá el primero para avanzar en el seguimiento.</p>
                  )}
                  {objetivos.map((o) => (
                    <div key={o.id} className="flex items-center gap-2 rounded-lg border p-2">
                      <input
                        type="checkbox"
                        checked={!!o.completado}
                        onChange={() => toggleObjetivo(o)}
                        className="size-4 shrink-0 cursor-pointer accent-primary"
                        aria-label={o.descripcion}
                      />
                      <p className={cn("flex-1 text-sm min-w-0", o.completado && "line-through text-muted-foreground")}>{o.descripcion}</p>
                      <button type="button" onClick={() => eliminarObjetivo(o)} className="shrink-0 text-muted-foreground/50 hover:text-destructive" aria-label="Eliminar objetivo">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nuevo objetivo..."
                      value={nuevoObjetivo}
                      onChange={(e) => setNuevoObjetivo(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarObjetivo(); } }}
                      className="h-9"
                    />
                    <Button size="sm" onClick={agregarObjetivo} className="gap-1 shrink-0">
                      <Plus className="h-4 w-4" />Agregar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ORACIÓN */}
        <TabsContent value="oracion" className="w-full min-w-0 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setOracionOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />Agregar pedido
            </Button>
          </div>
          {oraciones.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay pedidos de oración</CardContent></Card>
          ) : (
            oraciones.map((o) => (
              <Card key={o.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">{o.pedido}</CardTitle>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={o.estado === "en_oracion" ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => cambiarEstadoOracion(o, "en_oracion")}
                      >
                        En oración
                      </Button>
                      <Button
                        size="sm"
                        variant={o.estado === "respondida" ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => cambiarEstadoOracion(o, "respondida")}
                      >
                        Respondida
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{fechaCorta(o.fecha)}</CardDescription>
                </CardHeader>
                {o.respuesta && (
                  <CardContent>
                    <p className="text-sm"><span className="text-muted-foreground">Respuesta:</span> {o.respuesta}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        {/* HISTORIAL */}
        <TabsContent value="historial" className="w-full min-w-0 space-y-4">
          {timeline.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay historial disponible</CardContent></Card>
          ) : (
            <div className="relative space-y-4 before:absolute before:left-4 before:top-0 before:h-full before:w-0.5 before:bg-border">
              {timeline.map((evento) => (
                <div key={evento.id} className="relative pl-10">
                  <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                  <Card>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{evento.descripcion}</p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(evento.created_at), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* DIALOG ENCUENTRO */}
      <Dialog open={encuentroOpen} onOpenChange={setEncuentroOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar encuentro</DialogTitle>
            <DialogDescription>
              Encuentro con {discipulo.nombre} {discipulo.apellido}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Fecha *</Label>
                <Input type="date" value={encuentroDraft.fecha} onChange={(e) => setEncuentroDraft({ ...encuentroDraft, fecha: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Hora</Label>
                <Input type="time" value={encuentroDraft.hora} onChange={(e) => setEncuentroDraft({ ...encuentroDraft, hora: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">Tema tratado *</Label>
              <Input value={encuentroDraft.tema_tratado} onChange={(e) => setEncuentroDraft({ ...encuentroDraft, tema_tratado: e.target.value })} placeholder="Ej.: Continuación de la etapa 2" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">Lugar</Label>
              <Input value={encuentroDraft.lugar} onChange={(e) => setEncuentroDraft({ ...encuentroDraft, lugar: e.target.value })} placeholder="Ej.: Café del centro" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">Notas</Label>
              <Textarea rows={2} value={encuentroDraft.notas} onChange={(e) => setEncuentroDraft({ ...encuentroDraft, notas: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEncuentroOpen(false)}>Cancelar</Button>
            <Button onClick={registrarEncuentro} disabled={guardandoEncuentro}>
              {guardandoEncuentro && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG ORACIÓN */}
      <Dialog open={oracionOpen} onOpenChange={setOracionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedido de oración</DialogTitle>
            <DialogDescription>
              Agregar un pedido para {discipulo.nombre} {discipulo.apellido}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground">Pedido *</Label>
            <Textarea rows={3} value={oracionDraft.pedido} onChange={(e) => setOracionDraft({ pedido: e.target.value })} placeholder="¿Por qué interceder?" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOracionOpen(false)}>Cancelar</Button>
            <Button onClick={agregarOracion} disabled={guardandoOracion || !oracionDraft.pedido.trim()}>
              {guardandoOracion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
