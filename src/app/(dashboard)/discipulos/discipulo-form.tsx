"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { discipuloSchema, type DiscipuloInput } from "@/lib/validations/discipulo";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Etapa, Profile } from "@/types/database";

interface DiscipuloFormProps {
  etapas: Etapa[];
  lideres: Pick<Profile, "id" | "nombre" | "apellido">[];
  initialData?: DiscipuloInput & { id?: string };
  isEditing?: boolean;
}

export function DiscipuloForm({
  etapas,
  lideres,
  initialData,
  isEditing,
}: DiscipuloFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DiscipuloInput>({
    resolver: zodResolver(discipuloSchema) as any,
    defaultValues: initialData || {
      etapa_id: 1,
      estado: "activo",
    },
  });

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
      const { error } = await supabase.from("discipulos").insert(payload);

      if (error) {
        toast.error("Error al crear discípulo");
      } else {
        toast.success("Discípulo creado exitosamente");
        router.push("/discipulos");
        router.refresh();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="apellido">Apellido *</Label>
            <Input id="apellido" {...register("apellido")} />
            {errors.apellido && (
              <p className="text-sm text-destructive">{errors.apellido.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" {...register("nombre")} />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
            <Input id="fecha_nacimiento" type="date" {...register("fecha_nacimiento")} />
          </div>
          <div className="space-y-2">
            <Label>Sexo</Label>
            <Select
              onValueChange={(value: any) => setValue("sexo", value as "M" | "F")}
              defaultValue={initialData?.sexo || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" {...register("telefono")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" {...register("direccion")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Espiritual</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fecha_conversion">Fecha de Conversión</Label>
            <Input id="fecha_conversion" type="date" {...register("fecha_conversion")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fecha_bautismo">Fecha de Bautismo</Label>
            <Input id="fecha_bautismo" type="date" {...register("fecha_bautismo")} />
          </div>
          <div className="space-y-2">
            <Label>Etapa *</Label>
            <Select
              onValueChange={(value: any) => setValue("etapa_id", parseInt(value ?? "1"))}
              defaultValue={String(initialData?.etapa_id || 1)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar etapa" />
              </SelectTrigger>
              <SelectContent>
                {etapas.map((etapa) => (
                  <SelectItem key={etapa.id} value={String(etapa.id)}>
                    {etapa.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              onValueChange={(value: any) => setValue("estado", value as DiscipuloInput["estado"])}
              defaultValue={initialData?.estado || "activo"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="retirado">Retirado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ministerio">Ministerio</Label>
            <Input id="ministerio" {...register("ministerio")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dones">Dones</Label>
            <Input id="dones" {...register("dones")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea id="observaciones" {...register("observaciones")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/discipulos")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Actualizar Discípulo" : "Crear Discípulo"}
        </Button>
      </div>
    </form>
  );
}
