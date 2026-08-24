"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { BASE_PATH } from "@/lib/constants/paths";
import { OPCIONES_DON_ESPIRITUAL, OPCION_OTRO_DON } from "@/app/(dashboard)/discipuladores/discipulador-constants";

const inputClass = "h-9 text-xs";
const inputLabelClass = "text-[10px] font-medium text-muted-foreground";

export default function RegistroDiscipuladorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exitoso, setExitoso] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [fechaConversion, setFechaConversion] = useState("");
  const [donEspiritual, setDonEspiritual] = useState("");
  const [donOtro, setDonOtro] = useState("");

  const [errores, setErrores] = useState<Record<string, string>>({});

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = "El nombre es requerido";
    if (!apellido.trim()) e.apellido = "El apellido es requerido";
    if (!email.trim()) e.email = "El email es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Email inválido";
    if (!password.trim()) e.password = "La contraseña es requerida";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validar()) return;

    setLoading(true);
    const supabase = createClient();

    const donFinal = donEspiritual === OPCION_OTRO_DON ? (donOtro.trim() || null) : donEspiritual || null;

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          registro_discipulador: true,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          telefono: telefono.trim() || null,
          fecha_nacimiento: fechaNacimiento || null,
          fecha_conversion: fechaConversion.trim() || null,
          don_espiritual: donFinal,
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
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-2">
      <Card className="w-full max-w-lg max-h-full overflow-y-auto">
        <CardHeader className="text-center space-y-1 py-3">
          <div className="flex justify-center mb-1">
            <Image src={`${BASE_PATH}/logo.png`} alt="Discipulado" width={36} height={36} className="rounded" />
          </div>
          <CardTitle className="text-lg font-bold">Registro de Discipulador</CardTitle>
          <CardDescription className="text-xs">Completá tus datos para comenzar a discipular</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <div className="space-y-1">
                <Label className={inputLabelClass}>Nombre *</Label>
                <Input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
                {errores.nombre && <p className="text-[10px] text-destructive">{errores.nombre}</p>}
              </div>
              <div className="space-y-1">
                <Label className={inputLabelClass}>Apellido *</Label>
                <Input className={inputClass} value={apellido} onChange={(e) => setApellido(e.target.value)} />
                {errores.apellido && <p className="text-[10px] text-destructive">{errores.apellido}</p>}
              </div>
              <div className="space-y-1">
                <Label className={inputLabelClass}>Email *</Label>
                <Input type="email" placeholder="tu@email.com" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
                {errores.email && <p className="text-[10px] text-destructive">{errores.email}</p>}
              </div>
              <div className="space-y-1">
                <Label className={inputLabelClass}>Contraseña *</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Mín. 6 caracteres" className={`${inputClass} pr-8`} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
                {errores.password && <p className="text-[10px] text-destructive">{errores.password}</p>}
              </div>
              <div className="space-y-1">
                <Label className={inputLabelClass}>Teléfono</Label>
                <Input className={inputClass} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className={inputLabelClass}>Fecha de nacimiento</Label>
                <Input type="date" className={inputClass} value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className={inputLabelClass}>Fecha o año de Conversión</Label>
                <Input className={inputClass} value={fechaConversion} onChange={(e) => setFechaConversion(e.target.value)} placeholder="Ej: 2020 o 15/03/2020" />
              </div>
              <div className="space-y-1">
                <Label className={inputLabelClass}>Don Espiritual</Label>
                <Select value={donEspiritual || undefined} onValueChange={(v) => setDonEspiritual(v?.toString() ?? "")} items={OPCIONES_DON_ESPIRITUAL.map((d) => ({ value: d, label: d }))}>
                  <SelectTrigger className={inputClass}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {OPCIONES_DON_ESPIRITUAL.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {donEspiritual === OPCION_OTRO_DON && (
                  <Input className={`${inputClass} mt-0.5`} placeholder="Escribí el don..." value={donOtro} onChange={(e) => setDonOtro(e.target.value)} />
                )}
              </div>
            </div>

            <Button type="submit" className="w-full h-9" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrarme
            </Button>
          </CardContent>
        </form>
        <div className="px-4 pb-3">
          <p className="text-xs text-center text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
