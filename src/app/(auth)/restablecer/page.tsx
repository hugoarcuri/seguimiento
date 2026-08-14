"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { BASE_PATH } from "@/lib/constants/paths";

export default function RestablecerPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [valido, setValido] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, "?"));
    const token = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const supabase = createClient();
    if (!token) {
      const t = setTimeout(() => setError("Link inválido o expirado"), 0);
      return () => clearTimeout(t);
    }
    // El flujo de recovery de Supabase requiere establecer la sesión
    // antes de poder llamar a updateUser().
    supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken || "",
    }).then(({ error }) => {
      if (error) {
        setError("Link inválido o expirado");
        return;
      }
      setValido(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
    if (password !== confirmPassword) { toast.error("Las contraseñas no coinciden"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { toast.error(err.message); return; }
    toast.success("Contraseña actualizada. Iniciá sesión con tu nueva contraseña.");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Image src={`${BASE_PATH}/logo.png`} alt="JH" width={48} height={48} className="rounded" />
          </div>
          <CardTitle className="text-2xl font-bold">Restablecer contraseña</CardTitle>
          <CardDescription>Ingresá tu nueva contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive text-center">{error}</p>
          ) : valido ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Restablecer contraseña
              </Button>
            </form>
          ) : (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
