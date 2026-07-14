"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Users, Heart, Hand, Book, CheckCircle2, AlertTriangle, Clock, ArrowRight, Plus, Search, LayoutGrid, List, GripVertical } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const estadosMeta: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  oracion: { label: "Oración", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/40", icon: Heart },
  servicio: { label: "Servicio", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/40", icon: Hand },
  evangelismo: { label: "Evangelismo", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/40", icon: Book },
  completado: { label: "Completado", color: "text-green-600", bgColor: "bg-green-100", icon: CheckCircle2 },
};

const eventosEvangelismo = [
  "Compartí mi testimonio",
  "Compartí el Evangelio",
  "Lo invité a la iglesia",
  "Asistió",
  "Aceptó una Biblia",
  "Hicimos seguimiento",
  "Decidió seguir a Cristo",
  "No mostró interés",
  "Continuar orando",
];

const actosServicio = [
  "Invitarlo a tomar un café",
  "Ayudarlo en una necesidad",
  "Visitarlo",
  "Compartir tiempo",
  "Escucharlo",
  "Acompañarlo",
];

export default function EvangelismoPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [discipulos, setDiscipulos] = useState<any[]>([]);
  const [personas, setPersonas] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"lista" | "kanban">("lista");
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("");

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [nuevaPersona, setNuevaPersona] = useState({ discipulo_id: "", nombre: "", apellido: "", telefono: "", edad: "", observaciones: "" });
  const [showDetailDialog, setShowDetailDialog] = useState<any>(null);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);

  const [dragItem, setDragItem] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    Promise.all([
      supabase.from("discipulos").select("*, etapas:etapa_id(*)").order("apellido"),
      supabase.from("acompanamiento_evangelistico").select("*").order("fecha_inicio_estado", { ascending: false }),
      supabase.from("eventos_evangelismo").select("*").order("fecha", { ascending: false }),
    ]).then(([dRes, pRes, eRes]) => {
      setDiscipulos(dRes.data || []);
      setPersonas(pRes.data || []);
      setEventos(eRes.data || []);
      setLoading(false);
    });
  }, []);

  const filteredPersonas = personas.filter((p) => {
    if (filterEstado && p.estado !== filterEstado) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${p.nombre} ${p.apellido}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const getEventos = useCallback((personaId: string) => eventos.filter((e) => e.persona_id === personaId).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()), [eventos]);

  const diasEnEstado = useCallback((p: any) => differenceInDays(new Date(), new Date(p.fecha_inicio_estado)), []);
  const progresoEstado = useCallback((p: any) => Math.min(100, Math.round((diasEnEstado(p) / 30) * 100)), [diasEnEstado]);

  const alertas = personas.filter((p) => diasEnEstado(p) >= 30).filter((p) => p.estado !== "completado");

  const counts = {
    oracion: personas.filter((p) => p.estado === "oracion").length,
    servicio: personas.filter((p) => p.estado === "servicio").length,
    evangelismo: personas.filter((p) => p.estado === "evangelismo").length,
    completado: personas.filter((p) => p.estado === "completado").length,
  };

  const handleAddPersona = async () => {
    if (!user || !nuevaPersona.nombre.trim() || !nuevaPersona.apellido.trim()) return;
    const { data, error } = await supabase.from("acompanamiento_evangelistico").insert({
      discipulo_id: nuevaPersona.discipulo_id || user.id,
      creado_por: user.id,
      nombre: nuevaPersona.nombre.trim(),
      apellido: nuevaPersona.apellido.trim(),
      telefono: nuevaPersona.telefono || null,
      edad: nuevaPersona.edad ? parseInt(nuevaPersona.edad) : null,
      observaciones: nuevaPersona.observaciones || null,
      estado: "oracion",
    }).select().single();
    if (error) { toast.error("Error al agregar"); return; }

    await supabase.from("eventos_evangelismo").insert({
      persona_id: data.id,
      tipo: "cambio_estado",
      descripcion: "Se agregó al seguimiento. Estado: Oración",
    });

    setPersonas((prev) => [data, ...prev]);
    setShowAddDialog(false);
    setNuevaPersona({ discipulo_id: "", nombre: "", apellido: "", telefono: "", edad: "", observaciones: "" });
    toast.success("Persona agregada");
  };

  const handleCambiarEstado = async (personaId: string, nuevoEstado: string) => {
    const p = personas.find((x) => x.id === personaId);
    if (!p) return;

    const dias = diasEnEstado(p);
    if (dias < 30) {
      const confirmar = window.confirm(`Solo llevan ${dias} días en ${estadosMeta[p.estado]?.label}. ¿Desea avanzar igual?`);
      if (!confirmar) return;
    }

    const labelNuevo = estadosMeta[nuevoEstado]?.label || nuevoEstado;
    await supabase.from("acompanamiento_evangelistico").update({ estado: nuevoEstado, fecha_inicio_estado: format(new Date(), "yyyy-MM-dd") }).eq("id", personaId);
    await supabase.from("eventos_evangelismo").insert({
      persona_id: personaId, tipo: "cambio_estado",
      descripcion: `Cambio a ${labelNuevo}.`,
    });

    setPersonas((prev) => prev.map((x) => x.id === personaId ? { ...x, estado: nuevoEstado, fecha_inicio_estado: format(new Date(), "yyyy-MM-dd") } : x));
    toast.success(`Avanzó a ${labelNuevo}`);
  };

  const handleRegistrarEvento = async (personaId: string, tipo: string, descripcion: string) => {
    await supabase.from("eventos_evangelismo").insert({ persona_id: personaId, tipo, descripcion, fecha: format(new Date(), "yyyy-MM-dd") });
    const { data } = await supabase.from("eventos_evangelismo").select("*").order("fecha", { ascending: false });
    if (data) setEventos(data);
    toast.success("Evento registrado");
  };

  const handleDragStart = (persona: any) => setDragItem(persona);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (nuevoEstado: string) => {
    if (!dragItem) return;
    await handleCambiarEstado(dragItem.id, nuevoEstado);
    setDragItem(null);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Acompañamiento Evangelístico</h1>
          <p className="text-xs text-muted-foreground">Seguimiento de personas en el proceso de evangelismo</p>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <UserPlus className="h-4 w-4 mr-1" /> Agregar persona
        </Button>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {Object.entries(estadosMeta).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <Card key={key} className={cn(meta.bgColor, "border-0")}>
              <CardContent className="p-3 flex items-center gap-3">
                <Icon className={cn("h-6 w-6", meta.color)} />
                <div>
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
              const meta = estadosMeta[a.estado];
              const siguiente = a.estado === "oracion" ? "Servicio" : a.estado === "servicio" ? "Evangelismo" : "Completado";
              const msj = a.estado === "oracion"
                ? "Ya finalizó el tiempo de oración. Se recomienda comenzar la etapa de Servicio."
                : a.estado === "servicio"
                ? "Ya finalizó la etapa de Servicio. Se recomienda compartir el Evangelio."
                : "Persona lista para completar.";
              return (
                <div key={a.id} className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{a.nombre} {a.apellido}</p>
                    <p className="text-xs text-muted-foreground">{msj}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleCambiarEstado(a.id, a.estado === "oracion" ? "servicio" : a.estado === "servicio" ? "evangelismo" : "completado")}>
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
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar persona..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {["lista", "kanban"].map((v) => (
            <button key={v} type="button" onClick={() => setViewMode(v as any)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === v ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >{v === "lista" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}</button>
          ))}
        </div>
      </div>

      {/* LISTA VIEW */}
      {viewMode === "lista" && (
        <div className="space-y-2">
          {filteredPersonas.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No hay personas registradas</CardContent></Card>
          ) : filteredPersonas.map((p) => {
            const meta = estadosMeta[p.estado];
            const Icon = meta?.icon || Users;
            const dias = diasEnEstado(p);
            const prog = progresoEstado(p);
            return (
              <Card key={p.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedPersona(p)}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", meta?.bgColor)}>
                    <Icon className={cn("h-4 w-4", meta?.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{p.nombre} {p.apellido}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5">{meta?.label || p.estado}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[200px]">
                        <div className={cn("h-full rounded-full transition-all", prog >= 100 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${prog}%` }} />
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{dias}/30 días</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {p.estado === "oracion" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleCambiarEstado(p.id, "servicio"); }}>Servicio <ArrowRight className="h-3 w-3 ml-1" /></Button>}
                    {p.estado === "servicio" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleCambiarEstado(p.id, "evangelismo"); }}>Evangelismo <ArrowRight className="h-3 w-3 ml-1" /></Button>}
                    {p.estado === "evangelismo" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleCambiarEstado(p.id, "completado"); }}>Completar <CheckCircle2 className="h-3 w-3 ml-1" /></Button>}
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
          {["oracion", "servicio", "evangelismo"].map((estado) => {
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
                          <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                          <p className="text-xs font-medium truncate flex-1">{p.nombre} {p.apellido}</p>
                          <Badge variant="outline" className="text-[10px] px-1">{dias}/30d</Badge>
                        </div>
                        <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", prog >= 100 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${prog}%` }} />
                        </div>
                        {dias >= 30 && <p className="text-[10px] text-amber-500 mt-1">⚠ Listo para avanzar</p>}
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
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Nombre *</Label>
                <Input className="h-9 text-sm" value={nuevaPersona.nombre} onChange={(e) => setNuevaPersona((p) => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Apellido *</Label>
                <Input className="h-9 text-sm" value={nuevaPersona.apellido} onChange={(e) => setNuevaPersona((p) => ({ ...p, apellido: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Teléfono</Label>
                <Input className="h-9 text-sm" value={nuevaPersona.telefono} onChange={(e) => setNuevaPersona((p) => ({ ...p, telefono: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Edad</Label>
                <Input type="number" className="h-9 text-sm" value={nuevaPersona.edad} onChange={(e) => setNuevaPersona((p) => ({ ...p, edad: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Discípulo que ora (opcional)</Label>
              <select className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm" value={nuevaPersona.discipulo_id} onChange={(e) => setNuevaPersona((p) => ({ ...p, discipulo_id: e.target.value }))}>
                <option value="">Yo mismo (líder)</option>
                {discipulos.map((d) => <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>)}
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
            const evtFilter = (personaId: string) => eventos.filter((e) => e.persona_id === personaId).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

            const accionesServicio = actosServicio.filter((a) => !evts.some((e) => e.descripcion === a));
            const accionesEvangelismo = eventosEvangelismo.filter((a) => !evts.some((e) => e.descripcion === a));

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
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {p.telefono && <div><span className="text-xs text-muted-foreground">Teléfono:</span> <p>{p.telefono}</p></div>}
                    {p.edad && <div><span className="text-xs text-muted-foreground">Edad:</span> <p>{p.edad} años</p></div>}
                    <div><span className="text-xs text-muted-foreground">Estado:</span> <Badge variant="outline">{meta?.label}</Badge></div>
                    <div><span className="text-xs text-muted-foreground">Agregado:</span> <p>{format(new Date(p.fecha_creacion), "dd/MM/yyyy")}</p></div>
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
                    {["oracion", "servicio", "evangelismo", "completado"].map((est) => {
                      const m = estadosMeta[est];
                      const completado = est === "oracion" || (p.estado !== "oracion" && ["servicio", "evangelismo", "completado"].includes(est));
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
                    {p.estado === "oracion" && <Button size="sm" className="flex-1" onClick={() => { handleCambiarEstado(p.id, "servicio"); setSelectedPersona(null); }}>Pasar a Servicio <ArrowRight className="h-3 w-3 ml-1" /></Button>}
                    {p.estado === "servicio" && <Button size="sm" className="flex-1" onClick={() => { handleCambiarEstado(p.id, "evangelismo"); setSelectedPersona(null); }}>Comenzar Evangelismo <ArrowRight className="h-3 w-3 ml-1" /></Button>}
                    {p.estado === "evangelismo" && <Button size="sm" variant="outline" className="flex-1" onClick={() => { handleCambiarEstado(p.id, "completado"); setSelectedPersona(null); }}>Completar proceso <CheckCircle2 className="h-3 w-3 ml-1" /></Button>}
                  </div>

                  {/* REGISTRAR ACCIONES */}
                  {p.estado === "servicio" && (
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

                  {p.estado === "evangelismo" && (
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
                      {evtFilter(p.id).length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sin eventos</p>
                      ) : evtFilter(p.id).map((ev) => (
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
    </div>
  );
}

function ObservacionInput({ personaId, onRegistrar, labelOnly }: { personaId: string; onRegistrar: (id: string, tipo: string, desc: string) => void; labelOnly?: boolean }) {
  const [val, setVal] = useState("");
  const handle = () => {
    if (!val.trim()) return;
    onRegistrar(personaId, labelOnly ? "observacion" : "acto_servicio", val.trim());
    setVal("");
  };
  return (
    <div className="flex gap-1 w-full mt-1">
      <Input placeholder={labelOnly ? "Escribí una observación..." : "Otro..."} className="h-7 text-xs flex-1" value={val} onChange={(e) => setVal(e.target.value)} />
      <Button size="sm" className="h-7 text-xs" onClick={handle} disabled={!val.trim()}>+</Button>
    </div>
  );
}
