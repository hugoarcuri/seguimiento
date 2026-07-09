"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Calendar, Church, BookOpen, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Discipulo, Encuentro, Oracion, Tarea, Timeline, Etapa } from "@/types/database";

const estadoColors: Record<string, string> = {
  activo: "bg-green-500",
  pausado: "bg-yellow-500",
  completado: "bg-blue-500",
  retirado: "bg-red-500",
};

interface DiscipuloDetailClientProps {
  discipulo: Discipulo;
  etapas: Etapa[];
  encuentros: Encuentro[];
  oraciones: Oracion[];
  tareas: Tarea[];
  timeline: Timeline[];
}

export function DiscipuloDetailClient({
  discipulo,
  etapas,
  encuentros,
  oraciones,
  tareas,
  timeline,
}: DiscipuloDetailClientProps) {
  const etapaActual = etapas.find((e) => e.id === discipulo.etapa_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/discipulos"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted size-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">
                {discipulo.apellido}, {discipulo.nombre}
              </h1>
              <div className={`h-3 w-3 rounded-full ${estadoColors[discipulo.estado]}`} />
            </div>
            <p className="text-muted-foreground">
              {etapaActual?.nombre || "Sin etapa"}
            </p>
          </div>
        </div>
        <Link
          href={`/discipulos/${discipulo.id}/editar`}
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 gap-1.5 px-2.5 text-sm font-medium"
        >
          <Edit className="h-4 w-4" />
          Editar
        </Link>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="encuentros">
            Encuentros ({encuentros.length})
          </TabsTrigger>
          <TabsTrigger value="oracion">
            Oración ({oraciones.length})
          </TabsTrigger>
          <TabsTrigger value="tareas">
            Tareas ({tareas.length})
          </TabsTrigger>
          <TabsTrigger value="timeline">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Fecha Nac.</span>
                  <span>
                    {discipulo.fecha_nacimiento
                      ? format(new Date(discipulo.fecha_nacimiento), "dd/MM/yyyy")
                      : "—"}
                  </span>
                  <span className="text-muted-foreground">Edad</span>
                  <span>
                    {discipulo.fecha_nacimiento
                      ? (() => {
                          const hoy = new Date();
                          const nac = new Date(discipulo.fecha_nacimiento);
                          let edad = hoy.getFullYear() - nac.getFullYear();
                          const m = hoy.getMonth() - nac.getMonth();
                          if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
                          return `${edad} años`;
                        })()
                      : "—"}
                  </span>
                  <span className="text-muted-foreground">Sexo</span>
                  <span>{discipulo.sexo === "M" ? "Masculino" : discipulo.sexo === "F" ? "Femenino" : "—"}</span>
                  <span className="text-muted-foreground">Teléfono</span>
                  <span>{discipulo.telefono || "—"}</span>
                  <span className="text-muted-foreground">Email</span>
                  <span>{discipulo.email || "—"}</span>
                  <span className="text-muted-foreground">Dirección</span>
                  <span>{discipulo.direccion || "—"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información Espiritual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Conversión</span>
                  <span>
                    {discipulo.fecha_conversion
                      ? format(new Date(discipulo.fecha_conversion), "dd/MM/yyyy")
                      : "—"}
                  </span>
                  <span className="text-muted-foreground">Bautismo</span>
                  <span>
                    {discipulo.fecha_bautismo
                      ? format(new Date(discipulo.fecha_bautismo), "dd/MM/yyyy")
                      : "—"}
                  </span>
                  <span className="text-muted-foreground">Etapa</span>
                  <Badge variant="secondary" className="w-fit">
                    {etapaActual?.nombre || "Sin etapa"}
                  </Badge>
                  <span className="text-muted-foreground">Estado</span>
                  <span className="capitalize">{discipulo.estado}</span>
                  <span className="text-muted-foreground">Ministerio</span>
                  <span>{discipulo.ministerio || "—"}</span>
                  <span className="text-muted-foreground">Dones</span>
                  <span>{discipulo.dones || "—"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {discipulo.observaciones && (
            <Card>
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{discipulo.observaciones}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="encuentros" className="space-y-4">
          {encuentros.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay encuentros registrados
              </CardContent>
            </Card>
          ) : (
            encuentros.map((encuentro) => (
              <Card key={encuentro.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {encuentro.tema_tratado}
                    </CardTitle>
                    <Badge variant="outline">
                      {format(new Date(encuentro.fecha), "dd/MM/yyyy")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {encuentro.lugar && (
                    <p><span className="text-muted-foreground">Lugar:</span> {encuentro.lugar}</p>
                  )}
                  {encuentro.material_utilizado && (
                    <p><span className="text-muted-foreground">Material:</span> {encuentro.material_utilizado}</p>
                  )}
                  {encuentro.compromisos && (
                    <p><span className="text-muted-foreground">Compromisos:</span> {encuentro.compromisos}</p>
                  )}
                  {encuentro.notas && (
                    <p><span className="text-muted-foreground">Notas:</span> {encuentro.notas}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="oracion" className="space-y-4">
          {oraciones.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay pedidos de oración
              </CardContent>
            </Card>
          ) : (
            oraciones.map((oracion) => (
              <Card key={oracion.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{oracion.pedido}</CardTitle>
                    <Badge
                      variant={
                        oracion.estado === "respondida"
                          ? "default"
                          : oracion.estado === "en_oracion"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {oracion.estado}
                    </Badge>
                  </div>
                  <CardDescription>
                    {format(new Date(oracion.fecha), "dd/MM/yyyy")}
                  </CardDescription>
                </CardHeader>
                {oracion.respuesta && (
                  <CardContent>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Respuesta:</span>{" "}
                      {oracion.respuesta}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="tareas" className="space-y-4">
          {tareas.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay tareas asignadas
              </CardContent>
            </Card>
          ) : (
            tareas.map((tarea) => (
              <Card key={tarea.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{tarea.titulo}</CardTitle>
                    <Badge
                      variant={
                        tarea.estado === "completada"
                          ? "default"
                          : tarea.estado === "vencida"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {tarea.estado}
                    </Badge>
                  </div>
                  <CardDescription>
                    Tipo: {tarea.tipo}
                    {tarea.fecha_limite &&
                      ` | Límite: ${format(new Date(tarea.fecha_limite), "dd/MM/yyyy")}`}
                  </CardDescription>
                </CardHeader>
                {tarea.descripcion && (
                  <CardContent>
                    <p className="text-sm">{tarea.descripcion}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          {timeline.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay historial disponible
              </CardContent>
            </Card>
          ) : (
            <div className="relative space-y-4 before:absolute before:left-4 before:top-0 before:h-full before:w-0.5 before:bg-border">
              {timeline.map((evento) => (
                <div key={evento.id} className="relative pl-10">
                  <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                  <Card>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{evento.descripcion}</p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(evento.created_at), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
