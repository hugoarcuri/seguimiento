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
import { Plus, Loader2, Pencil, Trash2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Discipulo, Tarea } from "@/types/database";

const tipoLabels: Record<string, string> = {
  lectura: "Lectura",
  memorizacion: "Memorización",
  preguntas: "Preguntas",
  practica: "Práctica",
};

const estadoConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }> = {
  pendiente: { variant: "secondary", label: "Pendiente", icon: Clock },
  completada: { variant: "default", label: "Completada", icon: CheckCircle2 },
  vencida: { variant: "destructive", label: "Vencida", icon: AlertTriangle },
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

  const form = useForm<TareaInput>({
    resolver: zodResolver(tareaSchema),
    defaultValues: { discipulo_id: "", titulo: "", descripcion: "", tipo: "lectura", fecha_limite: "" },
  });

  const isAdmin = user?.rol === "admin";

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    let tareasQuery = supabase.from("tareas").select("*, discipulo:discipulos(*)").order("created_at", { ascending: false });
    if (!isAdmin) tareasQuery = tareasQuery.eq("discipulo_id", authUser.id);

    const [tareasRes, discipulosRes] = await Promise.all([
      tareasQuery,
      isAdmin ? supabase.from("discipulos").select("*").order("apellido", { ascending: true }) : Promise.resolve({ data: [] }),
    ]);
    setTareas((tareasRes.data as any) || []);
    setDiscipulos(discipulosRes.data || []);
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

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    const { error } = await supabase.from("tareas").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar tarea"); return }
    toast.success("Tarea eliminada");
    fetchData();
  };

  const markCompleted = async (id: string) => {
    const { error } = await supabase.from("tareas").update({ estado: "completada", completed_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Error al completar tarea"); return }
    toast.success("Tarea marcada como completada");
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
                          {tarea.estado === "pendiente" && (
                            <Button variant="ghost" size="icon" onClick={() => markCompleted(tarea.id)} title="Marcar completada">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
            <DialogDescription>Asigná una tarea a un discípulo</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Discípulo</Label>
              <Select onValueChange={(v) => form.setValue("discipulo_id", v)} value={form.watch("discipulo_id")}>
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
                <Select onValueChange={(v) => form.setValue("tipo", v as any)} value={form.watch("tipo")}>
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
    </div>
  );
}
