"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { miembroSchema, type MiembroInput } from "@/lib/validations/discipulo";
import { generarAvatarUrl, calcularEdad } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { OPCIONES_DON_ESPIRITUAL } from "@/app/(dashboard)/discipuladores/discipulador-constants";

interface MiembroFormProps {
  etapas: Etapa[];
  discipuladores?: Array<{ id: string; nombre: string; apellido: string }>;
  initialData?: MiembroInput & { id?: string };
  isEditing?: boolean;
}

const inputClass = "h-11 md:h-10 text-sm";
const inputLabelClass = "text-xs font-medium text-muted-foreground";

const sexoOptions: Array<{ value: "M" | "F"; label: string }> = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
];

function EtapaLabel({ etapa }: { etapa: Etapa }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0 py-0.5">
      <span className="truncate text-sm font-medium">{etapa.nombre}</span>
      {etapa.descripcion && (
        <span className="truncate text-[11px] text-muted-foreground leading-snug">{etapa.descripcion}</span>
      )}
    </div>
  );
}

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
            className={`min-h-11 md:min-h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
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

export function MiembroForm({
  etapas,
  discipuladores = [],
  initialData,
  isEditing,
}: MiembroFormProps) {
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
  } = useForm<MiembroInput>({
    resolver: zodResolver(miembroSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          lider_id: initialData.lider_id || "",
          bautizado: initialData.bautizado ?? !!initialData.fecha_bautismo,
          es_miembro: initialData.es_miembro ?? false,
        }
      : {
          etapa_id: 1,
          estado: "activo",
          bautizado: false,
          es_miembro: false,
          lider_id: "",
        },
  });

  const sexo = watch("sexo") as "M" | "F" | null | undefined;
  const fechaNacimiento = watch("fecha_nacimiento") as string | undefined;
  const edad = fechaNacimiento ? calcularEdad(fechaNacimiento) : null;
  const bautizado = !!watch("bautizado");
  const esMiembro = !!watch("es_miembro");

  const uploadAvatar = async (file: File, miembroId: string): Promise<string | null> => {
    setSubiendoAvatar(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${miembroId}.${ext}`;
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

  const onSubmit = async (data: MiembroInput) => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Debes iniciar sesión");
      return;
    }

    if (!isEditing && !data.email) {
      toast.error("El email es requerido para poder vincular la cuenta después");
      return;
    }

    const payload = {
      ...data,
      lider_id: data.lider_id || null,
      bautizado: data.bautizado ?? false,
      es_miembro: data.es_miembro ?? false,
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
      convive_con: data.convive_con || null,
    };

    if (isEditing && initialData?.id) {
      if (pendingFile) {
        const avatarUrl = await uploadAvatar(pendingFile, initialData.id);
        if (!avatarUrl) return;
        payload.avatar_url = avatarUrl;
      }

      const { error } = await supabase
        .from("miembros")
        .update(payload)
        .eq("id", initialData.id);

      if (error) {
        toast.error("Error al actualizar miembro");
      } else {
        toast.success("Miembro actualizado");
        router.push("/miembros");
        router.refresh();
      }
    } else {
      const { data: newMiembro, error } = await supabase
        .from("miembros")
        .insert({ ...payload, user_id: null, lider_id: data.lider_id || user.id })
        .select("id")
        .single();

      if (error) {
        toast.error("Error al crear miembro");
        return;
      }

      if (pendingFile) {
        const avatarUrl = await uploadAvatar(pendingFile, newMiembro.id);
        if (avatarUrl) {
          await supabase
            .from("miembros")
            .update({ avatar_url: avatarUrl })
            .eq("id", newMiembro.id);
        }
      }

      if (data.password && data.email) {
        const { error: fnError } = await supabase.functions.invoke("create-miembro-user", {
          body: {
            miembro_id: newMiembro.id,
            email: data.email,
            password: data.password,
            nombre: data.nombre,
            apellido: data.apellido,
          },
        });

        if (fnError) {
          toast.success("Miembro creado. Error al crear cuenta de acceso: " + fnError.message);
        } else {
          toast.success("Miembro y cuenta de acceso creados. Ya puede iniciar sesión.");
        }
      } else {
        toast.success("Miembro creado. Cuando se registre con su email, se vinculará automáticamente.");
      }

      setTimeout(() => {
        router.push("/miembros");
        router.refresh();
      }, 1500);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto">
      {/* HERO */}
      <div className="flex flex-col items-center gap-3 pt-4 pb-6">
        <div className="relative group">
          {avatarPreview || initialData?.avatar_url ? (
            <Image src={avatarPreview || initialData?.avatar_url || ""} alt="" width={112} height={112} className="w-28 h-28 rounded-full object-cover ring-4 ring-primary/20" />
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
            <p className="text-xs text-muted-foreground">Editar información del miembro</p>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-lg font-semibold leading-tight">Nuevo miembro</h2>
            <p className="text-xs text-muted-foreground">Completá los datos para comenzar el seguimiento. La cuenta de acceso se vincula al registrarse.</p>
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
            {edad !== null && <p className="text-xs text-muted-foreground">Edad: {edad} años</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="telefono" className={inputLabelClass}>Teléfono</Label>
            <Input id="telefono" className={inputClass} {...register("telefono")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className={inputLabelClass}>Email *</Label>
            <Input id="email" type="email" className={inputClass} {...register("email")} />
          </div>
          {!isEditing && (
            <div className="space-y-1">
              <Label htmlFor="password" className={inputLabelClass}>Contraseña</Label>
              <Input id="password" type="password" className={inputClass} {...register("password")} placeholder="Opcional" />
              <p className="text-[11px] text-muted-foreground">Si se completa, el miembro podrá iniciar sesión</p>
            </div>
          )}
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="direccion" className={inputLabelClass}>Dirección</Label>
            <Input id="direccion" className={inputClass} {...register("direccion")} />
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-4">
            <Label htmlFor="convive_con" className={inputLabelClass}>¿Con quién vive?</Label>
            <Input id="convive_con" className={inputClass} {...register("convive_con")} placeholder="Ej.: con sus padres, solo/a..." />
          </div>
        </div>

        {/* ETAPA */}
        <div className="space-y-1 pt-2">
          <Label className={inputLabelClass}>Etapa *</Label>
          <Select
            onValueChange={(v) => setValue("etapa_id", parseInt(v?.toString() ?? "1"))}
            defaultValue={String(initialData?.etapa_id || 1)}
            items={etapas.map((e) => ({ value: String(e.id), label: <EtapaLabel etapa={e} /> }))}
          >
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[20rem] min-h-14 *:data-[slot=select-value]:items-start *:data-[slot=select-value]:!line-clamp-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[15rem]">
              {etapas.map((etapa) => (
                <SelectItem key={etapa.id} value={String(etapa.id)}>
                  <EtapaLabel etapa={etapa} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.etapa_id && <p className="text-sm text-destructive">{errors.etapa_id.message}</p>}
        </div>

        {/* DISCIPULADOR */}
        <div className="space-y-1 pt-2">
          <Label className={inputLabelClass}>Discipulador</Label>
          <Select
            onValueChange={(v) => setValue("lider_id", v?.toString() === "none" ? "" : v?.toString() ?? "", { shouldValidate: true })}
            defaultValue={String(initialData?.lider_id || "none")}
            items={[
              { value: "none", label: "Sin asignar" },
              ...discipuladores.map((d) => ({ value: d.id, label: `${d.apellido}, ${d.nombre}` })),
            ]}
          >
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[15rem] min-h-11 md:min-h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[15rem]">
              <SelectItem value="none">Sin asignar</SelectItem>
              {discipuladores.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.apellido}, {d.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* VIDA ESPIRITUAL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-2">
          <div className="space-y-1">
            <Label htmlFor="fecha_conversion" className={inputLabelClass}>Conversión</Label>
            <Input id="fecha_conversion" type="date" className={inputClass} {...register("fecha_conversion")} />
          </div>
          <div className="space-y-1">
            <Label className={inputLabelClass}>Don Espiritual</Label>
            <Select value={watch("dones") || undefined} onValueChange={(v) => setValue("dones", v?.toString() === "none" ? "" : v?.toString() ?? "", { shouldValidate: true })}>
              <SelectTrigger className={inputClass}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin don</SelectItem>
                {OPCIONES_DON_ESPIRITUAL.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={inputLabelClass}>Marcas espirituales</Label>
            <div className="flex h-11 md:h-8 flex-wrap items-center gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={bautizado}
                  onCheckedChange={(v) => { setValue("bautizado", !!v); if (!v) setValue("fecha_bautismo", ""); }}
                />
                Está bautizado
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={esMiembro}
                  onCheckedChange={(v) => setValue("es_miembro", !!v)}
                />
                Es miembro
              </label>
            </div>
          </div>
          {bautizado && (
            <div className="space-y-1">
              <Label htmlFor="fecha_bautismo" className={inputLabelClass}>Fecha de bautismo</Label>
              <Input id="fecha_bautismo" type="date" className={inputClass} {...register("fecha_bautismo")} />
            </div>
          )}
          <div className="space-y-1">
            <Label className={inputLabelClass}>Ministerio</Label>
            <Input id="ministerio" className={inputClass} {...register("ministerio")} />
          </div>
          <div className="space-y-1">
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
        <Button type="button" variant="outline" size="sm" onClick={() => router.push("/miembros")}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Guardar Cambios" : "Crear Miembro"}
        </Button>
      </div>
    </form>
  );
}
