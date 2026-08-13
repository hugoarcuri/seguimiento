"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tareaSchema, type TareaInput } from "@/lib/validations/tarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, Pencil, Trash2, CheckCircle2, RotateCcw, Clock, AlertTriangle, BookOpen, FileText, Film, Headphones, Link2, StickyNote, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { descargarCSV } from "@/lib/csv";
import type { Discipulo, Tarea, Material, Etapa } from "@/types/database";

const tipoLabels: Record<string, string> = {
  lectura: "Lectura",
  memorizacion: "Memorización",
  preguntas: "Preguntas",
  practica: "Práctica",
};

interface EstadoConfig {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
  icon: typeof Clock;
}

const estadoConfig: Record<string, EstadoConfig> = {
  pendiente: { variant: "secondary", label: "Pendiente", icon: Clock },
  completada: { variant: "default", label: "Completada", icon: CheckCircle2 },
  vencida: { variant: "destructive", label: "Vencida", icon: AlertTriangle },
};

const materialTipoIcon: Record<string, typeof BookOpen> = {
  libro: BookOpen, pdf: FileText, video: Film, audio: Headphones, link: Link2, nota: StickyNote,
};

const materialTipoLabel: Record<string, string> = {
  libro: "Libro", pdf: "PDF", video: "Video", audio: "Audio", link: "Link", nota: "Nota",
};

export default function TareasPage() {
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const [tareas, setTareas] = useState<(Tarea & { discipulo?: Discipulo })[]>([]);
  const [discipulos, setDiscipulos] = useState<Discipulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [materiales, setMateriales] = useState<(Material & { etapas?: { nombre: string } })[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [matDialogOpen, setMatDialogOpen] = useState(false);
  const [matForm, setMatForm] = useState({ titulo: "", tipo: "libro", etapa_id: "", url: "", descripcion: "" });
  const [matSubmitting, setMatSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const form = useForm<TareaInput>({
    resolver: zodResolver(tareaSchema),
    defaultValues: { discipulo_id: "", titulo: "", descripcion: "", tipo: "lectura", fecha_limite: "" },
  });

  const isAdmin = user?.rol === "admin";

  const fetchData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: profile } = await supabase.from("profiles").select("rol").eq("id", authUser.id).single();
    const isAdminUser = profile?.rol === "admin";

    let tareasQuery = supabase.from("tareas").select("*, discipulo:discipulos(*)").order("created_at", { ascending: false });
    if (!isAdminUser) tareasQuery = tareasQuery.eq("discipulo_id", authUser.id);

    const [tareasRes, discipulosRes, matRes, etapasRes] = await Promise.all([
      tareasQuery,
      isAdminUser ? supabase.from("discipulos").select("*").order("apellido", { ascending: true }) : Promise.resolve({ data: [] }),
      supabase.from("materiales").select("*, etapas:etapa_id(nombre)").order("created_at", { ascending: false }),
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
    ]);
    setTareas((tareasRes.data as (Tarea & { discipulo?: Discipulo })[]) || []);
    setDiscipulos(discipulosRes.data || []);
    setMateriales((matRes.data as (Material & { etapas?: { nombre: string } })[]) || []);
    setEtapas(etapasRes.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      try {
        await fetchData();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchData]);

  const openCreate = () => {
    setEditingId(null);
    form.reset({ discipulo_id: "", titulo: "", descripcion: "", tipo: "lectura", fecha_limite: "" });
    setDialogOpen(true);
  };

  const openEdit = (tarea: Tarea) => {
    setEditingId(tarea.id);
    form.reset({
      discipulo_id: tarea.discipulo_id,
      titulo: tarea.titulo,
      descripcion: tarea.descripcion || "",
      tipo: tarea.tipo,
      fecha_limite: tarea.fecha_limite || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: TareaInput) => {
    setSubmitting(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { toast.error("Debés iniciar sesión"); setSubmitting(false); return }

    const payload = { ...data, lider_id: authUser.id, descripcion: data.descripcion || null, fecha_limite: data.fecha_limite || null };

    if (editingId) {
      const { error } = await supabase.from("tareas").update(payload).eq("id", editingId);
      if (error) { toast.error("Error al actualizar tarea"); setSubmitting(false); return }
      toast.success("Tarea actualizada");
    } else {
      const { error } = await supabase.from("tareas").insert(payload);
      if (error) { toast.error("Error al crear tarea"); setSubmitting(false); return }
      toast.success("Tarea creada");
    }

    setDialogOpen(false);
    setSubmitting(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("tareas").delete().eq("id", deleteId);
    if (error) { toast.error("Error al eliminar tarea"); setDeleteId(null); return }
    toast.success("Tarea eliminada");
    setDeleteId(null);
    fetchData();
  };

  const toggleSeleccion = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const todosSeleccionados = tareas.length > 0 && tareas.every((t) => selectedIds.includes(t.id));

  const toggleTodos = () => {
    const ids = new Set(tareas.map((t) => t.id));
    setSelectedIds((prev) =>
      todosSeleccionados ? prev.filter((id) => !ids.has(id)) : [...new Set([...prev, ...ids])]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length || bulkDeleting) return;
    setBulkDeleting(true);
    const { error } = await supabase.from("tareas").delete().in("id", selectedIds);
    setBulkDeleting(false);
    if (error) {
      toast.error(`Error al eliminar: ${error.message}`);
      return;
    }
    toast.success(`${selectedIds.length} tarea(s) eliminada(s)`);
    setBulkDeleteOpen(false);
    setSelectedIds([]);
    fetchData();
  };

  const exportarSeleccionados = () => {
    const sel = tareas.filter((t) => selectedIds.includes(t.id));
    if (sel.length === 0) return;
    const filas = sel.map((t) => {
      const discipulo = discipulos.find((d) => d.id === t.discipulo_id);
      return {
        Título: t.titulo,
        "Discípulo": isAdmin ? (discipulo ? `${discipulo.apellido}, ${discipulo.nombre}` : "") : "",
        Tipo: tipoLabels[t.tipo] || t.tipo,
        Estado: estadoConfig[t.estado]?.label || t.estado,
        "Fecha límite": t.fecha_limite ? format(new Date(t.fecha_limite), "dd/MM/yyyy") : "",
        Completada: t.completed_at ? format(new Date(t.completed_at), "dd/MM/yyyy HH:mm") : "",
      };
    });
    descargarCSV("tareas.csv", filas);
    toast.success(`${sel.length} tarea(s) exportada(s)`);
  };

  const toggleEstado = async (id: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === "completada" ? "pendiente" : "completada";
    const payload = nuevoEstado === "completada"
      ? { estado: nuevoEstado, completed_at: new Date().toISOString() }
      : { estado: nuevoEstado, completed_at: null };
    const { error } = await supabase.from("tareas").update(payload).eq("id", id);
    if (error) { toast.error("Error al actualizar tarea"); return }
    toast.success(nuevoEstado === "completada" ? "Tarea marcada como completada" : "Tarea revertida a pendiente");
    fetchData();
  };

  const createMaterial = async () => {
    if (!matForm.titulo) { toast.error("El título es requerido"); return }
    setMatSubmitting(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { toast.error("Debés iniciar sesión"); setMatSubmitting(false); return }
    const payload: Record<string, string | number | null> = { titulo: matForm.titulo, tipo: matForm.tipo, creado_por: authUser.id };
    if (matForm.descripcion) payload.descripcion = matForm.descripcion;
    if (matForm.url) payload.url = matForm.url;
    if (matForm.etapa_id) payload.etapa_id = parseInt(matForm.etapa_id);
    const { error } = await supabase.from("materiales").insert(payload);
    if (error) { toast.error("Error al crear material"); setMatSubmitting(false); return }
    toast.success("Material creado");
    setMatDialogOpen(false);
    setMatForm({ titulo: "", tipo: "libro", etapa_id: "", url: "", descripcion: "" });
    setMatSubmitting(false);
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const pendingTareas = tareas.filter((t) => t.estado === "pendiente");
  const completedTareas = tareas.filter((t) => t.estado === "completada");
  const expiredTareas = tareas.filter((t) => t.estado === "vencida");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tareas</h1>
          <p className="text-muted-foreground">{isAdmin ? "Administrá las tareas asignadas a los discípulos" : "Mis tareas asignadas"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <Button variant="outline" onClick={exportarSeleccionados}>
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          )}
          {isAdmin && selectedIds.length > 0 && (
            <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedIds.length})
            </Button>
          )}
          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Pendientes</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-muted-foreground">{pendingTareas.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Completadas</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600 dark:text-green-400">{completedTareas.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Vencidas</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-destructive">{expiredTareas.length}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="md:hidden">
            {tareas.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No hay tareas</p>
            ) : (
              <div className="space-y-3 p-3">
                {tareas.map((tarea) => {
                  const EstadoIcon = estadoConfig[tarea.estado].icon;
                  const discipulo = discipulos.find((d) => d.id === tarea.discipulo_id);
                  return (
                    <div key={tarea.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <Checkbox
                            checked={selectedIds.includes(tarea.id)}
                            onCheckedChange={() => toggleSeleccion(tarea.id)}
                            aria-label="Seleccionar"
                            title="Seleccionar"
                            className="mt-0.5 shrink-0"
                          />
                          <p className="font-medium break-words min-w-0">{tarea.titulo}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => toggleEstado(tarea.id, tarea.estado)} title={tarea.estado === "completada" ? "Revertir a pendiente" : "Marcar completada"} className="shrink-0">
                          {tarea.estado === "completada"
                            ? <RotateCcw className="h-4 w-4 text-amber-600" />
                            : <CheckCircle2 className="h-4 w-4 text-green-600" />
                          }
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{tipoLabels[tarea.tipo]}</Badge>
                        <Badge variant={estadoConfig[tarea.estado].variant} className="gap-1">
                          <EstadoIcon className="h-3 w-3" /> {estadoConfig[tarea.estado].label}
                        </Badge>
                        {isAdmin && discipulo && (
                          <span className="text-xs text-muted-foreground">{discipulo.apellido}, {discipulo.nombre}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {tarea.fecha_limite && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Límite: {format(new Date(tarea.fecha_limite), "dd/MM/yyyy")}
                          </span>
                        )}
                        {tarea.completed_at && (
                          <span>Completada: {format(new Date(tarea.completed_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 pt-1">
                          <Button variant="outline" size="sm" onClick={() => openEdit(tarea)}>
                            <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteId(tarea.id)}>
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Eliminar
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    {tareas.length > 0 && (
                      <Checkbox checked={todosSeleccionados} onCheckedChange={toggleTodos} aria-label="Seleccionar todos" />
                    )}
                  </TableHead>
                  <TableHead>Título</TableHead>
                  {isAdmin && <TableHead>Discípulo</TableHead>}
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Límite</TableHead>
                  <TableHead>Completada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tareas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">No hay tareas</TableCell>
                  </TableRow>
                ) : (
                  tareas.map((tarea) => {
                    const EstadoIcon = estadoConfig[tarea.estado].icon;
                    const discipulo = discipulos.find((d) => d.id === tarea.discipulo_id);
                    return (
                      <TableRow key={tarea.id}>
                        <TableCell className="w-10">
                          <Checkbox checked={selectedIds.includes(tarea.id)} onCheckedChange={() => toggleSeleccion(tarea.id)} aria-label="Seleccionar" title="Seleccionar" />
                        </TableCell>
                        <TableCell className="font-medium">{tarea.titulo}</TableCell>
                        {isAdmin && <TableCell>{discipulo ? `${discipulo.apellido}, ${discipulo.nombre}` : "—"}</TableCell>}
                        <TableCell><Badge variant="outline">{tipoLabels[tarea.tipo]}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={estadoConfig[tarea.estado].variant} className="gap-1">
                            <EstadoIcon className="h-3 w-3" /> {estadoConfig[tarea.estado].label}
                          </Badge>
                        </TableCell>
                        <TableCell>{tarea.fecha_limite ? format(new Date(tarea.fecha_limite), "dd/MM/yyyy") : "—"}</TableCell>
                        <TableCell>{tarea.completed_at ? format(new Date(tarea.completed_at), "dd/MM/yyyy HH:mm", { locale: es }) : "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => toggleEstado(tarea.id, tarea.estado)} title={tarea.estado === "completada" ? "Revertir a pendiente" : "Marcar completada"}>
                              {tarea.estado === "completada"
                                ? <RotateCcw className="h-4 w-4 text-amber-600" />
                                : <CheckCircle2 className="h-4 w-4 text-green-600" />
                              }
                            </Button>
                            {isAdmin && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => openEdit(tarea)} title="Editar">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteId(tarea.id)} title="Eliminar">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Materiales</h2>
            <p className="text-sm text-muted-foreground">Recursos para el discipulado</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setMatDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Material
            </Button>
          )}
        </div>
        {materiales.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No hay materiales registrados</CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {materiales.map((mat) => {
              const MatIcon = materialTipoIcon[mat.tipo] || BookOpen;
              return (
                <Card key={mat.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <MatIcon className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">{materialTipoLabel[mat.tipo]}</Badge>
                    </div>
                    <CardTitle className="text-base mt-2">{mat.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {mat.descripcion && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{mat.descripcion}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      {mat.etapas?.nombre && <Badge variant="secondary">{mat.etapas.nombre}</Badge>}
                      {mat.url && (
                        <a href={mat.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline ml-auto">
                          <Link2 className="h-3 w-3 inline mr-1" />Abrir
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={matDialogOpen} onOpenChange={setMatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Material</DialogTitle>
            <DialogDescription>Agregá un recurso para el discipulado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mat-titulo">Título</Label>
              <Input id="mat-titulo" value={matForm.titulo} onChange={(e) => setMatForm({ ...matForm, titulo: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                 <Select onValueChange={(v) => setMatForm({ ...matForm, tipo: v?.toString() ?? "" })} value={matForm.tipo} items={Object.entries(materialTipoLabel).map(([k, v]) => ({ value: k, label: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(materialTipoLabel).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Etapa</Label>
                 <Select onValueChange={(v) => setMatForm({ ...matForm, etapa_id: v?.toString() ?? "" })} value={matForm.etapa_id || undefined} items={etapas.map((etapa) => ({ value: String(etapa.id), label: etapa.nombre }))}>
                  <SelectTrigger><SelectValue placeholder="Sin etapa" /></SelectTrigger>
                  <SelectContent>
                    {etapas.map((etapa) => (
                      <SelectItem key={etapa.id} value={String(etapa.id)}>{etapa.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mat-url">URL</Label>
              <Input id="mat-url" value={matForm.url} onChange={(e) => setMatForm({ ...matForm, url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mat-desc">Descripción</Label>
              <Textarea id="mat-desc" value={matForm.descripcion} onChange={(e) => setMatForm({ ...matForm, descripcion: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMatDialogOpen(false)}>Cancelar</Button>
              <Button onClick={createMaterial} disabled={matSubmitting}>
                {matSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Material
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
            <DialogDescription>Asigná una tarea a un discípulo</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Discípulo</Label>
              <Controller
                control={form.control}
                name="discipulo_id"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={(v) => field.onChange(v?.toString() ?? "")} items={discipulos.map((d) => ({ value: d.id, label: `${d.apellido}, ${d.nombre}` }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar discípulo" /></SelectTrigger>
                    <SelectContent>
                      {discipulos.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.apellido}, {d.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.discipulo_id && <p className="text-sm text-destructive">{form.formState.errors.discipulo_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" {...form.register("titulo")} />
              {form.formState.errors.titulo && <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" {...form.register("descripcion")} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Controller
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange((v?.toString() ?? "lectura") as TareaInput["tipo"])} items={Object.entries(tipoLabels).map(([k, v]) => ({ value: k, label: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(tipoLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_limite">Fecha Límite</Label>
                <Input id="fecha_limite" type="date" {...form.register("fecha_limite")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Guardar Cambios" : "Crear Tarea"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Tarea</DialogTitle>
            <DialogDescription>¿Estás seguro de eliminar esta tarea? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar tareas</DialogTitle>
            <DialogDescription>
              ¿Eliminar {selectedIds.length} tarea(s) seleccionada(s)? Esta acción no se puede deshacer.
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
