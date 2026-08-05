"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, UserPlus, Loader2, Trash2, Cake, Download } from "lucide-react";
import { toast } from "sonner";
import type { Discipulo, Etapa, Agenda, Oracion, Tarea, Timeline } from "@/types/database";
import { ImportarDiscipulos } from "./importar-discipulos";
import { DiscipuloDetailClient } from "./discipulo-detail-client";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const DIAS_CUMPLEANOS = 7;

function diasHastaCumple(fecha?: string): number | null {
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

interface DiscipulosClientProps {
  discipulos: Discipulo[];
  etapas: Etapa[];
  onCambio?: () => void;
}

export function DiscipulosClient({ discipulos, etapas, onCambio }: DiscipulosClientProps) {
  const [search, setSearch] = useState("");
  const [etapaFilter, setEtapaFilter] = useState<number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<{
    discipulo: Discipulo;
    agendas: Agenda[];
    oraciones: Oracion[];
    tareas: Tarea[];
    timeline: Timeline[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const filtered = discipulos.filter((d) => {
    if (etapaFilter !== null && d.etapa_id !== etapaFilter) return false;
    return (
      d.nombre.toLowerCase().includes(search.toLowerCase()) ||
      d.apellido.toLowerCase().includes(search.toLowerCase()) ||
      d.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  useEffect(() => {
    if (!selectedId) return;
    let cancelado = false;
    const supabase = createClient();
    Promise.all([
      supabase.from("discipulos").select("*").eq("id", selectedId).single(),
      supabase.from("agenda").select("*").eq("discipulo_id", selectedId).order("fecha", { ascending: false }),
      supabase.from("oraciones").select("*").eq("discipulo_id", selectedId).order("fecha", { ascending: false }),
      supabase.from("tareas").select("*").eq("discipulo_id", selectedId).order("created_at", { ascending: false }),
      supabase.from("timeline").select("*").eq("discipulo_id", selectedId).order("created_at", { ascending: false }),
    ]).then(([dRes, eRes, oRes, tRes, tlRes]) => {
      if (cancelado) return;
      if (!dRes.data) { setLoadingDetail(false); return; }
      setDetailData({
        discipulo: dRes.data,
        agendas: eRes.data || [],
        oraciones: oRes.data || [],
        tareas: tRes.data || [],
        timeline: tlRes.data || [],
      });
      setLoadingDetail(false);
    }).catch(() => { if (!cancelado) setLoadingDetail(false); });
    return () => { cancelado = true; };
  }, [selectedId]);

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("discipulos").delete().eq("id", id);
    if (error) {
      toast.error(error.message === "new row violates row-level security policy for table \"discipulos\""
        ? "Solo los administradores pueden eliminar discípulos"
        : `Error al eliminar: ${error.message}`);
    } else {
      toast.success("Discípulo eliminado");
      setDeleteDialog(null);
      if (selectedId === id) { setSelectedId(null); }
      onCambio?.();
    }
  };

  const toggleSeleccion = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const todosSeleccionados = filtered.length > 0 && filtered.every((d) => selectedIds.includes(d.id));

  const toggleTodos = () => {
    const ids = new Set(filtered.map((d) => d.id));
    setSelectedIds((prev) =>
      todosSeleccionados ? prev.filter((id) => !ids.has(id)) : [...new Set([...prev, ...ids])]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length || bulkDeleting) return;
    setBulkDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("discipulos").delete().in("id", selectedIds);
    setBulkDeleting(false);
    if (error) {
      toast.error(error.message.includes("row-level security policy")
        ? "Solo los administradores pueden eliminar disc├¡pulos"
        : `Error al eliminar: ${error.message}`);
      return;
    }
    toast.success(`${selectedIds.length} disc├¡pulo(s) eliminado(s)`);
    setBulkDeleteOpen(false);
    setSelectedIds([]);
    onCambio?.();
  };

  const exportarSeleccionados = () => {
    const sel = discipulos.filter((d) => selectedIds.includes(d.id));
    if (sel.length === 0) return;
    const filas = sel.map((d) => ({
      Apellido: d.apellido,
      Nombre: d.nombre,
      Email: d.email || "",
      "Teléfono": d.telefono || "",
      Etapa: etapas.find((e) => e.id === d.etapa_id)?.nombre || "",
      Estado: d.estado,
      "Fecha nacimiento": d.fecha_nacimiento || "",
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

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:h-[calc(100vh-8rem)]">
      {/* LEFT PANEL */}
      <div className="w-full sm:w-[380px] sm:shrink-0 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">Discípulos</h1>
            <p className="text-xs text-muted-foreground">{filtered.length} de {discipulos.length}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedIds.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportarSeleccionados} className="gap-1 px-2 text-xs font-medium">
                <Download className="h-3.5 w-3.5" />
                Exportar
              </Button>
            )}
            {selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)} className="gap-1 px-2 text-xs font-medium">
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar ({selectedIds.length})
              </Button>
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
          <Input placeholder="Buscar..." className="pl-9 h-11 md:h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
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

        <div className="flex-1 overflow-y-auto space-y-0.5 -mx-1 px-1">
          <div className="flex items-center justify-between px-1 pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={todosSeleccionados} onCheckedChange={toggleTodos} aria-label="Seleccionar todos" />
              Seleccionar todos
            </label>
            {selectedIds.length > 0 && (
              <span className="text-xs text-muted-foreground">{selectedIds.length} seleccionado(s)</span>
            )}
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No se encontraron discípulos</p>
          ) : (
            filtered.map((d) => {
              const diasCumple = diasHastaCumple(d.fecha_nacimiento);
              return (
              <button
                key={d.id}
                type="button"
                onClick={() => { setLoadingDetail(true); setSelectedId(d.id); }}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors group",
                    selectedId === d.id ? "bg-primary/10" : "hover:bg-muted/50"
                  )}
                >
                  <span onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <Checkbox checked={selectedIds.includes(d.id)} onCheckedChange={() => toggleSeleccion(d.id)} aria-label="Seleccionar" />
                  </span>
                  {d.avatar_url ? (
                  <img src={d.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", getAvatarColor(d.id))}>
                    {d.nombre?.charAt(0)?.toUpperCase()}{d.apellido?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{d.apellido}, {d.nombre}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{etapas.find((e) => e.id === d.etapa_id)?.nombre || "Sin etapa"}</p>
                  {diasCumple !== null && diasCumple <= DIAS_CUMPLEANOS && (
                    <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 truncate flex items-center gap-1">
                      <Cake className="h-3 w-3 shrink-0" />
                      {diasCumple === 0 ? "¡Hoy cumple años!" : `Cumple en ${diasCumple} día${diasCumple === 1 ? "" : "s"}`}
                    </p>
                  )}
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteDialog(d.id); }} className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {selectedId && detailData?.discipulo.id === selectedId ? (
          <DiscipuloDetailClient
            key={selectedId}
            discipulo={detailData.discipulo}
            etapas={etapas}
            agendas={detailData.agendas}
            oraciones={detailData.oraciones}
            tareas={detailData.tareas}
            timeline={detailData.timeline}
          />
        ) : selectedId && loadingDetail ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Seleccioná un discípulo para ver su información</p>
          </div>
        )}
      </div>

      {/* DELETE DIALOG */}
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

      {/* BULK DELETE DIALOG */}
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
    </div>
  );
}
