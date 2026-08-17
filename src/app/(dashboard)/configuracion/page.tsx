"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCog, Shield, Crown, Mail, Calendar, ListTree, UserPlus, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { EtapasEditor } from "./etapas-editor";
import { useRequireRol } from "@/hooks/useRequireRol";
import { APP_URL } from "@/lib/constants/paths";

export default function ConfiguracionPage() {
  const { user } = useUser();
  const { permitido, loading: autorizando } = useRequireRol(["admin", "discipulo"]);
  const [copiadoDiscipulo, setCopiadoDiscipulo] = useState(false);
  const [copiadoDiscipulador, setCopiadoDiscipulador] = useState(false);

  const linkRegistroDiscipulo = `${APP_URL}/registro/`;
  const linkRegistroDiscipulador = `${APP_URL}/registro-discipulador/`;

  const copiarLink = async (texto: string, que: "discipulo" | "discipulador") => {
    try {
      await navigator.clipboard.writeText(texto);
      if (que === "discipulo") { setCopiadoDiscipulo(true); setTimeout(() => setCopiadoDiscipulo(false), 2000); }
      else { setCopiadoDiscipulador(true); setTimeout(() => setCopiadoDiscipulador(false), 2000); }
      toast.success("Link copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  if (autorizando) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!permitido) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Administra tu perfil y preferencias
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Mi Perfil</CardTitle>
            </div>
            <CardDescription>Información de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Nombre</span>
              <span className="min-w-0 break-words">
                {user?.nombre} {user?.apellido}
              </span>
              <span className="text-muted-foreground">Email</span>
              <span className="flex min-w-0 items-center gap-1 break-words">
                <Mail className="h-3 w-3 shrink-0" />
                {user?.email}
              </span>
              <span className="text-muted-foreground">Rol</span>
              <span>
                <Badge variant={user?.rol === "admin" ? "default" : "secondary"} className="capitalize">
                  {user?.rol === "admin" ? <Crown className="mr-1 h-3 w-3" /> : <Shield className="mr-1 h-3 w-3" />}
                  {user?.rol === "admin" ? "Administrador" : "Discípulo"}
                </Badge>
              </span>
              <span className="text-muted-foreground">Miembro desde</span>
              <span className="flex min-w-0 items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                {user?.created_at
                  ? format(new Date(user.created_at), "dd/MM/yyyy")
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Link de Registro — Discípulos</CardTitle>
              </div>
              <CardDescription>
                Compartí este link para que nuevos discípulos se registren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input readOnly value={linkRegistroDiscipulo} className="text-xs font-mono" />
                <Button variant="outline" size="sm" onClick={() => copiarLink(linkRegistroDiscipulo, "discipulo")} className="shrink-0">
                  {copiadoDiscipulo ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-1 hidden sm:inline">{copiadoDiscipulo ? "Copiado" : "Copiar"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Link de Registro — Discipuladores</CardTitle>
              </div>
              <CardDescription>
                Compartí este link para que nuevos discipuladores se registren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input readOnly value={linkRegistroDiscipulador} className="text-xs font-mono" />
                <Button variant="outline" size="sm" onClick={() => copiarLink(linkRegistroDiscipulador, "discipulador")} className="shrink-0">
                  {copiadoDiscipulador ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-1 hidden sm:inline">{copiadoDiscipulador ? "Copiado" : "Copiar"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {user?.rol === "admin" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ListTree className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="text-2xl font-semibold">Etapas del Discipulado</h2>
              <p className="text-sm text-muted-foreground">
                Editá las etapas de madurez. Los cambios se reflejan en todo el sitio.
              </p>
            </div>
          </div>
          <EtapasEditor />
        </div>
      )}
    </div>
  );
}
