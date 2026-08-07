"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { calcularEdad } from "@/lib/utils";
import { OPCIONES_DON_ESPIRITUAL, OPCION_OTRO_DON, esDonConocido } from "./discipulador-constants";

const editarSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  telefono: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  don_espiritual: z.string().optional(),
  don_espiritual_otro: z.string().optional(),
  fortalezas: z.string().optional(),
  debilidades: z.string().optional(),
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
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditarInput>({
    resolver: zodResolver(editarSchema),
    values: discipulador
      ? {
          nombre: discipulador.nombre || "",
          apellido: discipulador.apellido || "",
          telefono: discipulador.telefono || "",
          fecha_nacimiento: discipulador.fecha_nacimiento || "",
          don_espiritual: esDonConocido(discipulador.don_espiritual) ? discipulador.don_espiritual || "" : discipulador.don_espiritual ? OPCION_OTRO_DON : "",
          don_espiritual_otro: esDonConocido(discipulador.don_espiritual) ? "" : discipulador.don_espiritual || "",
          fortalezas: discipulador.fortalezas || "",
          debilidades: discipulador.debilidades || "",
        }
      : undefined,
  });

  const fechaNacimiento = watch("fecha_nacimiento");
  const edad = fechaNacimiento ? calcularEdad(fechaNacimiento) : null;
  const donEspiritual = watch("don_espiritual");
  const esDonOtro = donEspiritual === OPCION_OTRO_DON;

  const onSubmit = async (data: EditarInput) => {
    if (!discipulador) return;
    setSaving(true);
    const supabase = createClient();
    const donEspiritualFinal =
      data.don_espiritual === OPCION_OTRO_DON
        ? data.don_espiritual_otro?.trim() || null
        : data.don_espiritual || null;
    const { error } = await supabase
      .from("profiles")
      .update({
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono || null,
        fecha_nacimiento: data.fecha_nacimiento || null,
        don_espiritual: donEspiritualFinal,
        fortalezas: data.fortalezas || null,
        debilidades: data.debilidades || null,
      })
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
          <div className="border-t pt-4 space-y-4">
            <p className="text-xs font-medium text-muted-foreground">Datos personales</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="editar-fecha-nacimiento" className={labelClass}>Fecha de nacimiento</Label>
                <Input id="editar-fecha-nacimiento" type="date" className={inputClass} {...register("fecha_nacimiento")} />
                {edad !== null && <p className="text-xs text-muted-foreground">Edad: {edad} años</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="editar-don-espiritual" className={labelClass}>Don espiritual</Label>
                <Select value={donEspiritual || undefined} onValueChange={(v) => setValue("don_espiritual", v?.toString() ?? "")} items={OPCIONES_DON_ESPIRITUAL.map((don) => ({ value: don, label: don }))}>
                  <SelectTrigger id="editar-don-espiritual" className="h-11 md:h-8">
                    <SelectValue placeholder="Seleccionar don" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCIONES_DON_ESPIRITUAL.map((don) => (
                      <SelectItem key={don} value={don}>{don}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {esDonOtro && (
                  <Input
                    id="editar-don-otro"
                    className="mt-2 h-11 md:h-8"
                    placeholder="Escribí el don..."
                    {...register("don_espiritual_otro")}
                  />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="editar-fortalezas" className={labelClass}>Fortalezas</Label>
              <Textarea id="editar-fortalezas" rows={3} className="text-sm" placeholder="Fortalezas del discipulador..." {...register("fortalezas")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editar-debilidades" className={labelClass}>Debilidades</Label>
              <Textarea id="editar-debilidades" rows={3} className="text-sm" placeholder="Debilidades del discipulador..." {...register("debilidades")} />
            </div>
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
