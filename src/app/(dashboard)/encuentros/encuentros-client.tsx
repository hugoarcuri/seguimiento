"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { encuentroSchema, type EncuentroInput } from "@/lib/validations/encuentro";
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
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface EncuentrosClientProps {
  encuentros: any[];
  discipulos: Array<{ id: string; nombre: string; apellido: string }>;
}

export function EncuentrosClient({
  encuentros,
  discipulos,
}: EncuentrosClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const form = useForm<EncuentroInput>({
    resolver: zodResolver(encuentroSchema),
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ discipulo_id: "", fecha: "", hora: "", lugar: "", tema_tratado: "", material_utilizado: "", compromisos: "", notas: "", proximo_encuentro: "" });
    setOpen(true);
  };

  const openEdit = (encuentro: any) => {
    setEditing(encuentro);
    form.reset({
      discipulo_id: encuentro.discipulo_id,
      fecha: encuentro.fecha?.split("T")[0] || "",
      hora: encuentro.hora || "",
      lugar: encuentro.lugar || "",
      tema_tratado: encuentro.tema_tratado,
      material_utilizado: encuentro.material_utilizado || "",
      compromisos: encuentro.compromisos || "",
      notas: encuentro.notas || "",
      proximo_encuentro: encuentro.proximo_encuentro?.slice(0, 16) || "",
    });
    setOpen(true);
  };

  const onSubmit = async (data: EncuentroInput) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = { ...data, lider_id: user.id };
    const { error } = editing
      ? await supabase.from("encuentros").update(payload).eq("id", editing.id)
      : await supabase.from("encuentros").insert(payload);

    if (error) {
      toast.error(editing ? "Error al actualizar encuentro" : "Error al registrar encuentro");
    } else {
      toast.success(editing ? "Encuentro actualizado" : "Encuentro registrado");
      setOpen(false);
      setEditing(null);
      form.reset();
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este encuentro?")) return;
    const { error } = await createClient().from("encuentros").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar encuentro"); return }
    toast.success("Encuentro eliminado");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Encuentros</h1>
          <p className="text-muted-foreground">
            Registra y gestiona los encuentros de discipulado
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger render={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nuevo Encuentro</Button>} />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Encuentro" : "Registrar Encuentro"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Discípulo *</Label>
                  <Select
                    value={form.watch("discipulo_id") || undefined}
                    onValueChange={(value: any) => form.setValue("discipulo_id", value ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar discípulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {discipulos.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.apellido}, {d.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.discipulo_id && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.discipulo_id.message}
                    </p>
                  )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input id="fecha" type="date" {...form.register("fecha")} />
                  {form.formState.errors.fecha && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.fecha.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora">Hora</Label>
                  <Input id="hora" type="time" {...form.register("hora")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lugar">Lugar</Label>
                <Input id="lugar" {...form.register("lugar")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tema_tratado">Tema Tratado *</Label>
                <Input id="tema_tratado" {...form.register("tema_tratado")} />
                {form.formState.errors.tema_tratado && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.tema_tratado.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="material_utilizado">Material Utilizado</Label>
                <Textarea id="material_utilizado" {...form.register("material_utilizado")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compromisos">Compromisos</Label>
                <Textarea id="compromisos" {...form.register("compromisos")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea id="notas" {...form.register("notas")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proximo_encuentro">Próximo Encuentro</Label>
                <Input
                  id="proximo_encuentro"
                  type="datetime-local"
                  {...form.register("proximo_encuentro")}
                />
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Guardar Cambios" : "Registrar Encuentro"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Encuentros</CardTitle>
          <CardDescription>{encuentros.length} registros</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Discípulo</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead>Lugar</TableHead>
                <TableHead>Compromisos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {encuentros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay encuentros registrados
                  </TableCell>
                </TableRow>
              ) : (
                encuentros.map((encuentro) => (
                  <TableRow key={encuentro.id}>
                    <TableCell>
                      {format(new Date(encuentro.fecha), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {encuentro.discipulos?.nombre
                        ? `${encuentro.discipulos.apellido}, ${encuentro.discipulos.nombre}`
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {encuentro.tema_tratado}
                    </TableCell>
                    <TableCell>{encuentro.lugar || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {encuentro.compromisos || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(encuentro)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(encuentro.id)} title="Eliminar">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
