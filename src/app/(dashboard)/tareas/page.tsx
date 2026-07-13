"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useForm } from "react-hook-form";
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
  CardDescription,
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
  DialogTrigger,
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
import { Plus, Loader2, Pencil, Trash2, CheckCircle2, RotateCcw, Clock, AlertTriangle, CalendarIcon, BookOpen, FileText, Film, Headphones, Link2, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Discipulo, Tarea, Material, Etapa } from "@/types/database";

const tipoLabels: Record<string, string> = {
  lectura: "Lectura",
  memorizacion: "Memorización",
  preguntas: "Preguntas",
  practica: "Práctica",
};

const parseDate = (s: string) => {
  const [d, m, y] = s.split("/");
  if (!d || !m || !y) return null;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
};

const estadoConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }> = {
  pendiente: { variant: "secondary", label: "Pendiente", icon: Clock },
  completada: { variant: "default", label: "Completada", icon: CheckCircle2 },
  vencida: { variant: "destructive", label: "Vencida", icon: AlertTriangle },
};

const materialTipoIcon: Record<string, any> = {
  libro: BookOpen, pdf: FileText, video: Film, audio: Headphones, link: Link2, nota: StickyNote,
};

const materialTipoLabel: Record<string, string> = {
  libro: "Libro", pdf: "PDF", video: "Video", audio: "Audio", link: "Link", nota: "Nota",
};

export default function TareasPage() {
  const { user } = useUser();
  const supabase = createClient();
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

  const form = useForm<TareaInput>({
    resolver: zodResolver(tareaSchema),
    defaultValues: { discipulo_id: "", titulo: "", descripcion: "", tipo: "lectura", fecha_limite: "" },
  });

  const isAdmin = user?.rol === "admin";

  const fetchData = async () => {
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
    setTareas((tareasRes.data as any) || []);
    setDiscipulos(discipulosRes.data || []);
    setMateriales((matRes.data as any) || []);
    setEtapas(etapasRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData() }, []);

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
      fecha_limite: formatDate(tarea.fecha_limite),
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: TareaInput) => {
    setSubmitting(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { toast.error("Debés iniciar sesión"); setSubmitting(false); return }

    const fechaLimite = data.fecha_limite ? parseDate(data.fecha_limite) : null;
    const payload = { ...data, lider_id: authUser.id, descripcion: data.descripcion || null, fecha_limite: fechaLimite };

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

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    const { error } = await supabase.from("tareas").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar tarea"); return }
    toast.success("Tarea eliminada");
    fetchData();
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
    const payload: any = { titulo: matForm.titulo, tipo: matForm.tipo, creado_por: authUser.id };
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tareas</h1>
          <p className="text-muted-foreground">{isAdmin ? "Administrá las tareas asignadas a los discípulos" : "Mis tareas asignadas"}</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
          </Button>
        )}
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
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">No hay tareas</TableCell>
                </TableRow>
              ) : (
                tareas.map((tarea) => {
                  const EstadoIcon = estadoConfig[tarea.estado].icon;
                  const discipulo = discipulos.find((d) => d.id === tarea.discipulo_id);
                  return (
                    <TableRow key={tarea.id}>
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
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(tarea.id)} title="Eliminar">
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
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select onValueChange={(v: any) => setMatForm({ ...matForm, tipo: v })} value={matForm.tipo}>
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
                <Select onValueChange={(v: any) => setMatForm({ ...matForm, etapa_id: v ?? "" })} value={matForm.etapa_id || undefined}>
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
              <Select value={form.watch("discipulo_id") || undefined} onValueChange={(v: any) => form.setValue("discipulo_id", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Seleccionar discípulo" /></SelectTrigger>
                <SelectContent>
                  {discipulos.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.apellido}, {d.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select onValueChange={(v: any) => form.setValue("tipo", v)} value={form.watch("tipo")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_limite">Fecha Límite</Label>
                <div className="relative">
                  <Input id="fecha_limite" placeholder="DD/MM/AAAA" className="pl-8" {...form.register("fecha_limite")} />
                  <CalendarIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
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
    </div>
  );
}
