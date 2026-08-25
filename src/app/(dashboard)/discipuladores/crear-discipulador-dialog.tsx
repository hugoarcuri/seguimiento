"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { calcularEdad } from "@/lib/utils";
import { OPCIONES_DON_ESPIRITUAL, OPCION_OTRO_DON } from "./discipulador-constants";

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
  don_espiritual: z.string().optional(),
  don_espiritual_otro: z.string().optional(),
  bautizado: z.boolean().optional(),
  es_miembro: z.boolean().optional(),
  fortalezas: z.string().optional(),
  debilidades: z.string().optional(),
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
    watch,
    setValue,
    formState: { errors },
  } = useForm<CrearInput>({ resolver: zodResolver(crearSchema) });

  const sexo = watch("sexo") as "M" | "F" | null | undefined;
  const fechaNacimiento = watch("fecha_nacimiento");
  const edad = fechaNacimiento ? calcularEdad(fechaNacimiento) : null;
  const donEspiritual = watch("don_espiritual");
  const esDonOtro = donEspiritual === OPCION_OTRO_DON;

  const onSubmit = async (data: CrearInput) => {
    setInvoking(true);
    const supabase = createClient();
    let msg: string | null = null;
    let restored = false;
    try {
      const donEspiritualFinal =
        data.don_espiritual === OPCION_OTRO_DON
          ? data.don_espiritual_otro?.trim() || null
          : data.don_espiritual || null;
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
          <div className="border-t pt-4 space-y-4">
            <p className="text-xs font-medium text-muted-foreground">Datos personales</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="crear-fecha-nacimiento" className={labelClass}>Fecha de nacimiento</Label>
                <Input id="crear-fecha-nacimiento" type="date" className={inputClass} {...register("fecha_nacimiento")} />
                {edad !== null && <p className="text-xs text-muted-foreground">Edad: {edad} años</p>}
              </div>
              <div className="space-y-1">
                <Label className={labelClass}>Sexo</Label>
                <div className="flex gap-1.5">
                  {(["M", "F"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => setValue("sexo", sexo === v ? null : v, { shouldValidate: true })}
                      className={`flex-1 h-8 rounded-md text-[11px] font-medium transition-colors ${sexo === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {v === "M" ? "Masculino" : "Femenino"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="crear-direccion" className={labelClass}>Dirección</Label>
                <Input id="crear-direccion" className={inputClass} {...register("direccion")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="crear-convive" className={labelClass}>¿Con quién vive?</Label>
                <Input id="crear-convive" className={inputClass} {...register("convive_con")} placeholder="Ej.: con sus padres, solo/a..." />
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <p className="text-xs font-medium text-muted-foreground">Vida espiritual</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="crear-fecha-conversion" className={labelClass}>Conversión</Label>
                  <Input id="crear-fecha-conversion" type="date" className={inputClass} {...register("fecha_conversion")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="crear-don-espiritual" className={labelClass}>Don espiritual</Label>
                  <Select value={donEspiritual || undefined} onValueChange={(v) => setValue("don_espiritual", v?.toString() ?? "")} items={OPCIONES_DON_ESPIRITUAL.map((don) => ({ value: don, label: don }))}>
                    <SelectTrigger id="crear-don-espiritual" className="h-11 md:h-8">
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
                      id="crear-don-otro"
                      className="mt-2 h-11 md:h-8"
                      placeholder="Escribí el don..."
                      {...register("don_espiritual_otro")}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox checked={!!watch("bautizado")} onCheckedChange={(v) => setValue("bautizado", !!v)} />
                  Bautizado
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox checked={!!watch("es_miembro")} onCheckedChange={(v) => setValue("es_miembro", !!v)} />
                  Es miembro
                </label>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="crear-fortalezas" className={labelClass}>Fortalezas</Label>
              <Textarea id="crear-fortalezas" rows={3} className="text-sm" placeholder="Fortalezas del discipulador..." {...register("fortalezas")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="crear-debilidades" className={labelClass}>Debilidades</Label>
              <Textarea id="crear-debilidades" rows={3} className="text-sm" placeholder="Debilidades del discipulador..." {...register("debilidades")} />
            </div>
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
