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
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Loader2, User, Calendar, Phone, Mail, MapPin, Church, Target, Activity, FileText, Camera } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import type { Etapa, Profile } from "@/types/database";

interface DiscipuloFormProps {
  etapas: Etapa[];
  lideres: Pick<Profile, "id" | "nombre" | "apellido">[];
  initialData?: DiscipuloInput & { id?: string };
  isEditing?: boolean;
}

const inputClass = "h-9";

export function DiscipuloForm({
  etapas,
  lideres,
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
    formState: { errors, isSubmitting },
  } = useForm<DiscipuloInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(discipuloSchema) as any,
    defaultValues: initialData || {
      etapa_id: 1,
      estado: "activo",
    },
  });

  const uploadAvatar = async (file: File, discipuloId: string) => {
    setSubiendoAvatar(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${discipuloId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("discipulo-avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Error al subir foto"); setSubiendoAvatar(false); return; }
    const { data: urlData } = supabase.storage.from("discipulo-avatars").getPublicUrl(path);
    setValue("avatar_url", urlData.publicUrl);
    setSubiendoAvatar(false);
    toast.success("Foto actualizada");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    setPendingFile(file);
    if (isEditing && initialData?.id) {
      uploadAvatar(file, initialData.id);
    }
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
      lider_id: user.id,
      avatar_url: data.avatar_url || (pendingFile ? undefined : generarAvatarUrl(data.nombre, data.apellido)),
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
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        toast.error("Error al crear discípulo");
      } else {
        if (pendingFile) {
          await uploadAvatar(pendingFile, newDiscipulo.id);
        }
        toast.success("Discípulo creado exitosamente");
        router.push("/discipulos");
        router.refresh();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              {avatarPreview || initialData?.avatar_url ? (
                <img src={avatarPreview || initialData?.avatar_url || ""} alt="" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                  {initialData?.nombre?.charAt(0)?.toUpperCase()}{initialData?.apellido?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={subiendoAvatar}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {subiendoAvatar ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-1.5 md:col-span-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b pb-1.5 mb-3">
                <User className="h-4 w-4" /> Datos personales
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellido" className="text-xs">Apellido *</Label>
              <Input id="apellido" className={inputClass} {...register("apellido")} />
              {errors.apellido && <p className="text-xs text-destructive">{errors.apellido.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-xs">Nombre *</Label>
              <Input id="nombre" className={inputClass} {...register("nombre")} />
              {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sexo" className="text-xs">Sexo</Label>
              <Select onValueChange={(v) => setValue("sexo", (v?.toString() ?? "M") as "M" | "F")} defaultValue={initialData?.sexo || undefined}>
                <SelectTrigger className={inputClass}><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_nacimiento" className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Nacimiento</Label>
              <Input id="fecha_nacimiento" type="date" className={inputClass} {...register("fecha_nacimiento")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefono" className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Teléfono</Label>
              <Input id="telefono" className={inputClass} {...register("telefono")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
              <Input id="email" type="email" className={inputClass} {...register("email")} />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="direccion" className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> Dirección</Label>
              <Input id="direccion" className={inputClass} {...register("direccion")} />
            </div>

            <div className="space-y-1.5 md:col-span-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b pb-1.5 mb-3 mt-1">
                <Church className="h-4 w-4" /> Vida espiritual
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_conversion" className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Conversión</Label>
              <Input id="fecha_conversion" type="date" className={inputClass} {...register("fecha_conversion")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_bautismo" className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Bautismo</Label>
              <Input id="fecha_bautismo" type="date" className={inputClass} {...register("fecha_bautismo")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Target className="h-3 w-3" /> Etapa</Label>
              <Select onValueChange={(v) => setValue("etapa_id", parseInt(v?.toString() ?? "1"))} defaultValue={String(initialData?.etapa_id || 1)}>
                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa.id} value={String(etapa.id)}>{etapa.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Activity className="h-3 w-3" /> Estado</Label>
              <Select onValueChange={(v) => setValue("estado", (v?.toString() ?? "activo") as "activo" | "pausado" | "completado" | "retirado")} defaultValue={initialData?.estado || "activo"}>
                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="retirado">Retirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ministerio" className="text-xs">Ministerio</Label>
              <Input id="ministerio" className={inputClass} {...register("ministerio")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dones" className="text-xs">Dones</Label>
              <Input id="dones" className={inputClass} {...register("dones")} />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <Label htmlFor="observaciones" className="text-xs flex items-center gap-1"><FileText className="h-3 w-3" /> Observaciones</Label>
              <Input id="observaciones" className={inputClass} {...register("observaciones")} />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push("/discipulos")}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Crear Discípulo"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
