"use client";

import { useUser, invalidarCachePerfil } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Crown, Mail, Calendar, Save, Loader2, UserCog, Camera } from "lucide-react";
import { format } from "date-fns";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROL_LABELS } from "@/lib/constants/navigation";

const rolIcon = { admin: Crown, discipulador: UserCog, discipulo: Shield } as const;

function RolBadge({ rol }: { rol?: string }) {
  if (!rol) return null;
  const Icon = rolIcon[rol as keyof typeof rolIcon] || Shield;
  return (
    <Badge variant={rol === "admin" ? "default" : "secondary"} className="mt-1 capitalize gap-1">
      <Icon className="h-3 w-3" />
      {ROL_LABELS[rol] || rol}
    </Badge>
  );
}

export default function PerfilPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [apellido, setApellido] = useState(user?.apellido || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [guardando, setGuardando] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubirAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSubiendoAvatar(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `perfil-${user.id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("discipulo-avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Error al subir foto"); setSubiendoAvatar(false); return; }
    const { data: urlData } = supabase.storage.from("discipulo-avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);
    if (updateError) { toast.error("Error al guardar foto"); setSubiendoAvatar(false); return; }
    setAvatarUrl(publicUrl);
    invalidarCachePerfil();
    router.refresh();
    setSubiendoAvatar(false);
    toast.success("Foto de perfil actualizada");
  };

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
            <div className="relative group">
              <Avatar className="h-24 w-24">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="Foto de perfil" />}
                <AvatarFallback className="text-3xl">
                  {user?.nombre?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={subiendoAvatar}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:opacity-100 disabled:opacity-0"
                title="Cambiar foto de perfil"
              >
                {subiendoAvatar ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSubirAvatar}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={subiendoAvatar}>
              {subiendoAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
              Cambiar foto
            </Button>
            <div className="text-center">
              <p className="text-xl font-semibold">
                {user?.nombre} {user?.apellido}
              </p>
              <RolBadge rol={user?.rol} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
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
                  <p className="font-medium flex min-w-0 items-center gap-1 break-words">
                    <Mail className="h-3 w-3 shrink-0" />
                    {user?.email}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Teléfono</span>
                  <p className="font-medium">{user?.telefono || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Rol</span>
                  <p className={"font-medium capitalize " + (user?.rol === "admin" ? "text-primary" : "")}>
                    {user?.rol ? ROL_LABELS[user.rol] || user.rol : "—"}
                  </p>
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
