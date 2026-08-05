"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FunctionsHttpError } from "@supabase/supabase-js";
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

const crearSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type CrearInput = z.infer<typeof crearSchema>;

const inputClass = "h-11 md:h-8";
const labelClass = "text-[11px] font-medium text-muted-foreground";

interface CrearDiscipuladorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreado?: () => void;
}

export function CrearDiscipuladorDialog({ open, onOpenChange, onCreado }: CrearDiscipuladorDialogProps) {
  const [invoking, setInvoking] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CrearInput>({ resolver: zodResolver(crearSchema) });

  const onSubmit = async (data: CrearInput) => {
    setInvoking(true);
    const supabase = createClient();
    const { error } = await supabase.functions.invoke("create-discipulador", {
      body: { ...data, telefono: data.telefono || null },
    });
    setInvoking(false);

    if (error) {
      let msg = "Error al crear el discipulador";
      if (error instanceof FunctionsHttpError) {
        try {
          const body = await error.context.json();
          if (body?.error) msg = body.error;
        } catch {
          // cuerpo no legible
        }
      } else if (error.message) {
        msg = error.message;
      }
      if (/deploy|fetch|not found|404|not deployed/i.test(msg)) {
        toast.error(
          "La Edge Function no está desplegada. En la raíz del proyecto ejecutá:\nsupabase functions deploy create-discipulador --project-ref kbyklyueupqjwsvtfcxz"
        );
      } else {
        toast.error(msg);
      }
      return;
    }

    toast.success("Discipulador creado exitosamente");
    reset();
    onOpenChange(false);
    onCreado?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!invoking) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Discipulador</DialogTitle>
          <DialogDescription>
            Crea una cuenta de usuario con rol discipulador para que pueda vincularse con discípulos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="crear-nombre" className={labelClass}>Nombre *</Label>
              <Input id="crear-nombre" className={inputClass} {...register("nombre")} aria-invalid={!!errors.nombre} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="crear-apellido" className={labelClass}>Apellido *</Label>
              <Input id="crear-apellido" className={inputClass} {...register("apellido")} aria-invalid={!!errors.apellido} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="crear-email" className={labelClass}>Email *</Label>
            <Input id="crear-email" type="email" className={inputClass} {...register("email")} aria-invalid={!!errors.email} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="crear-telefono" className={labelClass}>Teléfono</Label>
            <Input id="crear-telefono" className={inputClass} {...register("telefono")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="crear-password" className={labelClass}>Contraseña *</Label>
            <Input id="crear-password" type="password" className={inputClass} {...register("password")} aria-invalid={!!errors.password} />
          </div>
          {(errors.nombre || errors.apellido || errors.email || errors.password) && (
            <p className="text-xs text-destructive">
              {errors.nombre?.message || errors.apellido?.message || errors.email?.message || errors.password?.message}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={invoking}>
              Cancelar
            </Button>
            <Button type="submit" disabled={invoking}>
              {invoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Discipulador
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
