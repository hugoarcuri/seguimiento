"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { BASE_PATH } from "@/lib/constants/paths";

const inputClass = "h-9 text-xs";
const inputLabelClass = "text-[10px] font-medium text-muted-foreground";

type SiNoValue = "si" | "no" | "";

export default function RegistroPage() {
  const router = useRouter();
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

  const [fechaConversion, setFechaConversion] = useState("");
  const [bautizado, setBautizado] = useState(false);
  const [esMiembro, setEsMiembro] = useState(false);
  const [donConoce, setDonConoce] = useState<SiNoValue>("");
  const [donDetalle, setDonDetalle] = useState("");
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
          fecha_conversion: fechaConversion || null,
          bautizado,
          es_miembro: esMiembro,
          don_espiritual: donConoce === "si" ? (donDetalle.trim() || "Sí") : donConoce === "no" ? "No lo conoce" : null,
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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="space-y-4 pt-6">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold">¡Registro exitoso!</h2>
              <p className="text-sm text-muted-foreground">
                Tu cuenta fue creada. Ya podés iniciar sesión con tu email y contraseña.
              </p>
            </div>
            <Button className="w-full mt-4" onClick={() => router.push("/dashboard/")}>
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
          <CardTitle className="text-lg font-bold">Registro de Discípulo</CardTitle>
          <CardDescription className="text-xs">Completá tus datos para comenzar tu camino</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <div className="space-y-1">
                <Label htmlFor="email" className={inputLabelClass}>Email *</Label>
                <Input id="email" type="email" placeholder="tu@email.com" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
                {errores.email && <p className="text-[10px] text-destructive">{errores.email}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className={inputLabelClass}>Contraseña *</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mín. 6 caracteres" className={`${inputClass} pr-8`} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
                {errores.password && <p className="text-[10px] text-destructive">{errores.password}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="apellido" className={inputLabelClass}>Apellido *</Label>
                <Input id="apellido" className={inputClass} value={apellido} onChange={(e) => setApellido(e.target.value)} />
                {errores.apellido && <p className="text-[10px] text-destructive">{errores.apellido}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="nombre" className={inputLabelClass}>Nombre *</Label>
                <Input id="nombre" className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
                {errores.nombre && <p className="text-[10px] text-destructive">{errores.nombre}</p>}
              </div>
              <div className="space-y-1">
                <Label className={inputLabelClass}>Sexo</Label>
                <div className="flex gap-1">
                  {(["M", "F"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => setSexo(sexo === v ? "" : v)}
                      className={`flex-1 h-9 rounded-md text-[11px] font-medium transition-colors ${sexo === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
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
              <div className="col-span-2 space-y-1">
                <Label htmlFor="convive_con" className={inputLabelClass}>¿Con quién vive?</Label>
                <Input id="convive_con" className={inputClass} placeholder="Ej.: con sus padres, solo/a..." value={conviveCon} onChange={(e) => setConviveCon(e.target.value)} />
              </div>
            </div>

            <div className="border-t pt-3 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Datos espirituales</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <div className="space-y-1">
                  <Label htmlFor="fecha_conversion" className={inputLabelClass}>Fecha de Conversión</Label>
                  <Input id="fecha_conversion" type="date" className={inputClass} value={fechaConversion} onChange={(e) => setFechaConversion(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className={inputLabelClass}>¿Conoce su don espiritual?</Label>
                  <div className="flex gap-1">
                    {(["si", "no"] as const).map((v) => (
                      <button key={v} type="button" onClick={() => { setDonConoce(donConoce === v ? "" : v); if (v === "no") setDonDetalle(""); }}
                        className={`flex-1 h-9 rounded-md text-[11px] font-medium transition-colors ${donConoce === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                        {v === "si" ? "Sí" : "No"}
                      </button>
                    ))}
                  </div>
                  {donConoce === "si" && (
                    <Input className={`${inputClass} mt-0.5`} placeholder="¿Cuál?" value={donDetalle} onChange={(e) => setDonDetalle(e.target.value)} />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className={inputLabelClass}>¿Estudia?</Label>
                  <div className="flex gap-1">
                    {(["si", "no"] as const).map((v) => (
                      <button key={v} type="button" onClick={() => { setEstudia(estudia === v ? "" : v); if (v === "no") setEstudiaDetalle(""); }}
                        className={`flex-1 h-9 rounded-md text-[11px] font-medium transition-colors ${estudia === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                        {v === "si" ? "Sí" : "No"}
                      </button>
                    ))}
                  </div>
                  {estudia === "si" && (
                    <Input className={`${inputClass} mt-0.5`} placeholder="¿Qué y en qué año?" value={estudiaDetalle} onChange={(e) => setEstudiaDetalle(e.target.value)} />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className={inputLabelClass}>¿Trabaja?</Label>
                  <div className="flex gap-1">
                    {(["si", "no"] as const).map((v) => (
                      <button key={v} type="button" onClick={() => { setTrabaja(trabaja === v ? "" : v); if (v === "no") setTrabajaDetalle(""); }}
                        className={`flex-1 h-9 rounded-md text-[11px] font-medium transition-colors ${trabaja === v ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                        {v === "si" ? "Sí" : "No"}
                      </button>
                    ))}
                  </div>
                  {trabaja === "si" && (
                    <Input className={`${inputClass} mt-0.5`} placeholder="¿En qué trabaja?" value={trabajaDetalle} onChange={(e) => setTrabajaDetalle(e.target.value)} />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox checked={bautizado} onCheckedChange={(v) => setBautizado(!!v)} />
                  Bautizado
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox checked={esMiembro} onCheckedChange={(v) => setEsMiembro(!!v)} />
                  Miembro
                </label>
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
