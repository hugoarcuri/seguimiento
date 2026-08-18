"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seguimientoSchema, type SeguimientoInput } from "@/lib/validations/seguimiento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Etapa, Seguimiento } from "@/types/database";

interface SeguimientoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Seguimiento | null;
  onSaved: () => void;
  miembros: Array<{ id: string; nombre: string; apellido: string; etapa_id?: number }>;
  discipuladores: Array<{ id: string; nombre: string; apellido: string }>;
  etapas: Etapa[];
  defaultDiscipuladorId?: string;
  onValidarUnico?: (miembroId: string) => Promise<boolean>;
}

export function SeguimientoForm({
  open,
  onOpenChange,
  editing,
  onSaved,
  miembros,
  discipuladores,
  etapas,
  defaultDiscipuladorId,
  onValidarUnico,
}: SeguimientoFormProps) {
  const form = useForm<SeguimientoInput>({
    resolver: zodResolver(seguimientoSchema),
    defaultValues: {
      miembro_id: "",
      discipulador_id: "",
      etapa: 1,
      fecha_inicio: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        miembro_id: editing.miembro_id,
        discipulador_id: editing.discipulador_id,
        etapa: editing.etapa,
        fecha_inicio: editing.fecha_inicio?.slice(0, 10) || new Date().toISOString().split("T")[0],
      });
    } else {
      form.reset({
        miembro_id: "",
        discipulador_id: defaultDiscipuladorId || "",
        etapa: 1,
        fecha_inicio: new Date().toISOString().split("T")[0],
      });
    }
  }, [open, editing, defaultDiscipuladorId, form]);

  const miembroId = form.watch("miembro_id");
  useEffect(() => {
    if (editing || !miembroId) return;
    const miembro = miembros.find((m) => m.id === miembroId);
    if (miembro?.etapa_id) {
      form.setValue("etapa", miembro.etapa_id);
    }
  }, [miembroId, editing, miembros, form]);

  const onSubmit = async (data: SeguimientoInput) => {
    const supabase = createClient();
    if (!editing && onValidarUnico) {
      const disponible = await onValidarUnico(data.miembro_id);
      if (!disponible) {
        toast.error("Este miembro ya tiene un seguimiento activo");
        return;
      }
    }
    const payload = {
      miembro_id: data.miembro_id,
      discipulador_id: data.discipulador_id,
      etapa: data.etapa,
      estado: "activo" as const,
      fecha_inicio: data.fecha_inicio,
    };

    if (editing) {
      const { error } = await supabase.from("seguimientos").update(payload).eq("id", editing.id);
      if (error) { toast.error("Error al actualizar el seguimiento"); return; }
      toast.success("Seguimiento actualizado");
    } else {
      const { error } = await supabase.from("seguimientos").insert({ ...payload, progreso: 0 });
      if (error) {
        if (error.code === "23505") toast.error("Este miembro ya tiene un seguimiento activo");
        else toast.error("Error al crear el seguimiento");
        return;
      }
      toast.success("Seguimiento creado");
    }
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Seguimiento" : "Nuevo Seguimiento"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Modificá los datos del seguimiento del miembro."
              : "Iniciá el seguimiento espiritual de un miembro."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Miembro</Label>
            <Controller
              control={form.control}
              name="miembro_id"
              render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    disabled={!!editing}
                    onValueChange={(v) => field.onChange(v?.toString() ?? "")}
                    items={miembros.map((d) => ({ value: d.id, label: `${d.apellido}, ${d.nombre}` }))}
                  >
                  <SelectTrigger><SelectValue placeholder="Seleccionar miembro" /></SelectTrigger>
                  <SelectContent>
                    {miembros.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.apellido}, {d.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.miembro_id && <p className="text-sm text-destructive">{form.formState.errors.miembro_id.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Discipulador</Label>
              <Controller
                control={form.control}
                name="discipulador_id"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(v) => field.onChange(v?.toString() ?? "")}
                    items={discipuladores.map((p) => ({ value: p.id, label: `${p.apellido}, ${p.nombre}` }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {discipuladores.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.apellido}, {p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Etapa actual</Label>
              <Controller
                control={form.control}
                name="etapa"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                    items={etapas.map((e) => ({ value: String(e.id), label: `${e.id}. ${e.nombre}` }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {etapas.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>{e.id}. {e.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
            <Input id="fecha_inicio" type="date" {...form.register("fecha_inicio")} />
            {form.formState.errors.fecha_inicio && <p className="text-sm text-destructive">{form.formState.errors.fecha_inicio.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Guardar Cambios" : "Crear Seguimiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}