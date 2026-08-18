"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, CheckCircle, AlertTriangle, Eye, ClipboardCheck, TrendingUp, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MiembroDesempeno {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url: string | null;
  etapa_id: number;
  etapa_nombre: string;
  progreso: number;
  visitasMes: number;
  programadasMes: number;
  ultimaVisita: string | null;
  diasSinContacto: number | null;
  tareasTotal: number;
  tareasCompletadas: number;
  tareasPendientes: number;
  tareasVencidas: number;
  cumplimiento: number | null;
}

export interface DesempenoData {
  kpis: {
    miembrosTotal: number;
    visitasMes: number;
    tareasCompletadas: number;
    tareasPendientes: number;
    tareasVencidas: number;
    totalTareas: number;
    cumplimientoPromedio: number | null;
    sinVisita: number;
    enRiesgo: number;
  };
  tabla: MiembroDesempeno[];
}

const avatarColors = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500",
  "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500", "bg-cyan-500",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function CumplimientoBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground text-sm">—</span>;
  const color =
    value >= 80
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
      : value >= 50
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
        : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", color)}>
      {value}%
    </span>
  );
}

function ContactoBadge({ dias }: { dias: number | null }) {
  if (dias === null) return <Badge variant="outline">Sin visitas</Badge>;
  if (dias <= 7) return <span className="text-xs font-medium text-emerald-600">{dias}d</span>;
  if (dias <= 14) return <span className="text-xs font-medium text-amber-600">{dias}d</span>;
  return <span className="text-xs font-medium text-red-600">{dias}d</span>;
}

export function MiDesempenoClient({ data }: { data: DesempenoData }) {
  const { kpis, tabla } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Desempeño</h1>
        <p className="text-muted-foreground">Resumen de tu actividad como discipulador</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.miembrosTotal}</p>
                <p className="text-xs text-muted-foreground">Miembros activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.visitasMes}</p>
                <p className="text-xs text-muted-foreground">Visitas este mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.tareasCompletadas}/{kpis.totalTareas}</p>
                <p className="text-xs text-muted-foreground">Tareas completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.cumplimientoPromedio !== null ? `${kpis.cumplimientoPromedio}%` : "—"}</p>
                <p className="text-xs text-muted-foreground">Cumplimiento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {(kpis.enRiesgo > 0 || kpis.sinVisita > 0 || kpis.tareasVencidas > 0) && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-amber-800 dark:text-amber-300">Atención requerida</p>
                <div className="flex flex-wrap gap-2 text-sm text-amber-700 dark:text-amber-400">
                  {kpis.sinVisita > 0 && <span>{kpis.sinVisita} miembro(s) sin visita este mes</span>}
                  {kpis.enRiesgo > 0 && <span>{kpis.enRiesgo} miembro(s) sin contacto 15+ días</span>}
                  {kpis.tareasVencidas > 0 && <span>{kpis.tareasVencidas} tarea(s) vencida(s)</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Visitas</TableHead>
                  <TableHead>Última visita</TableHead>
                  <TableHead>Tareas</TableHead>
                  <TableHead>Cumplimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tabla.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No tenés miembros asignados
                    </TableCell>
                  </TableRow>
                ) : (
                  tabla.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {m.avatar_url ? (
                            <img src={m.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                          ) : (
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
                                getAvatarColor(m.id)
                              )}
                            >
                              {m.nombre?.[0]?.toUpperCase()}
                              {m.apellido?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <p className="text-sm font-semibold">
                            {m.apellido}, {m.nombre}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.etapa_nombre}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {m.visitasMes > 0 ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-sm">{m.visitasMes}/{m.programadasMes || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ContactoBadge dias={m.diasSinContacto} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          {m.tareasCompletadas > 0 && (
                            <span className="text-emerald-600">{m.tareasCompletadas}✓</span>
                          )}
                          {m.tareasPendientes > 0 && (
                            <span className="text-amber-600">{m.tareasPendientes}⧖</span>
                          )}
                          {m.tareasVencidas > 0 && (
                            <span className="text-red-600">{m.tareasVencidas}✗</span>
                          )}
                          {m.tareasTotal === 0 && <span className="text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <CumplimientoBadge value={m.cumplimiento} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/miembros/ver?id=${m.id}`}>
                          <Button variant="ghost" size="icon" title="Ver miembro">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3 p-3">
            {tabla.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">No tenés miembros asignados</p>
            ) : (
              tabla.map((m) => (
                <div key={m.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2.5">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                          getAvatarColor(m.id)
                        )}
                      >
                        {m.nombre?.[0]?.toUpperCase()}
                        {m.apellido?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{m.apellido}, {m.nombre}</p>
                      <Badge variant="outline" className="text-xs">{m.etapa_nombre}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-md bg-muted p-2">
                      <p className="font-bold text-lg">{m.visitasMes}</p>
                      <p className="text-muted-foreground">Visitas</p>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <p className="font-bold text-lg">{m.tareasCompletadas}/{m.tareasTotal || "—"}</p>
                      <p className="text-muted-foreground">Tareas</p>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <CumplimientoBadge value={m.cumplimiento} />
                      <p className="text-muted-foreground mt-1">Cumpl.</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {m.diasSinContacto !== null
                        ? `Última visita: hace ${m.diasSinContacto}d`
                        : "Sin visitas registradas"}
                    </span>
                    <Link href={`/miembros/ver?id=${m.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <Eye className="mr-1 h-3 w-3" /> Ver
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
