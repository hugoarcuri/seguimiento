"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
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
import { OPCION_OTRO_DON } from "./discipulador-constants";
import { PersonaFormFields } from "@/components/persona-form-fields";

const crearSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  fecha_nacimiento: z.string().optional(),
  sexo: z.enum(["M", "F"]).optional().nullable(),
  direccion: z.string().optional(),
  convive_con: z.string().optional(),
  fecha_conversion: z.string().optional(),
  dones: z.string().optional(),
  dones_otro: z.string().optional(),
  bautizado: z.boolean().optional(),
  es_miembro: z.boolean().optional(),
  fortalezas: z.string().optional(),
  debilidades: z.string().optional(),
});

type CrearInput = z.infer<typeof crearSchema>;

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
    watch,
    setValue,
    formState: { errors },
  } = useForm<CrearInput>({ resolver: zodResolver(crearSchema) });

  const onSubmit = async (data: CrearInput) => {
    setInvoking(true);
    const supabase = createClient();
    let msg: string | null = null;
    let restored = false;
    try {
      const donEspiritualFinal =
        data.dones === OPCION_OTRO_DON
          ? data.dones_otro?.trim() || null
          : data.dones || null;
      const { data: result, error } = await supabase.functions.invoke("create-discipulador", {
        body: {
          ...data,
          telefono: data.telefono || null,
          fecha_nacimiento: data.fecha_nacimiento || null,
          sexo: data.sexo || null,
          direccion: data.direccion || null,
          convive_con: data.convive_con || null,
          fecha_conversion: data.fecha_conversion || null,
          don_espiritual: donEspiritualFinal,
          bautizado: data.bautizado ?? false,
          es_miembro: data.es_miembro ?? false,
          fortalezas: data.fortalezas || null,
          debilidades: data.debilidades || null,
        },
      });
      if (error) {
        if (error instanceof FunctionsHttpError) {
          try {
            const body = await error.context.json();
            msg = body?.error || "Error al crear el discipulador";
          } catch {
            msg = "Error al crear el discipulador";
          }
        } else {
          msg = error.message || "Error al crear el discipulador";
        }
      } else {
        restored = !!result?.restored;
      }
    } catch (err) {
      msg = (err as Error)?.message || "Error al conectar con el servidor";
    }
    setInvoking(false);

    if (msg) {
      if (/deploy|fetch|not found|404|not deployed|failed|network|blocked/i.test(msg)) {
        toast.error(
          "La Edge Function no está desplegada o no responde. En la raíz del proyecto ejecutá:\nsupabase functions deploy create-discipulador --project-ref kbyklyueupqjwsvtfcxz"
        );
      } else {
        toast.error(msg);
      }
      return;
    }

    const texto = restored ? "Discipulador restaurado exitosamente" : "Discipulador creado exitosamente";
    toast.success(texto);
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
            Crea una cuenta de usuario con rol discipulador para que pueda vincularse con miembros.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <PersonaFormFields
            mode="admin-discipulador"
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
          />
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
