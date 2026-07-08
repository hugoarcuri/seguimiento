"use client";

import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Mail, Calendar, Save, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PerfilPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [apellido, setApellido] = useState(user?.apellido || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!user) return;
    setGuardando(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ nombre, apellido, telefono })
      .eq("id", user.id);

    if (error) {
      toast.error("Error al actualizar perfil");
    } else {
      toast.success("Perfil actualizado");
      setEditando(false);
      router.refresh();
    }
    setGuardando(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Información personal de tu cuenta
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center py-8 space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-3xl">
                {user?.nombre?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-xl font-semibold">
                {user?.nombre} {user?.apellido}
              </p>
              <Badge variant="secondary" className="mt-1 capitalize">
                <Shield className="mr-1 h-3 w-3" />
                {user?.rol === "admin" ? "Administrador" : "Discípulo"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Información Personal</CardTitle>
              {!editando ? (
                <Button variant="outline" onClick={() => setEditando(true)}>
                  Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditando(false);
                      setNombre(user?.nombre || "");
                      setApellido(user?.apellido || "");
                      setTelefono(user?.telefono || "");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleGuardar} disabled={guardando}>
                    {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editando ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Apellido</Label>
                  <Input value={apellido} onChange={(e) => setApellido(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nombre</span>
                  <p className="font-medium">{user?.nombre}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Apellido</span>
                  <p className="font-medium">{user?.apellido}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user?.email}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Teléfono</span>
                  <p className="font-medium">{user?.telefono || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Rol</span>
                  <p className="font-medium capitalize">{user?.rol}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Miembro desde</span>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {user?.created_at
                      ? format(new Date(user.created_at), "dd/MM/yyyy")
                      : "—"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
