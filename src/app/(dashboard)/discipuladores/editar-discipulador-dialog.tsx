"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/types/database";

const editarSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  telefono: z.string().optional(),
});

type EditarInput = z.infer<typeof editarSchema>;

const inputClass = "h-11 md:h-8";
const labelClass = "text-[11px] font-medium text-muted-foreground";

interface EditarDiscipuladorDialogProps {
  open: boolean;
  discipulador: Profile | null;
  onOpenChange: (open: boolean) => void;
  onEditado?: () => void;
}

export function EditarDiscipuladorDialog({ open, discipulador, onOpenChange, onEditado }: EditarDiscipuladorDialogProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditarInput>({
    resolver: zodResolver(editarSchema),
    values: discipulador
      ? { nombre: discipulador.nombre || "", apellido: discipulador.apellido || "", telefono: discipulador.telefono || "" }
      : undefined,
  });

  const onSubmit = async (data: EditarInput) => {
    if (!discipulador) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ nombre: data.nombre, apellido: data.apellido, telefono: data.telefono || null })
      .eq("id", discipulador.id);
    setSaving(false);

    if (error) {
      toast.error("Error al actualizar discipulador");
      return;
    }
    toast.success("Discipulador actualizado");
    reset();
    onOpenChange(false);
    onEditado?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Discipulador</DialogTitle>
          <DialogDescription>Modificá los datos de {discipulador?.nombre} {discipulador?.apellido}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="editar-nombre" className={labelClass}>Nombre *</Label>
              <Input id="editar-nombre" className={inputClass} {...register("nombre")} aria-invalid={!!errors.nombre} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editar-apellido" className={labelClass}>Apellido *</Label>
              <Input id="editar-apellido" className={inputClass} {...register("apellido")} aria-invalid={!!errors.apellido} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="editar-telefono" className={labelClass}>Teléfono</Label>
            <Input id="editar-telefono" className={inputClass} {...register("telefono")} />
          </div>
          {(errors.nombre || errors.apellido) && (
            <p className="text-xs text-destructive">{errors.nombre?.message || errors.apellido?.message}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
