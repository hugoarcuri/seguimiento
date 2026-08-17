"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { BASE_PATH } from "@/lib/constants/paths";

const inputClass = "h-11 md:h-9";
const inputLabelClass = "text-[11px] font-medium text-muted-foreground";

type SiNoValue = "si" | "no" | "";

export default function RegistroPage() {
  const [loading, setLoading] = useState(false);
  const [exitoso, setExitoso] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [sexo, setSexo] = useState<"M" | "F" | "">("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [conviveCon, setConviveCon] = useState("");

  const [donConoce, setDonConoce] = useState<SiNoValue>("");
  const [donDetalle, setDonDetalle] = useState("");
  const [ministerio, setMinisterio] = useState("");
  const [estudia, setEstudia] = useState<SiNoValue>("");
  const [estudiaDetalle, setEstudiaDetalle] = useState("");
  const [trabaja, setTrabaja] = useState<SiNoValue>("");
  const [trabajaDetalle, setTrabajaDetalle] = useState("");

  const [errores, setErrores] = useState<Record<string, string>>({});

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "El email es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Email inválido";
    if (!password.trim()) e.password = "La contraseña es requerida";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    if (!nombre.trim()) e.nombre = "El nombre es requerido";
    if (!apellido.trim()) e.apellido = "El apellido es requerido";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validar()) return;

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          registro_discipulo: true,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          sexo: sexo || null,
          fecha_nacimiento: fechaNacimiento || null,
          telefono: telefono.trim() || null,
          direccion: direccion.trim() || null,
          convive_con: conviveCon.trim() || null,
          don_espiritual: donConoce === "si" ? (donDetalle.trim() || "Sí") : donConoce === "no" ? "No lo conoce" : null,
          ministerio: ministerio.trim() || null,
          estudia: estudia === "si" ? (estudiaDetalle.trim() || "Sí") : estudia === "no" ? "No" : null,
          trabaja: trabaja === "si" ? (trabajaDetalle.trim() || "Sí") : trabaja === "no" ? "No" : null,
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="space-y-4 pt-6">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold">¡Registro exitoso!</h2>
              <p className="text-sm text-muted-foreground">
                Tu cuenta fue creada. Ya podés iniciar sesión con tu email y contraseña.
              </p>
            </div>
            <Link href={`${BASE_PATH}/login/`} className="inline-flex items-center justify-center w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors mt-4">
              Ir a iniciar sesión
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Image src={`${BASE_PATH}/logo.png`} alt="Discipulado" width={48} height={48} className="rounded" />
          </div>
          <CardTitle className="text-2xl font-bold">Registro de Discípulo</CardTitle>
          <CardDescription>Completá tus datos para comenzar tu camino</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cuenta</p>
              <div className="space-y-2">
                <Label htmlFor="email" className={inputLabelClass}>Email *</Label>
                <Input id="email" type="email" placeholder="tu@email.com" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
                {errores.email && <p className="text-sm text-destructive">{errores.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className={inputLabelClass}>Contraseña *</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" className={`${inputClass} pr-10`} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errores.password && <p className="text-sm text-destructive">{errores.password}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos personales</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="apellido" className={inputLabelClass}>Apellido *</Label>
                  <Input id="apellido" className={inputClass} value={apellido} onChange={(e) => setApellido(e.target.value)} />
                  {errores.apellido && <p className="text-sm text-destructive">{errores.apellido}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nombre" className={inputLabelClass}>Nombre *</Label>
                  <Input id="nombre" className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
                  {errores.nombre && <p className="text-sm text-destructive">{errores.nombre}</p>}
                </div>
                <div className="space-y-1">
                  <Label className={inputLabelClass}>Sexo</Label>
                  <div className="flex gap-1.5">
                    {(["M", "F"] as const).map((v) => (
                      <button key={v} type="button" onClick={() => setSexo(sexo === v ? "" : v)}
                        className={`flex-1 h-11 md:h-9 rounded-lg text-xs font-medium transition-colors ${sexo === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                        {v === "M" ? "Masculino" : "Femenino"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fecha_nacimiento" className={inputLabelClass}>Nacimiento</Label>
                  <Input id="fecha_nacimiento" type="date" className={inputClass} value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="telefono" className={inputLabelClass}>Teléfono</Label>
                  <Input id="telefono" className={inputClass} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="direccion" className={inputLabelClass}>Dirección</Label>
                  <Input id="direccion" className={inputClass} value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="convive_con" className={inputLabelClass}>¿Con quién vive?</Label>
                <Input id="convive_con" className={inputClass} placeholder="Ej.: con sus padres, solo/a..." value={conviveCon} onChange={(e) => setConviveCon(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos espirituales</p>

              <div className="space-y-1">
                <Label className={inputLabelClass}>¿Conoce su don espiritual?</Label>
                <div className="flex gap-1.5">
                  {(["si", "no"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => { setDonConoce(donConoce === v ? "" : v); if (v === "no") setDonDetalle(""); }}
                      className={`flex-1 h-11 md:h-9 rounded-lg text-xs font-medium transition-colors ${donConoce === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {v === "si" ? "Sí" : "No"}
                    </button>
                  ))}
                </div>
                {donConoce === "si" && (
                  <Input className={`${inputClass} mt-1`} placeholder="¿Cuál? Ej: Profecía, enseñanza..." value={donDetalle} onChange={(e) => setDonDetalle(e.target.value)} />
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="ministerio" className={inputLabelClass}>¿En qué ministerio sirve?</Label>
                <Input id="ministerio" className={inputClass} placeholder="Ej: Alabanza, ujier..." value={ministerio} onChange={(e) => setMinisterio(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label className={inputLabelClass}>¿Estudia?</Label>
                <div className="flex gap-1.5">
                  {(["si", "no"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => { setEstudia(estudia === v ? "" : v); if (v === "no") setEstudiaDetalle(""); }}
                      className={`flex-1 h-11 md:h-9 rounded-lg text-xs font-medium transition-colors ${estudia === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {v === "si" ? "Sí" : "No"}
                    </button>
                  ))}
                </div>
                {estudia === "si" && (
                  <Input className={`${inputClass} mt-1`} placeholder="¿Qué estudia y en qué año? Ej: Ingeniería, 2º año" value={estudiaDetalle} onChange={(e) => setEstudiaDetalle(e.target.value)} />
                )}
              </div>

              <div className="space-y-1">
                <Label className={inputLabelClass}>¿Trabaja?</Label>
                <div className="flex gap-1.5">
                  {(["si", "no"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => { setTrabaja(trabaja === v ? "" : v); if (v === "no") setTrabajaDetalle(""); }}
                      className={`flex-1 h-11 md:h-9 rounded-lg text-xs font-medium transition-colors ${trabaja === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {v === "si" ? "Sí" : "No"}
                    </button>
                  ))}
                </div>
                {trabaja === "si" && (
                  <Input className={`${inputClass} mt-1`} placeholder="¿En qué trabaja? Ej: Atención al cliente" value={trabajaDetalle} onChange={(e) => setTrabajaDetalle(e.target.value)} />
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrarme
            </Button>
          </CardContent>
        </form>
        <div className="px-6 pb-6">
          <p className="text-sm text-center text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link href={`${BASE_PATH}/login`} className="text-primary hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
