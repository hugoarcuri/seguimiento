"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { discipuloSchema, type DiscipuloInput } from "@/lib/validations/discipulo";
import { generarAvatarUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import type { Etapa } from "@/types/database";

interface DiscipuloFormProps {
  etapas: Etapa[];
  initialData?: DiscipuloInput & { id?: string };
  isEditing?: boolean;
}

const inputClass = "h-9";
const inputLabelClass = "text-[11px] font-medium text-muted-foreground";

const sexoOptions: Array<{ value: "M" | "F"; label: string }> = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
];

const estadoOptions: Array<{ value: "activo" | "pausado" | "completado" | "retirado"; label: string }> = [
  { value: "activo", label: "Activo" },
  { value: "pausado", label: "Pausado" },
  { value: "completado", label: "Completado" },
  { value: "retirado", label: "Retirado" },
];

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value?: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function DiscipuloForm({
  etapas,
  initialData,
  isEditing,
}: DiscipuloFormProps) {
  const router = useRouter();
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DiscipuloInput>({
    resolver: zodResolver(discipuloSchema),
    defaultValues: initialData || {
      etapa_id: 1,
      estado: "activo",
    },
  });

  const sexo = watch("sexo") as "M" | "F" | null | undefined;
  const estado = watch("estado") as "activo" | "pausado" | "completado" | "retirado" | undefined;

  const uploadAvatar = async (file: File, discipuloId: string): Promise<string | null> => {
    setSubiendoAvatar(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${discipuloId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("discipulo-avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Error al subir foto"); setSubiendoAvatar(false); return null; }
    const { data: urlData } = supabase.storage.from("discipulo-avatars").getPublicUrl(path);
    setValue("avatar_url", urlData.publicUrl);
    setSubiendoAvatar(false);
    return urlData.publicUrl;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    setPendingFile(file);
  };

  const onSubmit = async (data: DiscipuloInput) => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Debes iniciar sesión");
      return;
    }

    const payload = {
      ...data,
      avatar_url: data.avatar_url || generarAvatarUrl(data.nombre, data.apellido),
      email: data.email || null,
      telefono: data.telefono || null,
      direccion: data.direccion || null,
      fecha_nacimiento: data.fecha_nacimiento || null,
      fecha_conversion: data.fecha_conversion || null,
      fecha_bautismo: data.fecha_bautismo || null,
      ministerio: data.ministerio || null,
      dones: data.dones || null,
      observaciones: data.observaciones || null,
    };

    if (isEditing && initialData?.id) {
      if (pendingFile) {
        const avatarUrl = await uploadAvatar(pendingFile, initialData.id);
        if (!avatarUrl) return;
        payload.avatar_url = avatarUrl;
      }

      const { error } = await supabase
        .from("discipulos")
        .update(payload)
        .eq("id", initialData.id);

      if (error) {
        toast.error("Error al actualizar discípulo");
      } else {
        toast.success("Discípulo actualizado");
        router.push("/discipulos");
        router.refresh();
      }
    } else {
      const { data: newDiscipulo, error } = await supabase
        .from("discipulos")
        .insert({ ...payload, lider_id: user.id })
        .select("id")
        .single();

      if (error) {
        toast.error("Error al crear discípulo");
      } else {
        if (pendingFile) {
          const avatarUrl = await uploadAvatar(pendingFile, newDiscipulo.id);
          if (avatarUrl) {
            await supabase
              .from("discipulos")
              .update({ avatar_url: avatarUrl })
              .eq("id", newDiscipulo.id);
          }
        }
        toast.success("Discípulo creado exitosamente");
        router.push("/discipulos");
        router.refresh();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto">
      {/* HERO */}
      <div className="flex flex-col items-center gap-3 pt-4 pb-6">
        <div className="relative group">
          {avatarPreview || initialData?.avatar_url ? (
            <img src={avatarPreview || initialData?.avatar_url || ""} alt="" className="w-28 h-28 rounded-full object-cover ring-4 ring-primary/20" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary font-bold text-4xl ring-4 ring-primary/20">
              {initialData?.nombre?.charAt(0)?.toUpperCase()}{initialData?.apellido?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={subiendoAvatar}
            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {subiendoAvatar ? <Loader2 className="h-7 w-7 text-white animate-spin" /> : <Camera className="h-7 w-7 text-white" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        {isEditing ? (
          <div className="text-center">
            <h2 className="text-lg font-semibold leading-tight">{initialData?.nombre} {initialData?.apellido}</h2>
            <p className="text-xs text-muted-foreground">Editar información del discípulo</p>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-lg font-semibold leading-tight">Nuevo discípulo</h2>
            <p className="text-xs text-muted-foreground">Completá los datos para comenzar el seguimiento</p>
          </div>
        )}
      </div>

      {/* DATOS PERSONALES */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
          <div className="space-y-1">
            <Label htmlFor="apellido" className={inputLabelClass}>Apellido *</Label>
            <Input id="apellido" className={inputClass} {...register("apellido")} aria-invalid={!!errors.apellido} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nombre" className={inputLabelClass}>Nombre *</Label>
            <Input id="nombre" className={inputClass} {...register("nombre")} aria-invalid={!!errors.nombre} />
          </div>
          <div className="space-y-1">
            <Label className={inputLabelClass}>Sexo</Label>
            <ChipGroup
              options={sexoOptions}
              value={sexo}
              onChange={(v) => setValue("sexo", v, { shouldValidate: true })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fecha_nacimiento" className={inputLabelClass}>Nacimiento</Label>
            <Input id="fecha_nacimiento" type="date" className={inputClass} {...register("fecha_nacimiento")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="telefono" className={inputLabelClass}>Teléfono</Label>
            <Input id="telefono" className={inputClass} {...register("telefono")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className={inputLabelClass}>Email</Label>
            <Input id="email" type="email" className={inputClass} {...register("email")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="direccion" className={inputLabelClass}>Dirección</Label>
            <Input id="direccion" className={inputClass} {...register("direccion")} />
          </div>
          <div className="space-y-1">
            <Label className={inputLabelClass}>Etapa</Label>
            <Select onValueChange={(v) => setValue("etapa_id", parseInt(v?.toString() ?? "1"))} defaultValue={String(initialData?.etapa_id || 1)}>
              <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
              <SelectContent>
                {etapas.map((etapa) => (
                  <SelectItem key={etapa.id} value={String(etapa.id)}>
                    <div className="flex flex-col">
                      <span>{etapa.nombre}</span>
                      {etapa.descripcion && <span className="text-[11px] text-muted-foreground">{etapa.descripcion}</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ESTADO + VIDA ESPIRITUAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className={inputLabelClass}>Estado</Label>
            <ChipGroup
              options={estadoOptions}
              value={estado}
              onChange={(v) => setValue("estado", v, { shouldValidate: true })}
            />
          </div>
          <div className="space-y-1">
            <Label className={inputLabelClass}>Ministerio</Label>
            <Input id="ministerio" className={inputClass} {...register("ministerio")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fecha_conversion" className={inputLabelClass}>Conversión</Label>
            <Input id="fecha_conversion" type="date" className={inputClass} {...register("fecha_conversion")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fecha_bautismo" className={inputLabelClass}>Bautismo</Label>
            <Input id="fecha_bautismo" type="date" className={inputClass} {...register("fecha_bautismo")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dones" className={inputLabelClass}>Dones</Label>
            <Input id="dones" className={inputClass} {...register("dones")} />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <Label htmlFor="observaciones" className={inputLabelClass}>Observaciones</Label>
            <Input id="observaciones" className={inputClass} {...register("observaciones")} />
          </div>
        </div>

        {(errors.nombre || errors.apellido || errors.email) && (
          <p className="text-xs text-destructive">
            {errors.apellido?.message || errors.nombre?.message || errors.email?.message}
          </p>
        )}
      </div>

      {/* STICKY FOOTER */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm pt-3 pb-2 mt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => router.push("/discipulos")}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Guardar Cambios" : "Crear Discípulo"}
        </Button>
      </div>
    </form>
  );
}
