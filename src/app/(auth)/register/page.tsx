"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BASE_PATH } from "@/lib/constants/paths";
import { GoogleIcon } from "@/components/icons/google-icon";
import { OPCION_OTRO_DON } from "@/app/(dashboard)/discipuladores/discipulador-constants";
import { PersonaFormFields } from "@/components/persona-form-fields";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      bautizado: false,
      es_miembro: false,
    },
  });

  const donEspiritual = watch("dones") as string | undefined;

  const handleGoogle = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${BASE_PATH}/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    const supabase = createClient();

    const donFinal = donEspiritual === OPCION_OTRO_DON ? null : donEspiritual || null;

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          registro_miembro: true,
          nombre: data.nombre,
          apellido: data.apellido,
          sexo: data.sexo || null,
          fecha_nacimiento: data.fecha_nacimiento || null,
          telefono: data.telefono || null,
          direccion: data.direccion || null,
          convive_con: data.convive_con || null,
          fecha_conversion: data.fecha_conversion || null,
          don_espiritual: donFinal,
          bautizado: data.bautizado ?? false,
          es_miembro: data.es_miembro ?? false,
          estudia: data.estudia || null,
          trabaja: data.trabaja || null,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Registro exitoso. Iniciá sesión.");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Image src={`${BASE_PATH}/logo.png`} alt="JH" width={48} height={48} className="rounded" />
          </div>
          <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
          <CardDescription>Regístrate en el sistema de discipulado</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
              <GoogleIcon className="h-4 w-4 mr-2" />
              Registrarse con Google
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">o</span>
              </div>
            </div>

            <PersonaFormFields
              mode="self-register"
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear cuenta
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
