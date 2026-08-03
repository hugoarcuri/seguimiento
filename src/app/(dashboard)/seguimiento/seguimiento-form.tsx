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
import { ETAPAS } from "./seguimiento-constants";
import type { Seguimiento } from "@/types/database";

interface SeguimientoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Seguimiento | null;
  onSaved: () => void;
  discipulos: Array<{ id: string; nombre: string; apellido: string }>;
  discipuladores: Array<{ id: string; nombre: string; apellido: string }>;
  defaultDiscipuladorId?: string;
  onValidarUnico?: (discipuloId: string) => Promise<boolean>;
}

export function SeguimientoForm({
  open,
  onOpenChange,
  editing,
  onSaved,
  discipulos,
  discipuladores,
  defaultDiscipuladorId,
  onValidarUnico,
}: SeguimientoFormProps) {
  const form = useForm<SeguimientoInput>({
    resolver: zodResolver(seguimientoSchema),
    defaultValues: {
      discipulo_id: "",
      discipulador_id: "",
      etapa: 1,
      fecha_inicio: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        discipulo_id: editing.discipulo_id,
        discipulador_id: editing.discipulador_id,
        etapa: editing.etapa,
        fecha_inicio: editing.fecha_inicio?.slice(0, 10) || new Date().toISOString().split("T")[0],
      });
    } else {
      form.reset({
        discipulo_id: "",
        discipulador_id: defaultDiscipuladorId || "",
        etapa: 1,
        fecha_inicio: new Date().toISOString().split("T")[0],
      });
    }
  }, [open, editing, defaultDiscipuladorId, form]);

  const onSubmit = async (data: SeguimientoInput) => {
    const supabase = createClient();
    if (!editing && onValidarUnico) {
      const disponible = await onValidarUnico(data.discipulo_id);
      if (!disponible) {
        toast.error("Este discípulo ya tiene un seguimiento activo");
        return;
      }
    }
    const payload = {
      discipulo_id: data.discipulo_id,
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
        if (error.code === "23505") toast.error("Este discípulo ya tiene un seguimiento activo");
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
              ? "Modificá los datos del seguimiento del discípulo."
              : "Iniciá el seguimiento espiritual de un discípulo."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Discípulo</Label>
            <Controller
              control={form.control}
              name="discipulo_id"
              render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    disabled={!!editing}
                    onValueChange={(v) => field.onChange(v?.toString() ?? "")}
                    items={discipulos.map((d) => ({ value: d.id, label: `${d.apellido}, ${d.nombre}` }))}
                  >
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

          <div className="grid grid-cols-2 gap-4">
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
                    items={ETAPAS.map((e) => ({ value: String(e.valor), label: `${e.valor}. ${e.nombre}` }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ETAPAS.map((e) => (
                        <SelectItem key={e.valor} value={String(e.valor)}>{e.valor}. {e.nombre}</SelectItem>
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