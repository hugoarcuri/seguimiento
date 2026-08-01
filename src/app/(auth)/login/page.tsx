"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { BASE_PATH } from "@/lib/constants/paths";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [recuperarEmail, setRecuperarEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleRecuperar = async () => {
    if (!recuperarEmail.trim()) { toast.error("Ingresá tu email"); return; }
    setEnviando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(recuperarEmail.trim(), {
      redirectTo: `${window.location.origin}${BASE_PATH}/restablecer`,
    });
    setEnviando(false);
    if (error) { toast.error(error.message); return; }
    setEnviado(true);
    toast.success("Revisá tu email para restablecer la contraseña");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Image src={`${BASE_PATH}/logo.png`} alt="JH" width={48} height={48} className="rounded" />
          </div>
          <CardTitle className="text-2xl font-bold">Discipulado</CardTitle>
          <CardDescription>{modoRecuperar ? "Restablecé tu contraseña" : "Inicia sesión para continuar"}</CardDescription>
        </CardHeader>
        {modoRecuperar ? (
          <CardContent className="space-y-4">
            {enviado ? (
              <p className="text-sm text-center text-muted-foreground">
                Si el email está registrado, vas a recibir un link para restablecer tu contraseña.
              </p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="rec-email">Email</Label>
                <Input id="rec-email" type="email" placeholder="tu@email.com" value={recuperarEmail} onChange={(e) => setRecuperarEmail(e.target.value)} />
              </div>
            )}
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} />
                {errors.email && (<p className="text-sm text-destructive">{errors.email.message}</p>)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (<p className="text-sm text-destructive">{errors.password.message}</p>)}
                <button type="button" onClick={() => setModoRecuperar(true)} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar sesión
              </Button>
              <p className="text-sm text-muted-foreground">
                ¿No tenés cuenta?{" "}
                <Link href="/register" className="text-primary hover:underline">Registrarse</Link>
              </p>
            </CardFooter>
          </form>
        )}
        <CardFooter className="flex flex-col gap-2 pt-0">
          {modoRecuperar && !enviado && (
            <Button className="w-full" onClick={handleRecuperar} disabled={enviando}>
              {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar link de recuperación
            </Button>
          )}
          {modoRecuperar && (
            <button type="button" onClick={() => { setModoRecuperar(false); setEnviado(false); }} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Volver al inicio de sesión
            </button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
