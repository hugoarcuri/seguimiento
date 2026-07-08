"use client";

import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog, Shield, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function ConfiguracionPage() {
  const { user } = useUser();

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
              <span>
                {user?.nombre} {user?.apellido}
              </span>
              <span className="text-muted-foreground">Email</span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user?.email}
              </span>
              <span className="text-muted-foreground">Rol</span>
              <span>
                <Badge variant="secondary" className="capitalize">
                  <Shield className="mr-1 h-3 w-3" />
                  {user?.rol === "admin" ? "Administrador" : "Discípulo"}
                </Badge>
              </span>
              <span className="text-muted-foreground">Miembro desde</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {user?.created_at
                  ? format(new Date(user.created_at), "dd/MM/yyyy")
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Roles y Permisos</CardTitle>
            </div>
            <CardDescription>
              Información sobre los roles del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge>Administrador / Líder</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Crear, editar y eliminar discípulos</li>
                <li>Registrar encuentros y seguimiento</li>
                <li>Ver estadísticas y reportes</li>
                <li>Administrar materiales</li>
                <li>Gestionar pedidos de oración</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Discípulo</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Ver perfil y progreso</li>
                <li>Ver materiales asignados</li>
                <li>Confirmar asistencia</li>
                <li>Completar tareas</li>
                <li>Actualizar información personal</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
