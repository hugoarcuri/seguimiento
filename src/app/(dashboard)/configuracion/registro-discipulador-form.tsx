"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { calcularEdad } from "@/lib/utils";
import { OPCIONES_DON_ESPIRITUAL, OPCION_OTRO_DON } from "@/app/(dashboard)/discipuladores/discipulador-constants";

const inputClass = "h-11 md:h-9";
const labelClass = "text-[11px] font-medium text-muted-foreground";

export function RegistroDiscipuladorForm() {
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [fechaConversion, setFechaConversion] = useState("");
  const [donEspiritual, setDonEspiritual] = useState("");
  const [donOtro, setDonOtro] = useState("");

  const edad = fechaNacimiento ? calcularEdad(fechaNacimiento) : null;

  const limpiar = () => {
    setNombre("");
    setApellido("");
    setEmail("");
    setPassword("");
    setTelefono("");
    setFechaNacimiento("");
    setFechaConversion("");
    setDonEspiritual("");
    setDonOtro("");
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !password.trim()) {
      toast.error("Completá nombre, apellido, email y contraseña");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    let msg: string | null = null;

    const donFinal = donEspiritual === OPCION_OTRO_DON ? (donOtro.trim() || null) : donEspiritual || null;

    try {
      const { data, error } = await supabase.functions.invoke("create-discipulador", {
        body: {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.trim(),
          password,
          telefono: telefono.trim() || null,
          fecha_nacimiento: fechaNacimiento || null,
          don_espiritual: donFinal,
        },
      });

      if (error) {
        if (error instanceof FunctionsHttpError) {
          try {
            const body = await error.context.json();
            msg = body?.error || "Error al crear el discipulador";
          } catch {
            msg = "Error al crear el discipulador";
          }
        } else {
          msg = error.message || "Error al crear el discipulador";
        }
      } else if (data?.id && fechaConversion.trim()) {
        await supabase
          .from("profiles")
          .update({ fecha_conversion: fechaConversion.trim() })
          .eq("id", data.id);
      }
    } catch (err) {
      msg = (err as Error)?.message || "Error al conectar con el servidor";
    }

    setLoading(false);

    if (msg) {
      if (/deploy|fetch|not found|404|not deployed|failed|network|blocked/i.test(msg)) {
        toast.error("La Edge Function no está desplegada o no responde.");
      } else {
        toast.error(msg);
      }
      return;
    }

    toast.success("Discipulador creado exitosamente");
    limpiar();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Nuevo Discipulador</CardTitle>
        </div>
        <CardDescription>
          Creá una cuenta de usuario con rol discipulador para que pueda vincularse con discípulos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="disc-nombre" className={labelClass}>Nombre *</Label>
              <Input id="disc-nombre" className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="disc-apellido" className={labelClass}>Apellido *</Label>
              <Input id="disc-apellido" className={inputClass} value={apellido} onChange={(e) => setApellido(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="disc-email" className={labelClass}>Email *</Label>
              <Input id="disc-email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="disc-password" className={labelClass}>Contraseña *</Label>
              <Input id="disc-password" type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="disc-telefono" className={labelClass}>Teléfono</Label>
              <Input id="disc-telefono" className={inputClass} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="disc-nacimiento" className={labelClass}>Fecha de nacimiento</Label>
              <Input id="disc-nacimiento" type="date" className={inputClass} value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
              {edad !== null && <p className="text-[10px] text-muted-foreground">Edad: {edad} años</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="disc-conversion" className={labelClass}>Fecha o año de Conversión</Label>
              <Input id="disc-conversion" className={inputClass} value={fechaConversion} onChange={(e) => setFechaConversion(e.target.value)} placeholder="Ej: 2020 o 15/03/2020" />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Don Espiritual</Label>
              <Select value={donEspiritual || undefined} onValueChange={(v) => setDonEspiritual(v?.toString() ?? "")} items={OPCIONES_DON_ESPIRITUAL.map((don) => ({ value: don, label: don }))}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Seleccionar don" />
                </SelectTrigger>
                <SelectContent>
                  {OPCIONES_DON_ESPIRITUAL.map((don) => (
                    <SelectItem key={don} value={don}>{don}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {donEspiritual === OPCION_OTRO_DON && (
                <Input className={`${inputClass} mt-1`} placeholder="Escribí el don..." value={donOtro} onChange={(e) => setDonOtro(e.target.value)} />
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Discipulador
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
