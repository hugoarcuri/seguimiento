"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { agendaSchema, type AgendaInput } from "@/lib/validations/agenda";
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
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Agenda } from "@/types/database";

interface AgendaClientProps {
  agendas: (Agenda & { discipulos?: { nombre: string; apellido: string } })[];
  setAgendas: React.Dispatch<React.SetStateAction<(Agenda & { discipulos?: { nombre: string; apellido: string } })[]>>;
  discipulos: Array<{ id: string; nombre: string; apellido: string }>;
}

export function AgendaClient({
  agendas,
  setAgendas,
  discipulos,
}: AgendaClientProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Agenda | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<AgendaInput>({
    resolver: zodResolver(agendaSchema),
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ discipulo_id: "", fecha: "", hora: "", lugar: "", tema_tratado: "", material_utilizado: "", compromisos: "", notas: "", proximo_encuentro: "" });
    setOpen(true);
  };

  const openEdit = (agenda: Agenda & { discipulos?: { nombre: string; apellido: string } }) => {
    setEditing(agenda);
    form.reset({
      discipulo_id: agenda.discipulo_id,
      fecha: agenda.fecha?.split("T")[0] || "",
      hora: agenda.hora || "",
      lugar: agenda.lugar || "",
      tema_tratado: agenda.tema_tratado,
      material_utilizado: agenda.material_utilizado || "",
      compromisos: agenda.compromisos || "",
      notas: agenda.notas || "",
      proximo_encuentro: agenda.proximo_encuentro?.slice(0, 16) || "",
    });
    setOpen(true);
  };

  const onSubmit = async (data: AgendaInput) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = { ...data, lider_id: user.id };
    const { error, data: result } = editing
      ? await supabase.from("agenda").update(payload).eq("id", editing.id).select("*, discipulos:discipulo_id(nombre, apellido)").single()
      : await supabase.from("agenda").insert(payload).select("*, discipulos:discipulo_id(nombre, apellido)").single();

    if (error) {
      toast.error(editing ? "Error al actualizar la cita" : "Error al registrar la cita");
    } else {
      toast.success(editing ? "Cita actualizada" : "Cita registrada");
      setOpen(false);
      setEditing(null);
      form.reset();
      if (!editing && result) setAgendas((prev) => [result as never, ...prev]);
      if (editing && result) setAgendas((prev) => prev.map((e) => e.id === editing.id ? result as never : e));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await createClient().from("agenda").delete().eq("id", deleteId);
    if (error) { toast.error("Error al eliminar la cita"); setDeleteId(null); return }
    toast.success("Cita eliminada");
    setDeleteId(null);
    setAgendas((prev) => prev.filter((e) => e.id !== deleteId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">
            Registra y gestiona las citas de discipulado
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger render={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nueva cita</Button>} />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar cita" : "Registrar cita"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Discípulo *</Label>
                <Controller
                  control={form.control}
                  name="discipulo_id"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={(value) => field.onChange(value?.toString() ?? "")}>
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
                  )}
                />
                {form.formState.errors.discipulo_id && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.discipulo_id.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <Label htmlFor="proximo_encuentro">Próxima cita</Label>
                <Input
                  id="proximo_encuentro"
                  type="datetime-local"
                  {...form.register("proximo_encuentro")}
                />
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Guardar Cambios" : "Registrar cita"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las citas</CardTitle>
          <CardDescription>{agendas.length} registros</CardDescription>
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
              {agendas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay citas registradas
                  </TableCell>
                </TableRow>
              ) : (
                agendas.map((agenda) => (
                  <TableRow key={agenda.id}>
                    <TableCell>
                      {format(new Date(agenda.fecha), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {agenda.discipulos?.nombre
                        ? `${agenda.discipulos.apellido}, ${agenda.discipulos.nombre}`
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {agenda.tema_tratado}
                    </TableCell>
                    <TableCell>{agenda.lugar || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {agenda.compromisos || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(agenda)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteId(agenda.id)}>
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Eliminar
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

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar cita</DialogTitle>
            <DialogDescription>¿Estás seguro de eliminar esta cita? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}