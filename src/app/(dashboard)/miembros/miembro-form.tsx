"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { miembroSchema, type MiembroInput } from "@/lib/validations/discipulo";
import { generarAvatarUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import type { Etapa } from "@/types/database";
import { PersonaFormFields } from "@/components/persona-form-fields";

interface MiembroFormProps {
  etapas: Etapa[];
  discipuladores?: Array<{ id: string; nombre: string; apellido: string }>;
  initialData?: MiembroInput & { id?: string };
  isEditing?: boolean;
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

    const { password: _password, ...rest } = data;
    const payload = {
      ...rest,
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
        return;
      }

      if (data.password && data.email) {
        const { error: fnError } = await supabase.rpc("set_miembro_password", {
          p_miembro_id: initialData.id,
          p_email: data.email,
          p_password: data.password,
          p_nombre: data.nombre,
          p_apellido: data.apellido,
        });

        if (fnError) {
          toast.error("Error al actualizar contraseña: " + fnError.message);
        } else {
          toast.success("Miembro y contraseña actualizados");
        }
      } else {
        toast.success("Miembro actualizado");
      }

      router.push("/miembros");
      router.refresh();
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
        const { error: fnError } = await supabase.rpc("set_miembro_password", {
          p_miembro_id: newMiembro.id,
          p_email: data.email,
          p_password: data.password,
          p_nombre: data.nombre,
          p_apellido: data.apellido,
        });

        if (fnError) {
          toast.success("Miembro creado. Error al crear cuenta: " + fnError.message);
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
      <PersonaFormFields
        mode={isEditing ? "admin-edit" : "admin-create"}
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
        etapas={etapas}
        discipuladores={discipuladores}
      />

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
