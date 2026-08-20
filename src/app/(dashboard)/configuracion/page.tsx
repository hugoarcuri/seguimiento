"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListTree, UserPlus, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { EtapasEditor } from "./etapas-editor";
import { useRequireRol } from "@/hooks/useRequireRol";
import { APP_URL } from "@/lib/constants/paths";

export default function ConfiguracionPage() {
  const { user } = useUser();
  const { permitido, loading: autorizando } = useRequireRol(["admin", "miembro", "discipulo"]);
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
        <h1 className="text-3xl font-bold break-words">Configuración</h1>
        <p className="text-muted-foreground">
          Administra tu perfil y preferencias
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Link de Registro — Miembros</CardTitle>
            </div>
            <CardDescription>
              Compartí este link para que nuevos miembros se registren
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
