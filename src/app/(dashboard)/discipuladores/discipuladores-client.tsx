"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  UserPlus,
  Trash2,
  Pencil,
  Mail,
  Phone,
  Users,
  Link2,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn, estadoColors, calcularEdad } from "@/lib/utils";
import { descargarCSV } from "@/lib/csv";
import type { Profile, Discipulo, Etapa } from "@/types/database";
import { CrearDiscipuladorDialog } from "./crear-discipulador-dialog";
import { EditarDiscipuladorDialog } from "./editar-discipulador-dialog";

const avatarColors = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500",
  "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500", "bg-cyan-500",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function iniciales(p: Profile): string {
  return `${p.nombre?.charAt(0)?.toUpperCase() || ""}${p.apellido?.charAt(0)?.toUpperCase() || ""}`;
}

interface DiscipuladoresClientProps {
  discipuladores: Profile[];
  discipulos: Discipulo[];
  etapas: Etapa[];
  onCambio?: () => void;
}

export function DiscipuladoresClient({ discipuladores, discipulos, etapas, onCambio }: DiscipuladoresClientProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [crearOpen, setCrearOpen] = useState(false);
  const [editar, setEditar] = useState<Profile | null>(null);
  const [asignarOpen, setAsignarOpen] = useState(false);
  const [asignarId, setAsignarId] = useState("");
  const [desvincular, setDesvincular] = useState<Discipulo | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [listaReducida, setListaReducida] = useState(false);

  const selected = useMemo(
    () => discipuladores.find((p) => p.id === selectedId) || null,
    [discipuladores, selectedId]
  );

  const discipulosDe = useMemo(
    () => (selected ? discipulos.filter((d) => d.lider_id === selected.id) : []),
    [discipulos, selected]
  );

  const discipulosDisponibles = useMemo(
    () => (selected ? discipulos.filter((d) => d.lider_id !== selected.id) : []),
    [discipulos, selected]
  );

  const filtered = discipuladores.filter((p) =>
    `${p.nombre} ${p.apellido} ${p.email || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleAsignar = async () => {
    if (!selected || !asignarId || busy) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("discipulos")
      .update({ lider_id: selected.id })
      .eq("id", asignarId);
    setBusy(false);
    if (error) {
      toast.error("Error al asignar el discípulo");
      return;
    }
    toast.success("Discípulo asignado");
    setAsignarOpen(false);
    setAsignarId("");
    onCambio?.();
  };

  const handleDesvincular = async () => {
    if (!desvincular || busy) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("discipulos")
      .update({ lider_id: null })
      .eq("id", desvincular.id);
    setBusy(false);
    if (error) {
      toast.error("Error al desvincular el discípulo");
      return;
    }
    toast.success("Discípulo desvinculado");
    setDesvincular(null);
    onCambio?.();
  };

  const toggleSeleccion = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const todosSeleccionados = filtered.length > 0 && filtered.every((p) => selectedIds.includes(p.id));

  const toggleTodos = () => {
    const ids = new Set(filtered.map((p) => p.id));
    setSelectedIds((prev) =>
      todosSeleccionados ? prev.filter((id) => !ids.has(id)) : [...new Set([...prev, ...ids])]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length || bulkDeleting) return;
    setBulkDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("eliminar_discipuladores", { p_ids: selectedIds });
    setBulkDeleting(false);
    if (error) {
      toast.error(`Error al eliminar: ${error.message}`);
      return;
    }
    toast.success(`${selectedIds.length} discipulador(es) eliminado(s)`);
    setBulkDeleteOpen(false);
    setSelectedIds([]);
    if (selectedId && selectedIds.includes(selectedId)) setSelectedId(null);
    onCambio?.();
  };

  const exportarSeleccionados = () => {
    const sel = discipuladores.filter((p) => selectedIds.includes(p.id));
    if (sel.length === 0) return;
    const filas = sel.map((p) => ({
      Apellido: p.apellido,
      Nombre: p.nombre,
      Email: p.email || "",
      "Teléfono": p.telefono || "",
      "Fecha nacimiento": p.fecha_nacimiento || "",
      "Don espiritual": p.don_espiritual || "",
      Fortalezas: p.fortalezas || "",
      Debilidades: p.debilidades || "",
      "Discípulos": discipulos.filter((d) => d.lider_id === p.id).length,
    }));
    descargarCSV("discipuladores.csv", filas);
    toast.success(`${sel.length} discipulador(es) exportado(s)`);
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:h-[calc(100vh-8rem)]">
      {/* LEFT PANEL */}
      <div className={cn("w-full lg:shrink-0 flex flex-col gap-4", listaReducida ? "lg:w-[250px]" : "lg:w-[418px]")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">Discipuladores</h1>
            <p className="text-xs text-muted-foreground">{filtered.length} de {discipuladores.length}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setListaReducida((v) => !v)}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted min-h-11 md:min-h-8 gap-1 px-2 text-xs font-medium"
              title={listaReducida ? "Expandir lista" : "Reducir lista"}
              aria-label={listaReducida ? "Expandir lista" : "Reducir lista"}
            >
              {listaReducida ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
            <Button onClick={() => setCrearOpen(true)} className="gap-1 px-2 text-xs font-medium">
              <UserPlus className="h-3.5 w-3.5" />
              Nuevo
            </Button>
          </div>
        </div>

        {!listaReducida && selectedIds.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportarSeleccionados} className="gap-1 px-2 text-xs font-medium">
            <Download className="h-3.5 w-3.5" />
            Exportar
          </Button>
        )}

        {!listaReducida && selectedIds.length > 0 && (
          <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)} className="gap-1 px-2 text-xs font-medium">
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar ({selectedIds.length})
          </Button>
        )}

        {!listaReducida && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Discipulador..."
              className="pl-9 h-11 md:h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-0.5 -mx-1 px-1">
          {!listaReducida && filtered.length > 0 && (
          <div className="flex items-center justify-between px-1 pb-1">
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
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No se encontraron discipuladores</p>
          ) : (
            filtered.map((p) => {
              const count = discipulos.filter((d) => d.lider_id === p.id).length;
              return (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(p.id);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedId === p.id ? "bg-primary/10" : "hover:bg-muted/50"
                  )}
                >
                  {!listaReducida && (
                    <span onClick={(e) => e.stopPropagation()} className="shrink-0 rounded-md p-1 -m-1 hover:bg-primary/10" title="Seleccionar">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSeleccion(p.id)}
                        aria-label="Seleccionar"
                        className="size-4 shrink-0 cursor-pointer accent-primary"
                      />
                    </span>
                  )}
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", getAvatarColor(p.id))}>
                      {iniciales(p) || "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.apellido}, {p.nombre}</p>
                    {!listaReducida && <p className="text-[11px] text-muted-foreground truncate">{p.email || "Sin email"}</p>}
                  </div>
                  {!listaReducida && <Badge variant="secondary" className="shrink-0">{count}</Badge>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 min-w-0 overflow-y-auto @container">
        {selected ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Detalle del discipulador</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditar(selected)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>

            <div className="flex flex-col items-center gap-3 text-center">
              {selected.avatar_url ? (
                <img src={selected.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover ring-4 ring-background shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl ring-4 ring-background shadow-lg">
                  {iniciales(selected) || "?"}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{selected.apellido}, {selected.nombre}</h3>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                  <Badge variant="secondary">Discipulador</Badge>
                  <span className="text-sm text-muted-foreground">{discipulosDe.length} discípulo{discipulosDe.length === 1 ? "" : "s"}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 @sm:grid-cols-2">
              <Card>
                <CardContent className="p-4 flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate break-words">{selected.email || "—"}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="text-sm font-medium truncate break-words">{selected.telefono || "—"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="text-sm font-semibold">Datos personales</h4>
                <div className="grid gap-3 @sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Edad</p>
                    <p className="text-sm font-medium">
                      {selected.fecha_nacimiento ? `${calcularEdad(selected.fecha_nacimiento)} años` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Don espiritual</p>
                    <p className="text-sm font-medium">{selected.don_espiritual || "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fortalezas</p>
                  <p className="text-sm font-medium whitespace-pre-line">{selected.fortalezas || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Debilidades</p>
                  <p className="text-sm font-medium whitespace-pre-line">{selected.debilidades || "—"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold min-w-0 flex-1 truncate">Discípulos vinculados ({discipulosDe.length})</h4>
                  <Button size="sm" variant="outline" onClick={() => setAsignarOpen(true)} className="gap-1 shrink-0">
                    <Link2 className="h-4 w-4" />
                    Asignar discípulo
                  </Button>
                </div>
                {discipulosDe.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Sin discípulos asignados. Usá &quot;Asignar discípulo&quot; para vincular uno.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {discipulosDe.map((d) => (
                      <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className={cn("h-3 w-3 rounded-full shrink-0", estadoColors[d.estado])} />
                        <Link
                          href={`/discipulos/ver?id=${d.id}`}
                          className="flex-1 min-w-0 text-sm font-medium hover:underline truncate"
                        >
                          {d.apellido}, {d.nombre}
                        </Link>
                        <Badge variant="outline" className="shrink-0 hidden sm:inline-flex">
                          {etapas.find((e) => e.id === d.etapa_id)?.nombre || "Sin etapa"}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => setDesvincular(d)}
                          title="Desvincular discípulo"
                          className="shrink-0 text-muted-foreground/50 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Seleccioná un discipulador para ver su información</p>
          </div>
        )}
      </div>

      {/* CREATE DIALOG */}
      <CrearDiscipuladorDialog open={crearOpen} onOpenChange={setCrearOpen} onCreado={() => onCambio?.()} />

      {/* EDIT DIALOG */}
      <EditarDiscipuladorDialog open={!!editar} discipulador={editar} onOpenChange={(o) => { if (!o) setEditar(null); }} onEditado={() => onCambio?.()} />

      {/* ASSIGN DIALOG */}
      <Dialog open={asignarOpen} onOpenChange={(o) => { if (!busy) setAsignarOpen(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar discípulo</DialogTitle>
            <DialogDescription>
              Elegí un discípulo para vincularlo con {selected?.nombre} {selected?.apellido}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Select value={asignarId || undefined} onValueChange={(v) => setAsignarId(v?.toString() ?? "")} items={discipulosDisponibles.map((d) => ({ value: d.id, label: `${d.apellido}, ${d.nombre}` }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar discípulo" /></SelectTrigger>
              <SelectContent>
                {discipulosDisponibles.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.apellido}, {d.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {discipulosDisponibles.length === 0 && (
              <p className="text-sm text-muted-foreground">Todos los discípulos ya están asignados.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAsignarOpen(false)} disabled={busy}>Cancelar</Button>
            <Button onClick={handleAsignar} disabled={busy || !asignarId}>
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UNLINK CONFIRM DIALOG */}
      <Dialog open={!!desvincular} onOpenChange={() => setDesvincular(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desvincular discípulo</DialogTitle>
            <DialogDescription>
              ¿Desvincular a {desvincular?.apellido}, {desvincular?.nombre} de {selected?.nombre} {selected?.apellido}?
              El discípulo quedará sin discipulador asignado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesvincular(null)} disabled={busy}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDesvincular} disabled={busy}>Desvincular</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BULK DELETE DIALOG */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar discipuladores</DialogTitle>
            <DialogDescription>
              ¿Eliminar {selectedIds.length} discipulador(es) seleccionado(s)? Se desvincularán sus discípulos y se
              borrarán sus seguimientos, encuentros, oraciones y tareas. Esta acción no se puede deshacer.
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
