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
import { GoogleIcon } from "@/components/icons/google-icon";
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

  const handleGoogle = async () => {
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}${BASE_PATH}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted p-4">
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-44 -left-28 h-[26rem] w-[26rem] rounded-full bg-primary/10 blur-3xl" />
      <Card className="relative w-full max-w-sm shadow-pop ring-1 ring-primary/10">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <span className="relative inline-flex shrink-0 rounded-2xl bg-primary/10 p-3 ring-1 ring-primary/20">
              <Image src={`${BASE_PATH}/logo.png`} alt="JH" width={48} height={48} className="rounded-xl" />
            </span>
          </div>
          <CardTitle className="font-heading text-3xl tracking-tight">Discipulado</CardTitle>
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
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
                <GoogleIcon className="h-4 w-4 mr-2" />
                Continuar con Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">o</span>
                </div>
              </div>
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
