"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UserPlus, Users, CheckCircle2, AlertTriangle, Clock, ArrowRight, Search, LayoutGrid, List, GripVertical, Pencil, Trash2, Download } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { descargarCSV } from "@/lib/csv";
import { getMiembroColor } from "@/lib/discipulo-color";
import { estadosMeta, eventosEvangelismo, actosServicio } from "./tipos-estados";
import type { PersonaData, EventoData } from "./tipos-estados";
import { ObservacionInput } from "./observacion-input";

export default function EvangelismoPage() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [miembros, setMiembros] = useState<Array<{ id: string; nombre: string; apellido: string }>>([]);
  const [personas, setPersonas] = useState<PersonaData[]>([]);
  const [eventos, setEventos] = useState<EventoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"lista" | "kanban">("lista");
  const [search, setSearch] = useState("");

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [nuevaPersona, setNuevaPersona] = useState({ miembro_id: "", nombre: "", apellido: "", telefono: "", edad: "", observaciones: "" });
  const [selectedPersona, setSelectedPersona] = useState<PersonaData | null>(null);

  const [dragItem, setDragItem] = useState<PersonaData | null>(null);
  const [showConfirmAvanzar, setShowConfirmAvanzar] = useState<{ persona: PersonaData; nuevoEstado: string } | null>(null);
  const [estadoDropdownOpen, setEstadoDropdownOpen] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<PersonaData | null>(null);
  const [editPersonaForm, setEditPersonaForm] = useState({ nombre: "", apellido: "", telefono: "", edad: "", observaciones: "", estado: "oracion_salvacion" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    Promise.all([
      supabase.from("miembros").select("*, etapas:etapa_id(*)").neq("estado", "eliminado").order("apellido"),
      supabase.from("acompanamiento_evangelistico").select("*").order("fecha_inicio_estado", { ascending: false }),
      supabase.from("eventos_evangelismo").select("*").order("fecha", { ascending: false }),
    ]).then(([dRes, pRes, eRes]) => {
      setMiembros(dRes.data || []);
      setPersonas((pRes.data || []) as PersonaData[]);
      setEventos((eRes.data || []) as EventoData[]);
      setLoading(false);
    }).catch(console.error);
  }, [supabase]);

  const filteredPersonas = personas.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (!`${p.nombre} ${p.apellido}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const getEventos = useCallback((personaId: string) => eventos.filter((e) => e.persona_id === personaId).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()), [eventos]);

  const diasEnEstado = useCallback((p: PersonaData) => differenceInDays(new Date(), new Date(p.fecha_inicio_estado)), []);
  const progresoEstado = useCallback((p: PersonaData) => Math.min(100, Math.round((diasEnEstado(p) / 30) * 100)), [diasEnEstado]);

  const alertas = personas.filter((p) => diasEnEstado(p) >= 30);

  const counts = {
    oracion_salvacion: personas.filter((p) => p.estado === "oracion_salvacion").length,
    actos_servicio: personas.filter((p) => p.estado === "actos_servicio").length,
    predicacion_evangelio: personas.filter((p) => p.estado === "predicacion_evangelio").length,
  };

  const handleAddPersona = async () => {
    if (!user || !nuevaPersona.nombre.trim() || !nuevaPersona.apellido.trim()) return;
    const { error } = await supabase.from("acompanamiento_evangelistico").insert({
      miembro_id: nuevaPersona.miembro_id || null,
      creado_por: user.id,
      nombre: nuevaPersona.nombre.trim(),
      apellido: nuevaPersona.apellido.trim(),
      telefono: nuevaPersona.telefono || null,
      edad: nuevaPersona.edad ? parseInt(nuevaPersona.edad) : null,
      observaciones: nuevaPersona.observaciones || null,
      estado: "oracion_salvacion",
    });
    if (error) { toast.error("Error al agregar: " + error.message); console.error("INSERT ERROR", JSON.stringify(error, null, 2)); return; }

    setShowAddDialog(false);
    setNuevaPersona({ miembro_id: "", nombre: "", apellido: "", telefono: "", edad: "", observaciones: "" });
    toast.success("Persona agregada");

    // Refetch list
    const { data } = await supabase.from("acompanamiento_evangelistico").select("*").order("fecha_inicio_estado", { ascending: false });
    if (data) { setPersonas(data); }
  };

  const handleCambiarEstado = async (personaId: string, nuevoEstado: string) => {
    const p = personas.find((x) => x.id === personaId);
    if (!p) return;

    const dias = diasEnEstado(p);
    if (dias < 30) {
      setShowConfirmAvanzar({ persona: p, nuevoEstado });
      return;
    }

    await ejecutarCambioEstado(p, nuevoEstado);
  };

  const ejecutarCambioEstado = async (p: PersonaData, nuevoEstado: string) => {
    const labelNuevo = estadosMeta[nuevoEstado]?.label || nuevoEstado;
    const { error: updateErr } = await supabase.from("acompanamiento_evangelistico")
      .update({ estado: nuevoEstado, fecha_inicio_estado: format(new Date(), "yyyy-MM-dd") })
      .eq("id", p.id);
    if (updateErr) { toast.error("Error al cambiar el estado"); return; }
    const { error: insertErr } = await supabase.from("eventos_evangelismo").insert({
      persona_id: p.id, tipo: "cambio_estado",
      descripcion: `Cambio a ${labelNuevo}.`,
    });
    if (insertErr) { toast.error("Error al registrar el cambio"); return; }

    setPersonas((prev) => prev.map((x) => x.id === p.id ? { ...x, estado: nuevoEstado, fecha_inicio_estado: format(new Date(), "yyyy-MM-dd") } : x));
    toast.success(`Avanzó a ${labelNuevo}`);
  };

  const handleRegistrarEvento = async (personaId: string, tipo: string, descripcion: string) => {
    const { error } = await supabase.from("eventos_evangelismo").insert({ persona_id: personaId, tipo, descripcion, fecha: format(new Date(), "yyyy-MM-dd") });
    if (error) { toast.error("Error al registrar el evento"); return; }
    const { data } = await supabase.from("eventos_evangelismo").select("*").order("fecha", { ascending: false });
    if (data) setEventos(data);
    toast.success("Evento registrado");
  };

  const handleDragStart = (persona: PersonaData) => setDragItem(persona);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (nuevoEstado: string) => {
    if (!dragItem) return;
    await handleCambiarEstado(dragItem.id, nuevoEstado);
    setDragItem(null);
  };

  const handleEditarPersona = async () => {
    if (!showEditDialog || !editPersonaForm.nombre.trim() || !editPersonaForm.apellido.trim()) return;
    const { error } = await supabase.from("acompanamiento_evangelistico").update({
      nombre: editPersonaForm.nombre.trim(), apellido: editPersonaForm.apellido.trim(),
      telefono: editPersonaForm.telefono || null, edad: editPersonaForm.edad ? parseInt(editPersonaForm.edad) : null,
      observaciones: editPersonaForm.observaciones || null, estado: editPersonaForm.estado,
    }).eq("id", showEditDialog.id);
    if (error) { toast.error("Error al actualizar la persona"); return; }
    setPersonas((prev) => prev.map((x) => x.id === showEditDialog.id ? { ...x, ...editPersonaForm, edad: editPersonaForm.edad ? parseInt(editPersonaForm.edad) : undefined } : x));
    setShowEditDialog(null);
    toast.success("Persona actualizada");
  };

  const [showConfirmEliminar, setShowConfirmEliminar] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSeleccion = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const todosSeleccionados = filteredPersonas.length > 0 && filteredPersonas.every((p) => selectedIds.includes(p.id));

  const toggleTodos = () => {
    const ids = new Set(filteredPersonas.map((p) => p.id));
    setSelectedIds((prev) =>
      todosSeleccionados ? prev.filter((id) => !ids.has(id)) : [...new Set([...prev, ...ids])]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length || bulkDeleting) return;
    setBulkDeleting(true);
    const { error } = await supabase.from("acompanamiento_evangelistico").delete().in("id", selectedIds);
    if (!error) {
      const { data: evData } = await supabase.from("eventos_evangelismo").select("*").order("fecha", { ascending: false });
      if (evData) setEventos(evData);
    }
    setBulkDeleting(false);
    if (error) {
      toast.error(`Error al eliminar: ${error.message}`);
      return;
    }
    setPersonas((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
    setBulkDeleteOpen(false);
    setSelectedIds([]);
    setSelectedPersona(null);
    toast.success(`${selectedIds.length} persona(s) eliminada(s)`);
  };

  const exportarSeleccionados = () => {
    const sel = personas.filter((p) => selectedIds.includes(p.id));
    if (sel.length === 0) return;
    const filas = sel.map((p) => {
      const d = miembros.find((x) => x.id === p.miembro_id);
      return {
        Nombre: p.nombre,
        Apellido: p.apellido,
        "Teléfono": p.telefono || "",
        "Edad": p.edad?.toString() || "",
        "Estado": estadosMeta[p.estado]?.label || p.estado,
        "Días en estado": diasEnEstado(p),
        "Observaciones": p.observaciones || "",
        "Miembro que ora": d ? `${d.nombre} ${d.apellido}` : "",
      };
    });
    descargarCSV("evangelismo.csv", filas);
    toast.success(`${sel.length} persona(s) exportada(s)`);
  };

  const handleEliminarPersona = async (id: string) => {
    setShowConfirmEliminar(id);
  };

  const ejecutarEliminarPersona = async () => {
    if (!showConfirmEliminar) return;
    const { error } = await supabase.from("acompanamiento_evangelistico").delete().eq("id", showConfirmEliminar);
    if (error) { toast.error("Error al eliminar la persona"); return; }
    setPersonas((prev) => prev.filter((x) => x.id !== showConfirmEliminar));
    setSelectedPersona(null);
    setShowConfirmEliminar(null);
    toast.success("Persona eliminada");
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Acompañamiento Evangelístico</h1>
          <p className="text-xs text-muted-foreground">Seguimiento de personas en el proceso de evangelismo</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filteredPersonas.length > 0 && (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
              <Checkbox checked={todosSeleccionados} onCheckedChange={toggleTodos} aria-label="Seleccionar todos" />
              Todos
            </label>
          )}
          {selectedIds.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportarSeleccionados}>
              <Download className="h-4 w-4 mr-1" /> Exportar
            </Button>
          )}
          {selectedIds.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" /> Eliminar ({selectedIds.length})
            </Button>
          )}
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <UserPlus className="h-4 w-4 mr-1" /> Agregar persona
          </Button>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {Object.entries(estadosMeta).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <Card key={key} className={cn(meta.bgColor, "border-0")}>
              <CardContent className="p-3 flex items-center gap-3">
                <Icon className={cn("h-6 w-6", meta.color)} />
                <div className="min-w-0">
                  <p className="text-lg font-bold">{counts[key as keyof typeof counts]}</p>
                  <p className={cn("text-xs font-medium", meta.color)}>{meta.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ALERTAS */}
      {alertas.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3 w-3" /> Alertas automáticas</p>
            {alertas.map((a) => {
              const msj = a.estado === "oracion_salvacion"
                ? "Ya finalizó el tiempo de oración. Se recomienda comenzar con actos de servicio."
                : a.estado === "actos_servicio"
                ? "Ya finalizó la etapa de servicio. Se recomienda compartir el Evangelio."
                : "Persona lista para siguiente etapa.";
              return (
                <div key={a.id} className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{a.nombre} {a.apellido}</p>
                    <p className="text-xs text-muted-foreground">{msj}</p>
                  </div>
                  <Button size="sm" variant="outline" className="min-h-11 md:min-h-8 text-xs" onClick={() => handleCambiarEstado(a.id, a.estado === "oracion_salvacion" ? "actos_servicio" : "predicacion_evangelio")}>
                    Avanzar <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* FILTROS + VIEW TOGGLE */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8 h-11 md:h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {["lista", "kanban"].map((v) => (
            <button key={v} type="button" onClick={() => setViewMode(v as "lista" | "kanban")}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === v ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >{v === "lista" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}</button>
          ))}
        </div>
      </div>

      {/* LISTA VIEW */}
      {viewMode === "lista" && (
        <div className="space-y-2">
          {filteredPersonas.length === 0 ? null : filteredPersonas.map((p) => {
            const meta = estadosMeta[p.estado];
            const Icon = meta?.icon || Users;
            const dias = diasEnEstado(p);
            const prog = progresoEstado(p);
            return (
              <Card key={p.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedPersona(p)}>
                <CardContent className="p-3 flex items-center gap-3">
                  <span onClick={(e) => e.stopPropagation()} className="shrink-0 rounded-md p-1 -m-1 hover:bg-primary/10" title="Seleccionar">
                    <Checkbox checked={selectedIds.includes(p.id)} onCheckedChange={() => toggleSeleccion(p.id)} aria-label="Seleccionar" />
                  </span>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", meta?.bgColor)}>
                    <Icon className={cn("h-4 w-4", meta?.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{p.nombre} {p.apellido}</p>
                      {(() => { const d = miembros.find((x) => x.id === p.miembro_id); if (!d) return null; const c = getMiembroColor(d.id); return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ color: c.fg, backgroundColor: c.bg }}>contacto de {d.nombre}</span>; })()}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[200px]">
                        <div className={cn("h-full rounded-full transition-all", prog >= 100 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${prog}%` }} />
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{dias}/30 días</span>
                    </div>
                    {p.observaciones && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{p.observaciones}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="relative">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setEstadoDropdownOpen(estadoDropdownOpen === p.id ? null : p.id); }}
                        className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors min-w-0", meta?.bgColor, meta?.color)}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="inline-block truncate max-w-[4.5rem] sm:max-w-none">{meta?.label}</span>
                      </button>
                      {estadoDropdownOpen === p.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-lg shadow-lg p-1 min-w-[140px] sm:min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                          {Object.entries(estadosMeta).map(([key, m]) => {
                            const ItemIcon = m.icon;
                            return (
                              <button key={key} type="button" onClick={() => { setEstadoDropdownOpen(null); if (key !== p.estado) handleCambiarEstado(p.id, key); }}
                                className={cn("flex w-full items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors", key === p.estado ? "bg-muted font-semibold" : "hover:bg-muted/50")}
                              >
                                <ItemIcon className="h-3.5 w-3.5" />
                                {m.label}
                                {key === p.estado && <CheckCircle2 className="h-3 w-3 ml-auto text-emerald-500" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <span className="flex items-center gap-0.5 border-l border-muted pl-1.5 ml-0.5">
                      <button type="button" aria-label={`Editar ${p.nombre} ${p.apellido}`} onClick={(e) => { e.stopPropagation(); setEditPersonaForm({ nombre: p.nombre, apellido: p.apellido, telefono: p.telefono || "", edad: p.edad?.toString() || "", observaciones: p.observaciones || "", estado: p.estado }); setShowEditDialog(p); }} className="text-blue-400 hover:text-blue-600 p-1.5 -m-0.5 rounded min-h-9 min-w-9 flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
                      <button type="button" aria-label={`Eliminar ${p.nombre} ${p.apellido}`} onClick={(e) => { e.stopPropagation(); handleEliminarPersona(p.id); }} className="text-red-400 hover:text-red-600 p-1.5 -m-0.5 rounded min-h-9 min-w-9 flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === "kanban" && (
        <div className="grid gap-3 sm:grid-cols-3">
          {["oracion_salvacion", "actos_servicio", "predicacion_evangelio"].map((estado) => {
            const meta = estadosMeta[estado];
            const Icon = meta?.icon || Users;
            const items = filteredPersonas.filter((p) => p.estado === estado);
            return (
              <div key={estado} className={cn("rounded-xl p-3 min-h-[300px]", meta?.bgColor)}
                onDragOver={handleDragOver} onDrop={() => handleDrop(estado)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={cn("h-4 w-4", meta?.color)} />
                  <span className={cn("text-sm font-semibold", meta?.color)}>{meta?.label}</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sin personas</p>}
                  {items.map((p) => {
                    const dias = diasEnEstado(p);
                    const prog = progresoEstado(p);
                    return (
                      <div key={p.id} className="bg-background rounded-lg p-2.5 shadow-sm cursor-grab active:cursor-grabbing"
                        draggable onDragStart={() => handleDragStart(p)} onClick={() => setSelectedPersona(p)}
                      >
                        <div className="flex items-center gap-1">
                          <span onClick={(e) => e.stopPropagation()} className="shrink-0 p-1 -ml-0.5 hover:bg-primary/10 rounded min-h-9 min-w-9 flex items-center justify-center" title="Seleccionar">
                            <Checkbox checked={selectedIds.includes(p.id)} onCheckedChange={() => toggleSeleccion(p.id)} aria-label="Seleccionar" className="h-4 w-4" />
                          </span>
                          <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                          <p className="text-xs font-medium truncate flex-1">{p.nombre} {p.apellido}</p>
                          {(() => { const d = miembros.find((x) => x.id === p.miembro_id); if (!d) return null; const c = getMiembroColor(d.id); return <span className="text-[9px] px-1 py-0.5 rounded-full hidden sm:inline font-medium" style={{ color: c.fg, backgroundColor: c.bg }}>{d.nombre}</span>; })()}
                          <Badge variant="outline" className="text-[10px] px-1">{dias}/30d</Badge>
                          <button type="button" aria-label={`Editar ${p.nombre} ${p.apellido}`} onClick={(e) => { e.stopPropagation(); setEditPersonaForm({ nombre: p.nombre, apellido: p.apellido, telefono: p.telefono || "", edad: p.edad?.toString() || "", observaciones: p.observaciones || "", estado: p.estado }); setShowEditDialog(p); }} className="text-blue-400 hover:text-blue-600 p-1 -m-0.5 rounded min-h-9 min-w-9 flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button>
                          <button type="button" aria-label={`Eliminar ${p.nombre} ${p.apellido}`} onClick={(e) => { e.stopPropagation(); handleEliminarPersona(p.id); }} className="text-red-400 hover:text-red-600 p-1 -m-0.5 rounded min-h-9 min-w-9 flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", prog >= 100 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${prog}%` }} />
                        </div>
                        {dias >= 30 && <p className="text-[10px] text-amber-500 mt-1">⚠ Listo para avanzar</p>}
                        {p.observaciones && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{p.observaciones}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DIALOG: AGREGAR PERSONA */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva persona</DialogTitle><DialogDescription>Agregá una persona para comenzar el acompañamiento</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Nombre *</Label>
                <Input className="h-11 md:h-8 text-sm" value={nuevaPersona.nombre} onChange={(e) => setNuevaPersona((p) => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Apellido *</Label>
                <Input className="h-11 md:h-8 text-sm" value={nuevaPersona.apellido} onChange={(e) => setNuevaPersona((p) => ({ ...p, apellido: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Teléfono</Label>
                <Input className="h-11 md:h-8 text-sm" value={nuevaPersona.telefono} onChange={(e) => setNuevaPersona((p) => ({ ...p, telefono: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Edad</Label>
                <Input type="number" className="h-11 md:h-8 text-sm" value={nuevaPersona.edad} onChange={(e) => setNuevaPersona((p) => ({ ...p, edad: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Miembro que ora (opcional)</Label>
              <select className="w-full h-11 md:h-8 rounded-lg border border-input bg-transparent px-3 text-sm" value={nuevaPersona.miembro_id} onChange={(e) => setNuevaPersona((p) => ({ ...p, miembro_id: e.target.value }))}>
                <option value="">Yo mismo (líder)</option>
                {miembros.map((d) => <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Observaciones</Label>
              <Textarea rows={2} className="text-sm" value={nuevaPersona.observaciones} onChange={(e) => setNuevaPersona((p) => ({ ...p, observaciones: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddPersona} disabled={!nuevaPersona.nombre.trim() || !nuevaPersona.apellido.trim()}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: DETALLE DE PERSONA */}
      <Dialog open={!!selectedPersona} onOpenChange={(open) => { if (!open) setSelectedPersona(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          {selectedPersona && (() => {
            const p = selectedPersona;
            const meta = estadosMeta[p.estado];
            const Icon = meta?.icon || Users;
            const dias = diasEnEstado(p);
            const prog = progresoEstado(p);
            const evts = getEventos(p.id);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", meta?.bgColor)}>
                      <Icon className={cn("h-4 w-4", meta?.color)} />
                    </div>
                    {p.nombre} {p.apellido}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* INFO */}
                  <div className="grid grid-cols-2 gap-2 text-sm min-w-0 break-words">
                    {p.telefono && <div><span className="text-xs text-muted-foreground">Teléfono:</span> <p>{p.telefono}</p></div>}
                    {p.edad && <div><span className="text-xs text-muted-foreground">Edad:</span> <p>{p.edad} años</p></div>}
                    <div><span className="text-xs text-muted-foreground">Estado:</span> <Badge variant="outline">{meta?.label}</Badge></div>
                    {p.fecha_creacion && <div><span className="text-xs text-muted-foreground">Agregado:</span> <p>{format(new Date(p.fecha_creacion), "dd/MM/yyyy")}</p></div>}
                    {(() => { const d = miembros.find((x) => x.id === p.miembro_id); if (!d) return null; const c = getMiembroColor(d.id); return <div className="col-span-2"><span className="text-xs text-muted-foreground">Contacto de:</span> <p className="font-medium" style={{ color: c.fg }}>{d.nombre} {d.apellido}</p></div>; })()}
                    {p.observaciones && <div className="col-span-2"><span className="text-xs text-muted-foreground">Observaciones:</span> <p className="text-sm">{p.observaciones}</p></div>}
                  </div>

                  {/* PROGRESS BAR */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progreso en {meta?.label}</span>
                      <span className="font-medium">{dias}/30 días</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", prog >= 100 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${prog}%` }} />
                    </div>
                    {prog >= 100 && <p className="text-xs text-amber-500 mt-1">✓ Tiempo cumplido. Recomendación: avanzar de etapa.</p>}
                  </div>

                  {/* PROGRESO GENERAL */}
                  <div className="space-y-1 text-xs">
                    {["oracion_salvacion", "actos_servicio", "predicacion_evangelio"].map((est) => {
                      const m = estadosMeta[est];
                      const estados = ["oracion_salvacion", "actos_servicio", "predicacion_evangelio"];
                      const completado = estados.indexOf(est) < estados.indexOf(p.estado);
                      const activo = p.estado === est;
                      return (
                        <div key={est} className="flex items-center gap-2">
                          {completado && !activo ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : activo ? <Clock className="h-3 w-3 text-amber-500" /> : <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30" />}
                          <span className={completado && !activo ? "text-muted-foreground line-through" : activo ? "font-medium" : "text-muted-foreground"}>{m?.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ACCIONES */}
                  <div className="flex gap-2">
                    {p.estado === "oracion_salvacion" && <Button size="sm" className="flex-1" onClick={() => { handleCambiarEstado(p.id, "actos_servicio"); setSelectedPersona(null); }}>Actos de servicio <ArrowRight className="h-3 w-3 ml-1" /></Button>}
                    {p.estado === "actos_servicio" && <><Button size="sm" variant="outline" onClick={() => { handleCambiarEstado(p.id, "oracion_salvacion"); setSelectedPersona(null); }} className="px-2">←</Button><Button size="sm" className="flex-1" onClick={() => { handleCambiarEstado(p.id, "predicacion_evangelio"); setSelectedPersona(null); }}>Predicar Evangelio <ArrowRight className="h-3 w-3 ml-1" /></Button></>}
                    {p.estado === "predicacion_evangelio" && <><Button size="sm" variant="outline" onClick={() => { handleCambiarEstado(p.id, "actos_servicio"); setSelectedPersona(null); }} className="px-2">←</Button></>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditPersonaForm({ nombre: p.nombre, apellido: p.apellido, telefono: p.telefono || "", edad: p.edad?.toString() || "", observaciones: p.observaciones || "", estado: p.estado }); setShowEditDialog(p); }}>Editar</Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleEliminarPersona(p.id)}>Eliminar</Button>
                  </div>

                  {/* REGISTRAR ACCIONES */}
                  {p.estado === "actos_servicio" && (
                    <details>
                      <summary className="text-xs font-medium cursor-pointer text-muted-foreground">Registrar acto de servicio</summary>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {actosServicio.map((acto) => (
                          <button key={acto} type="button" onClick={() => handleRegistrarEvento(p.id, "acto_servicio", acto)}
                            className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          >{acto}</button>
                        ))}
                        <ObservacionInput personaId={p.id} onRegistrar={handleRegistrarEvento} />
                      </div>
                    </details>
                  )}

                  {p.estado === "predicacion_evangelio" && (
                    <details>
                      <summary className="text-xs font-medium cursor-pointer text-muted-foreground">Registrar evento de evangelismo</summary>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {eventosEvangelismo.map((evt) => (
                          <button key={evt} type="button" onClick={() => handleRegistrarEvento(p.id, "evento_evangelismo", evt)}
                            className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          >{evt}</button>
                        ))}
                        <ObservacionInput personaId={p.id} onRegistrar={handleRegistrarEvento} />
                      </div>
                    </details>
                  )}

                  <details>
                    <summary className="text-xs font-medium cursor-pointer text-muted-foreground">Agregar observación</summary>
                    <div className="mt-2">
                      <ObservacionInput personaId={p.id} onRegistrar={handleRegistrarEvento} labelOnly />
                    </div>
                  </details>

                  {/* HISTORIAL */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Historial</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {evts.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sin eventos</p>
                      ) : evts.map((ev) => (
                        <div key={ev.id} className="border-l-2 border-muted pl-3 py-0.5">
                          <p className="text-xs">{ev.descripcion}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(ev.fecha), "dd/MM/yyyy")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* CONFIRM AVANZAR DIALOG */}
      <Dialog open={!!showConfirmAvanzar} onOpenChange={(o) => { if (!o) setShowConfirmAvanzar(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Avanzar de etapa?</DialogTitle></DialogHeader>
          {showConfirmAvanzar && (
            <p className="text-sm text-muted-foreground">
              Solo lleva {diasEnEstado(showConfirmAvanzar.persona)} días en {estadosMeta[showConfirmAvanzar.persona.estado]?.label || "el estado actual"}. ¿Desea avanzar igual?
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmAvanzar(null)}>Cancelar</Button>
            <Button onClick={async () => { if (showConfirmAvanzar) { await ejecutarCambioEstado(showConfirmAvanzar.persona, showConfirmAvanzar.nuevoEstado); setShowConfirmAvanzar(null); } }}>Avanzar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={!!showEditDialog} onOpenChange={(o) => { if (!o) setShowEditDialog(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar persona</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Nombre *</Label><Input className="h-11 md:h-8 text-sm" value={editPersonaForm.nombre} onChange={(e) => setEditPersonaForm((f) => ({ ...f, nombre: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Apellido *</Label><Input className="h-11 md:h-8 text-sm" value={editPersonaForm.apellido} onChange={(e) => setEditPersonaForm((f) => ({ ...f, apellido: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Teléfono</Label><Input className="h-11 md:h-8 text-sm" value={editPersonaForm.telefono} onChange={(e) => setEditPersonaForm((f) => ({ ...f, telefono: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Edad</Label><Input type="number" className="h-11 md:h-8 text-sm" value={editPersonaForm.edad} onChange={(e) => setEditPersonaForm((f) => ({ ...f, edad: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Observaciones</Label><Textarea rows={2} className="text-sm" value={editPersonaForm.observaciones} onChange={(e) => setEditPersonaForm((f) => ({ ...f, observaciones: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">Estado</Label>
              <div className="flex flex-wrap gap-1">
                {Object.entries(estadosMeta).map(([key, m]) => {
                  const ItemIcon = m.icon;
                  return (
                    <button key={key} type="button" onClick={() => setEditPersonaForm((f) => ({ ...f, estado: key }))}
                      className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors", editPersonaForm.estado === key ? m.bgColor : "bg-background")}
                    ><ItemIcon className="h-3.5 w-3.5" />{m.label}</button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(null)}>Cancelar</Button>
            <Button onClick={handleEditarPersona}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRM ELIMINAR DIALOG */}
      <Dialog open={!!showConfirmEliminar} onOpenChange={(o) => { if (!o) setShowConfirmEliminar(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar persona?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmEliminar(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={ejecutarEliminarPersona}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BULK DELETE DIALOG */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Eliminar personas</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar {selectedIds.length} persona(s) seleccionada(s)? Esta acción no se puede deshacer.
          </p>
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
