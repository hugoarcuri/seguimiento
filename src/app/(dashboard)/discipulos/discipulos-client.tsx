"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { citaEsRealizadaAutomatica } from "@/lib/discipulo-health";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  UserPlus,
  Loader2,
  Trash2,
  Download,
  CalendarPlus,
  ChevronDown,
  Cake,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  SALUD_CONFIG,
  ORDEN_SALUD,
  ACCION_LABEL,
  UMBRALES_SALUD,
  type SaludDiscipulo,
} from "@/lib/discipulo-health";
import { ImportarDiscipulos } from "./importar-discipulos";
import { DiscipuloDetailClient, type DetalleDiscipulo } from "./discipulo-detail-client";
import type { DiscipuloRadar } from "./radar-data";
import type { Etapa, Seguimiento, SeguimientoEvaluacion, SeguimientoObjetivo } from "@/types/database";

const DIAS_CUMPLEANOS = 7;

function diasHastaCumple(fecha?: string | null): number | null {
  if (!fecha) return null;
  const [, mes, dia] = fecha.split("-").map(Number);
  if (!mes || !dia) return null;
  const hoy = new Date();
  const hoyInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
  let cumple = new Date(hoy.getFullYear(), mes - 1, dia).getTime();
  if (cumple < hoyInicio) cumple = new Date(hoy.getFullYear() + 1, mes - 1, dia).getTime();
  return Math.round((cumple - hoyInicio) / 86_400_000);
}

const avatarColors = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500",
  "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500", "bg-cyan-500",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

type Foco = "todos" | "urgentes" | "sin_contacto" | "bautismo" | "membresia";

interface DiscipulosClientProps {
  discipulos: DiscipuloRadar[];
  etapas: Etapa[];
  esAdmin: boolean;
  onCambio?: () => void;
}

export function DiscipulosClient({ discipulos, etapas, esAdmin, onCambio }: DiscipulosClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [etapaFilter, setEtapaFilter] = useState<number | null>(null);
  const [foco, setFoco] = useState<Foco>("todos");
  const [colapsados, setColapsados] = useState<Set<SaludDiscipulo>>(new Set(["al_dia"]));

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detalle, setDetalle] = useState<DetalleDiscipulo | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const [encuentroDialog, setEncuentroDialog] = useState<DiscipuloRadar | null>(null);
  const [encuentroDraft, setEncuentroDraft] = useState({ fecha: new Date().toISOString().split("T")[0], hora: "", lugar: "", tema_tratado: "", notas: "" });
  const [encuentroGuardando, setEncuentroGuardando] = useState(false);
  const [iniciandoSeg, setIniciandoSeg] = useState<string | null>(null);

  const discipulosRef = useRef(discipulos);
  useEffect(() => { discipulosRef.current = discipulos; }, [discipulos]);

  const conteos = useMemo(() => {
    const n = (pred: (d: DiscipuloRadar) => boolean) => discipulos.filter(pred).length;
    return {
      urgentes: n((d) => d.salud.salud === "critico"),
      sin_contacto: n((d) => d.salud.alertas.some((a) => a.tipo === "sin_contacto")),
      bautismo: n((d) => d.salud.alertas.some((a) => a.tipo === "bautismo_pendiente")),
      membresia: n((d) => d.salud.alertas.some((a) => a.tipo === "membresia_pendiente")),
    };
  }, [discipulos]);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return discipulos.filter((d) => {
      if (etapaFilter !== null && d.etapa_id !== etapaFilter) return false;
      if (q) {
        const nombre = `${d.apellido} ${d.nombre}`.toLowerCase();
        const apellido = d.apellido.toLowerCase();
        const nombreSolo = d.nombre.toLowerCase();
        if (!(nombre.includes(q) || apellido.includes(q) || nombreSolo.includes(q))) return false;
      }
      if (foco === "todos") return true;
      if (foco === "urgentes") return d.salud.salud === "critico";
      return d.salud.alertas.some((a) => a.tipo === foco);
    });
  }, [discipulos, search, etapaFilter, foco]);

  const grupos = ORDEN_SALUD
    .map((salud) => ({ salud, items: filtrados.filter((d) => d.salud.salud === salud) }))
    .filter((g) => g.items.length > 0);

  const cargarDetalle = async (id: string) => {
    setLoadingDetail(true);
    setSelectedId(id);
    const supabase = createClient();
    const [dRes, eRes, oRes, tRes, tlRes, segRes] = await Promise.all([
      supabase.from("discipulos").select("*").eq("id", id).single(),
      supabase.from("agenda").select("*").eq("discipulo_id", id).order("fecha", { ascending: false }),
      supabase.from("oraciones").select("*").eq("discipulo_id", id).order("fecha", { ascending: false }),
      supabase.from("tareas").select("*").eq("discipulo_id", id).order("created_at", { ascending: false }),
      supabase.from("timeline").select("*").eq("discipulo_id", id).order("created_at", { ascending: false }),
      supabase.from("seguimientos").select("*").eq("discipulo_id", id).order("created_at", { ascending: false }),
    ]);
    if (!dRes.data) { setLoadingDetail(false); return; }
    const seguimientos = (segRes.data || []) as Seguimiento[];
    const seg = seguimientos.find((s) => s.estado === "activo") || seguimientos[0];
    let evaluacion: SeguimientoEvaluacion | null = null;
    let objetivos: SeguimientoObjetivo[] = [];
    if (seg) {
      const [evRes, objRes] = await Promise.all([
        supabase.from("seguimiento_evaluaciones").select("*").eq("seguimiento_id", seg.id).maybeSingle(),
        supabase.from("seguimiento_objetivos").select("*").eq("seguimiento_id", seg.id).order("created_at", { ascending: true }),
      ]);
      evaluacion = (evRes.data as SeguimientoEvaluacion) || null;
      objetivos = (objRes.data as SeguimientoObjetivo[]) || [];
    }
    setDetalle({
      discipulo: dRes.data,
      etapas,
      agendas: eRes.data || [],
      oraciones: oRes.data || [],
      tareas: tRes.data || [],
      timeline: tlRes.data || [],
      seguimientos,
      evaluacion,
      objetivos,
      salud: discipulosRef.current.find((r) => r.id === id)?.salud ?? null,
      onCambio,
    });
    setLoadingDetail(false);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("discipulos").delete().eq("id", id);
    if (error) {
      toast.error(error.message === 'new row violates row-level security policy for table "discipulos"'
        ? "Solo los administradores pueden eliminar discípulos"
        : `Error al eliminar: ${error.message}`);
    } else {
      toast.success("Discípulo eliminado");
      setDeleteDialog(null);
      if (selectedId === id) { setSelectedId(null); setDetalle(null); }
      onCambio?.();
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length || bulkDeleting) return;
    setBulkDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("discipulos").delete().in("id", selectedIds);
    setBulkDeleting(false);
    if (error) {
      toast.error(error.message.includes("row-level security policy")
        ? "Solo los administradores pueden eliminar discípulos"
        : `Error al eliminar: ${error.message}`);
      return;
    }
    toast.success(`${selectedIds.length} discípulo(s) eliminado(s)`);
    setBulkDeleteOpen(false);
    setSelectedIds([]);
    onCambio?.();
  };

  const toggleSeleccion = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const todosSeleccionados = filtrados.length > 0 && filtrados.every((d) => selectedIds.includes(d.id));

  const toggleTodos = () => {
    const ids = new Set(filtrados.map((d) => d.id));
    setSelectedIds((prev) =>
      todosSeleccionados ? prev.filter((id) => !ids.has(id)) : [...new Set([...prev, ...ids])]
    );
  };

  const exportarSeleccionados = () => {
    const sel = discipulos.filter((d) => selectedIds.includes(d.id));
    if (sel.length === 0) return;
    const filas = sel.map((d) => ({
      Apellido: d.apellido,
      Nombre: d.nombre,
      Etapa: d.etapa_nombre,
      Estado: d.estado,
      "Estado pastoral": SALUD_CONFIG[d.salud.salud].etiqueta,
      Progreso: d.progreso ?? "",
      "Días sin reunión": d.diasSinContacto ?? "",
      "Pedidos de oración": d.oracionesPendientes,
      "Objetivos pendientes": d.objetivosPendientes,
    }));
    const csv = [Object.keys(filas[0]).join(";"), ...filas.map((f) => Object.values(f).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "discipulos.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`${sel.length} discípulos exportados`);
  };

  const iniciarSeguimiento = async (d: DiscipuloRadar) => {
    setIniciandoSeg(d.id);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("seguimientos").insert({
      discipulo_id: d.id,
      discipulador_id: d.lider_id || user?.id || "",
      etapa: d.etapa_id,
      estado: "activo",
      fecha_inicio: new Date().toISOString().split("T")[0],
      progreso: 0,
    });
    setIniciandoSeg(null);
    if (error) { toast.error("Error al iniciar el seguimiento"); return; }
    toast.success("Seguimiento iniciado");
    onCambio?.();
  };

  const ejecutarAccion = (d: DiscipuloRadar) => {
    switch (d.salud.accion) {
      case "agendar_encuentro":
        setEncuentroDialog(d);
        setEncuentroDraft({ fecha: new Date().toISOString().split("T")[0], hora: "", lugar: "", tema_tratado: "", notas: "" });
        return;
      case "evaluar":
      case "revisar_objetivos":
        if (d.seguimiento_id) router.push(`/seguimiento/ver?id=${d.seguimiento_id}`);
        else iniciarSeguimiento(d);
        return;
      case "pastorear_bautismo":
      case "pastorear_membresia":
        router.push(`/discipulos/editar?id=${d.id}`);
        return;
      case "iniciar_seguimiento":
        iniciarSeguimiento(d);
        return;
      case "celebrar":
        cargarDetalle(d.id);
        return;
    }
  };

  const guardarEncuentro = async () => {
    if (!encuentroDialog) return;
    if (!encuentroDraft.fecha || !encuentroDraft.tema_tratado.trim()) {
      toast.error("Completá la fecha y el tema");
      return;
    }
    setEncuentroGuardando(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("agenda").insert({
      discipulo_id: encuentroDialog.id,
      lider_id: user?.id || encuentroDialog.lider_id || null,
      fecha: encuentroDraft.fecha,
      realizada: citaEsRealizadaAutomatica(encuentroDraft.fecha),
      hora: encuentroDraft.hora || null,
      lugar: encuentroDraft.lugar || null,
      tema_tratado: encuentroDraft.tema_tratado,
      notas: encuentroDraft.notas || null,
    });
    setEncuentroGuardando(false);
    if (error) { toast.error("Error al registrar el encuentro"); return; }
    toast.success("Encuentro registrado");
    setEncuentroDialog(null);
    onCambio?.();
  };

  const chips: { key: Foco; label: string; value: number; cls: string }[] = [
    { key: "urgentes", label: "Urgentes", value: conteos.urgentes, cls: "text-red-600 dark:text-red-400" },
    { key: "sin_contacto", label: "Sin reunión", value: conteos.sin_contacto, cls: "text-amber-600 dark:text-amber-400" },
    { key: "bautismo", label: "Bautismo", value: conteos.bautismo, cls: "text-blue-600 dark:text-blue-400" },
    { key: "membresia", label: "Membresía", value: conteos.membresia, cls: "text-blue-600 dark:text-blue-400" },
  ];

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:h-[calc(100vh-8rem)]">
      {/* PANEL IZQUIERDO */}
      <div className="w-full sm:w-[400px] sm:shrink-0 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">Discípulos</h1>
            <p className="text-xs text-muted-foreground">{filtrados.length} de {discipulos.length}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedIds.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={exportarSeleccionados} className="gap-1 px-2 text-xs font-medium">
                  <Download className="h-3.5 w-3.5" />
                  Exportar
                </Button>
                {esAdmin && (
                  <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)} className="gap-1 px-2 text-xs font-medium">
                    <Trash2 className="h-3.5 w-3.5" />
                    ({selectedIds.length})
                  </Button>
                )}
              </>
            )}
            <Link
              href="/discipulos/nuevo"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 min-h-11 md:min-h-8 gap-1 px-2 text-xs font-medium"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Nuevo
            </Link>
            <ImportarDiscipulos etapas={etapas} onImportado={onCambio} />
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar discípulo..." className="pl-9 h-11 md:h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFoco("todos")}
            className={cn(
              "text-xs rounded-full px-2.5 py-1 font-medium transition-colors inline-flex items-center gap-1.5",
              foco === "todos" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Todos
          </button>
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFoco(c.key)}
              className={cn(
                "text-xs rounded-full px-2.5 py-1 font-medium transition-colors inline-flex items-center gap-1",
                foco === c.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {c.label}
              <span className={cn("tabular-nums", foco === c.key ? "" : c.cls)}>{c.value}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={() => setEtapaFilter(null)}
            className={cn("text-xs rounded-full px-2.5 py-1 font-medium transition-colors", etapaFilter === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}
          >Todas</button>
          {etapas.map((e) => (
            <button key={e.id} type="button" onClick={() => setEtapaFilter(e.id)}
              className={cn("text-xs rounded-full px-2.5 py-1 font-medium transition-colors", etapaFilter === e.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}
            >{e.nombre}</button>
          ))}
        </div>

        {filtrados.length > 0 && (
          <div className="flex items-center justify-between px-1 pb-0.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={todosSeleccionados}
                onChange={() => toggleTodos()}
                aria-label="Seleccionar todos"
                className="size-4 shrink-0 cursor-pointer accent-primary"
              />
              Seleccionar todos
            </label>
            {selectedIds.length > 0 && (
              <span className="text-xs text-muted-foreground">{selectedIds.length} seleccionado(s)</span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-2">
          {grupos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No se encontraron discípulos</p>
          ) : (
            grupos.map((g) => {
              const cfg = SALUD_CONFIG[g.salud];
              const colapsado = colapsados.has(g.salud);
              return (
                <div key={g.salud}>
                  <button
                    type="button"
                    onClick={() => setColapsados((prev) => {
                      const s = new Set(prev);
                      if (s.has(g.salud)) s.delete(g.salud); else s.add(g.salud);
                      return s;
                    })}
                    className="w-full flex items-center justify-between px-1 py-1.5 group"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                      <span className="text-xs font-semibold uppercase tracking-wide">{cfg.etiqueta}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{g.items.length}</span>
                    </span>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", colapsado && "-rotate-90")} />
                  </button>

                  {!colapsado && (
                    <div className="space-y-1">
                      {g.items.map((d) => {
                        const diasCumple = diasHastaCumple(d.fecha_nacimiento);
                        const alertasVisibles = d.salud.alertas.filter((a) => a.tipo !== "sin_contacto").slice(0, 2);
                        return (
                          <div key={d.id} className={cn("rounded-lg border border-l-2 bg-card shadow-sm", cfg.border, selectedId === d.id && "ring-2 ring-primary/30")}>
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => cargarDetalle(d.id)}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cargarDetalle(d.id); } }}
                              className="w-full flex items-start gap-2 p-2 text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <span onClick={(e) => e.stopPropagation()} className="shrink-0 rounded-md p-1 -m-1 hover:bg-primary/10 pt-0.5" title="Seleccionar">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(d.id)}
                                  onChange={() => toggleSeleccion(d.id)}
                                  aria-label="Seleccionar"
                                  className="size-4 shrink-0 cursor-pointer accent-primary"
                                />
                              </span>
                              {d.avatar_url ? (
                                <img src={d.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", getAvatarColor(d.id))}>
                                  {d.nombre?.charAt(0)?.toUpperCase()}{d.apellido?.charAt(0)?.toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium truncate">{d.apellido}, {d.nombre}</p>
                                  <span className={cn("text-[10px] font-semibold rounded-full px-1.5 py-0.5 shrink-0", cfg.badge)}>{cfg.etiqueta}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {d.etapa_nombre}
                                  {d.progreso !== null && <span className="tabular-nums"> · {d.progreso}%</span>}
                                </p>
                                {diasCumple !== null && diasCumple <= DIAS_CUMPLEANOS && (
                                  <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 truncate flex items-center gap-1">
                                    <Cake className="h-3 w-3 shrink-0" />
                                    {diasCumple === 0 ? "¡Hoy cumple años!" : `Cumple en ${diasCumple} día${diasCumple === 1 ? "" : "s"}`}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  {d.diasSinContacto !== null && d.diasSinContacto >= UMBRALES_SALUD.contactoAlerta && (
                                    <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 font-medium", d.diasSinContacto >= UMBRALES_SALUD.contactoCritico ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400")}>
                                      {d.diasSinContacto}d sin reunión
                                    </span>
                                  )}
                                  {alertasVisibles.map((a) => (
                                    <span key={a.tipo} className={cn("text-[10px] rounded-full px-1.5 py-0.5 font-medium", a.severidad === "alta" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" : a.severidad === "media" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" : "bg-muted text-muted-foreground")}>
                                      {a.mensaje}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {esAdmin && (
                                <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteDialog(d.id); }} className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors pt-0.5" aria-label="Eliminar">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            {d.salud.accion !== "celebrar" && (
                              <div className="px-2 pb-2">
                                <Button
                                  size="sm"
                                  className="h-7 w-full text-xs gap-1"
                                  disabled={iniciandoSeg === d.id}
                                  onClick={() => ejecutarAccion(d)}
                                >
                                  {iniciandoSeg === d.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                  {ACCION_LABEL[d.salud.accion]}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {selectedId && detalle?.discipulo.id === selectedId ? (
          <DiscipuloDetailClient key={selectedId} {...detalle} />
        ) : selectedId && loadingDetail ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2 max-w-sm">
              <p className="text-muted-foreground text-sm">Seleccioná un discípulo para ver su panorama pastoral</p>
              <p className="text-xs text-muted-foreground">Los grupos de color muestran quién necesita tu atención hoy.</p>
            </div>
          </div>
        )}
      </div>

      {/* DIALOG ELIMINAR */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Discípulo</DialogTitle>
            <DialogDescription>¿Estás seguro? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteDialog && handleDelete(deleteDialog)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG BORRADO MASIVO */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar discípulos</DialogTitle>
            <DialogDescription>
              ¿Eliminar {selectedIds.length} discípulo(s) seleccionado(s)? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleting}>
              {bulkDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG ENCUENTRO RÁPIDO */}
      <Dialog open={!!encuentroDialog} onOpenChange={() => setEncuentroDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar encuentro</DialogTitle>
            <DialogDescription>
              {encuentroDialog && `Encuentro con ${encuentroDialog.nombre} ${encuentroDialog.apellido}`}
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
              <Input value={encuentroDraft.tema_tratado} onChange={(e) => setEncuentroDraft({ ...encuentroDraft, tema_tratado: e.target.value })} placeholder="Ej.: Continuación de la etapa" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">Lugar</Label>
              <Input value={encuentroDraft.lugar} onChange={(e) => setEncuentroDraft({ ...encuentroDraft, lugar: e.target.value })} placeholder="Ej.: Café del centro" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEncuentroDialog(null)}>Cancelar</Button>
            <Button onClick={guardarEncuentro} disabled={encuentroGuardando} className="gap-1.5">
              {encuentroGuardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
