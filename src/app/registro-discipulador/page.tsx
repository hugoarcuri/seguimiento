"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { calcularEdad } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { BASE_PATH } from "@/lib/constants/paths";
import { OPCIONES_DON_ESPIRITUAL, OPCION_OTRO_DON } from "@/app/(dashboard)/discipuladores/discipulador-constants";

const inputClass = "h-11 md:h-10 text-sm";
const inputLabelClass = "text-xs font-medium text-muted-foreground";

const sexoOptions: Array<{ value: "M" | "F"; label: string }> = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
];

const schema = z
  .object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
    sexo: z.enum(["M", "F"]).optional().nullable(),
    fecha_nacimiento: z.string().optional().nullable(),
    telefono: z.string().optional().nullable(),
    direccion: z.string().optional().nullable(),
    convive_con: z.string().optional().nullable(),
    fecha_conversion: z.string().optional().nullable(),
    don_espiritual: z.string().optional().nullable(),
    bautizado: z.boolean().optional(),
    es_miembro: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type FormInput = z.infer<typeof schema>;

function SexoChips({ value, onChange }: { value?: "M" | "F" | null; onChange: (v: "M" | "F") => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {sexoOptions.map((opt) => {
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

export default function RegistroDiscipuladorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exitoso, setExitoso] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      bautizado: false,
      es_miembro: false,
    },
  });

  const sexo = watch("sexo") as "M" | "F" | null | undefined;
  const fechaNacimiento = watch("fecha_nacimiento") as string | undefined;
  const edad = fechaNacimiento ? calcularEdad(fechaNacimiento) : null;
  const donEspiritual = watch("don_espiritual") as string | undefined;

  const onSubmit = async (data: FormInput) => {
    setLoading(true);
    const supabase = createClient();

    const donFinal = donEspiritual === OPCION_OTRO_DON ? null : donEspiritual || null;

    const { error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        data: {
          registro_discipulador: true,
          nombre: data.nombre.trim(),
          apellido: data.apellido.trim(),
          sexo: data.sexo || null,
          fecha_nacimiento: data.fecha_nacimiento || null,
          telefono: data.telefono || null,
          direccion: data.direccion || null,
          convive_con: data.convive_con || null,
          fecha_conversion: data.fecha_conversion || null,
          don_espiritual: donFinal,
          bautizado: data.bautizado ?? false,
          es_miembro: data.es_miembro ?? false,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setExitoso(true);
    setLoading(false);
  };

  if (exitoso) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="space-y-4 pt-6">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold">¡Registro exitoso!</h2>
              <p className="text-sm text-muted-foreground">
                Tu cuenta de discipulador fue creada. Ya podés iniciar sesión.
              </p>
            </div>
            <Button className="w-full mt-4" onClick={() => router.push("/login")}>
              Ir a iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Image src={`${BASE_PATH}/logo.png`} alt="Discipulado" width={48} height={48} className="rounded" />
          </div>
          <CardTitle className="text-2xl font-bold">Registro de Discipulador</CardTitle>
          <CardDescription className="text-xs">Completá tus datos para comenzar a discipular</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* ACCESO */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="email" className={inputLabelClass}>Email *</Label>
                  <Input id="email" type="email" className={inputClass} {...register("email")} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label className={inputLabelClass}>Contraseña *</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className={`${inputClass} pr-10`} {...register("password")} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className={inputLabelClass}>Confirmar Contraseña *</Label>
                  <div className="relative">
                    <Input type={showConfirm ? "text" : "password"} placeholder="••••••••" className={`${inputClass} pr-10`} {...register("confirmPassword")} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* DATOS PERSONALES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
              <div className="space-y-1">
                <Label htmlFor="apellido" className={inputLabelClass}>Apellido *</Label>
                <Input id="apellido" className={inputClass} {...register("apellido")} />
                {errors.apellido && <p className="text-sm text-destructive">{errors.apellido.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="nombre" className={inputLabelClass}>Nombre *</Label>
                <Input id="nombre" className={inputClass} {...register("nombre")} />
                {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className={inputLabelClass}>Sexo</Label>
                <SexoChips
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
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="direccion" className={inputLabelClass}>Dirección</Label>
                <Input id="direccion" className={inputClass} {...register("direccion")} />
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                <Label htmlFor="convive_con" className={inputLabelClass}>¿Con quién vive?</Label>
                <Input id="convive_con" className={inputClass} {...register("convive_con")} placeholder="Ej.: con sus padres, solo/a..." />
              </div>
            </div>

            {/* VIDA ESPIRITUAL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1">
                <Label htmlFor="fecha_conversion" className={inputLabelClass}>Conversión</Label>
                <Input id="fecha_conversion" type="date" className={inputClass} {...register("fecha_conversion")} />
              </div>
              <div className="space-y-1">
                <Label className={inputLabelClass}>Don Espiritual</Label>
                <Select value={donEspiritual || undefined} onValueChange={(v) => setValue("don_espiritual", v?.toString() || null, { shouldValidate: true })}>
                  <SelectTrigger className={inputClass}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {OPCIONES_DON_ESPIRITUAL.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className={inputLabelClass}>Marcas espirituales</Label>
                <div className="flex h-11 md:min-h-8 flex-wrap items-center gap-6">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={!!watch("bautizado")}
                      onCheckedChange={(v) => setValue("bautizado", !!v)}
                    />
                    Bautizado
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={!!watch("es_miembro")}
                      onCheckedChange={(v) => setValue("es_miembro", !!v)}
                    />
                    Es miembro
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrarme
            </Button>
            <p className="text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="text-primary hover:underline">Iniciar sesión</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
