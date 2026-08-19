"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "@/components/recharts-dynamic";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users,
  TrendingUp,
  CalendarCheck,
  AlertTriangle,
  Bell,
  ArrowRight,
  Clock,
  UserPlus,
  ChevronRight,
  CalendarClock,
  UserCheck,
} from "lucide-react";
import { ESTADOS_DISCIPULADOR, PERIODOS, type EstadoDiscipulador, type Periodo } from "./discipuladores/constants";

export type EstadoDiscipulo = EstadoDiscipulador;

export interface FilaMiembro {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url: string | null;
  discipulador: string;
  etapa: string;
  progreso: number | null;
  reuniones: number;
  objetivoReuniones: number;
  reunionPct: number;
  ultimaReunion: string | null;
  diasSinContacto: number | null;
  estado: EstadoDiscipulo;
  razones: string[];
}

export interface AtencionItem {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url: string | null;
  estado: EstadoDiscipulo;
  progreso: number | null;
  reuniones: number;
  objetivoReuniones: number;
  ultimaReunion: string | null;
  diasSinContacto: number | null;
  razones: string[];
}

export interface ActividadItem {
  id: string;
  tipo: "reunion" | "reunion_programada" | "avance" | "nuevo_miembro" | "sin_actividad";
  titulo: string;
  descripcion: string;
  fecha: string;
  miembro_id?: string;
  hora?: string | null;
  diasSinContacto?: number | null;
}

export interface PuntoSerie {
  etiqueta: string;
  reuniones: number;
  miembrosActivos: number;
  progreso: number | null;
}

export interface DashboardData {
  periodo: Periodo;
  kpis: {
    miembrosActivos: number;
    totalAsignados: number;
    pausados: number;
    retirados: number;
    progresoPromedio: number | null;
    variacionProgreso: number | null;
    reunionesRealizadas: number;
    objetivoReuniones: number;
    reunionesPct: number;
    enRiesgo: number;
    necesitanAtencion: number;
  };
  tabla: FilaMiembro[];
  atencion: AtencionItem[];
  grafico: { serie: PuntoSerie[] };
  actividad: ActividadItem[];
}

const ESTADOS_PROBLEMA: EstadoDiscipulo[] = ["en_riesgo", "necesita_ayuda", "critico"];

const avatarColors = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500",
  "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500", "bg-cyan-500",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function Avatar({ persona, className }: { persona: { id: string; nombre: string; apellido: string; avatar_url: string | null }; className?: string }) {
  if (persona.avatar_url) {
    return (
      <Image
        src={persona.avatar_url}
        alt=""
        width={32}
        height={32}
        className={cn("h-8 w-8 shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
        getAvatarColor(persona.id),
        className
      )}
    >
      {persona.nombre?.charAt(0)?.toUpperCase()}
      {persona.apellido?.charAt(0)?.toUpperCase()}
    </div>
  );
}

function EstadoBadge({ estado }: { estado: EstadoDiscipulo }) {
  const cfg = ESTADOS_DISCIPULADOR[estado];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", cfg.badge)}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function BarraProgreso({ value, bar, className }: { value: number; bar: string; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full min-w-[48px] overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-all", bar)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

const ACTIVIDAD_ICONOS: Record<ActividadItem["tipo"], { icon: typeof Users; cls: string }> = {
  reunion: { icon: CalendarCheck, cls: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400" },
  avance: { icon: TrendingUp, cls: "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400" },
  nuevo_miembro: { icon: UserPlus, cls: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400" },
  reunion_programada: { icon: Clock, cls: "bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400" },
  sin_actividad: { icon: AlertTriangle, cls: "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400" },
};

function tiempoRelativo(iso: string, hora?: string | null): string {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return "—";
  const hoy = new Date();
  const hoyInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  if (f >= hoyInicio) {
    if (f.getDate() === hoy.getDate()) return hora ? `Hoy ${hora}` : "Hoy";
    if (f.getDate() === hoy.getDate() + 1) return hora ? `Mañana ${hora}` : "Mañana";
    return format(f, "dd/MM", { locale: es });
  }
  return formatDistanceToNow(f, { locale: es, addSuffix: true });
}

type TipoGrafico = "progreso" | "reuniones" | "miembros";

export function DashboardClient({
  data,
  periodo,
  onPeriodoChange,
  esDiscipulador = false,
}: {
  data: DashboardData;
  periodo: Periodo;
  onPeriodoChange: (p: Periodo) => void;
  esDiscipulador?: boolean;
}) {
  const router = useRouter();
  const { kpis } = data;
  const [soloRiesgo, setSoloRiesgo] = useState(false);
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>("progreso");

  const irAtencion = () => {
    document.getElementById("atencion")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const irTablaRiesgo = () => {
    setSoloRiesgo(true);
    document.getElementById("estado-discipulos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filasTabla = soloRiesgo ? data.tabla.filter((t) => ESTADOS_PROBLEMA.includes(t.estado)) : data.tabla;

  const variacion = kpis.variacionProgreso;
  const descVariacion = variacion !== null ? (
    <span className={cn("font-medium", variacion > 0 ? "text-emerald-600" : variacion < 0 ? "text-red-600" : "text-muted-foreground")}>
      {variacion > 0 ? "+" : ""}{variacion} pp en el período
    </span>
  ) : (
    "seguimientos activos"
  );

  const stats: {
    title: string;
    value: ReactNode;
    description: ReactNode;
    icon: typeof Users;
    color: string;
    bg: string;
    destacado?: boolean;
    href?: string;
    onClick?: () => void;
  }[] = [

    {
      title: "Miembros activos",
      value: kpis.miembrosActivos,
      description: esDiscipulador
        ? `${kpis.totalAsignados} asignados a vos`
        : `${kpis.totalAsignados} asignados · ${kpis.pausados} pausados · ${kpis.retirados} retirados`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      href: "/miembros",
    },
    {
      title: "Progreso promedio",
      value: kpis.progresoPromedio !== null ? `${kpis.progresoPromedio}%` : "—",
      description: descVariacion,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950",
      href: "/seguimiento",
    },
    {
      title: "Reuniones realizadas",
      value: kpis.reunionesRealizadas,
      description: `${kpis.reunionesPct}% del objetivo`,
      icon: CalendarCheck,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950",
      href: "/agenda",
    },
    {
      title: "En riesgo",
      value: kpis.enRiesgo,
      description: "progreso bajo o falta de seguimiento",
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
      onClick: irTablaRiesgo,
    },
    {
      title: "Necesitan atención",
      value: kpis.necesitanAtencion,
      description: "requieren una intervención",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950",
      destacado: true,
      onClick: irAtencion,
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-xl">Dashboard Miembros</h1>
          <p className="text-sm text-muted-foreground">
            Resumen del avance, seguimiento y reuniones de los miembros.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap rounded-lg border bg-muted p-0.5">
            {PERIODOS.map((p) => (
              <Button
                key={p.value}
                size="sm"
                variant={periodo === p.value ? "default" : "ghost"}
                onClick={() => onPeriodoChange(p.value)}
                className="h-7 px-2 text-xs"
              >
                {p.label}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="icon-sm" onClick={irAtencion} title="Discípulos que necesitan atención" className="relative">
            <Bell className="h-4 w-4" />
            {kpis.necesitanAtencion > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {kpis.necesitanAtencion}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Inner = (
            <Card
              size="sm"
              className={cn(
                "h-full transition-colors group-hover:border-primary/50",
                stat.destacado && "border-red-300 dark:border-red-800"
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/40 pb-2">
                <CardTitle className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-wide">
                  {stat.title}
                </CardTitle>
                <div className={cn("rounded-lg p-2 shrink-0", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold tabular-nums", stat.destacado && "text-red-600")}>{stat.value}</div>
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
          if (stat.onClick) {
            return (
              <button key={stat.title} onClick={stat.onClick} className="group block text-left">
                {Inner}
              </button>
            );
          }
          return (
            <Link key={stat.title} href={stat.href!} className="group block">
              {Inner}
            </Link>
          );
        })}
      </div>

      {/* TABLA + EVOLUCIÓN/ATENCIÓN */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* ESTADO DE DISCÍPULOS */}
        <Card size="sm" className="lg:col-span-2" id="estado-discipulos">
          <CardHeader className="shrink-0 border-b border-border/40 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold">Estado de miembros</CardTitle>
                <CardDescription>Hacé clic en una fila para ver el detalle completo</CardDescription>
              </div>
              <Button
                variant={soloRiesgo ? "default" : "outline"}
                size="sm"
                onClick={() => setSoloRiesgo((v) => !v)}
                className="h-7 text-xs"
              >
                <AlertTriangle className={cn("mr-1 h-3.5 w-3.5", soloRiesgo ? "" : "text-red-500")} />
                {soloRiesgo ? "Ver todos" : "Solo en riesgo"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Miembro</TableHead>
                    <TableHead>Discipulador</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Reuniones</TableHead>
                    <TableHead>Última reunión</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filasTabla.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        {soloRiesgo ? "No hay miembros en riesgo" : "No hay miembros activos todavía."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filasTabla.map((f) => {
                      const cfg = ESTADOS_DISCIPULADOR[f.estado];
                      return (
                        <TableRow
                          key={f.id}
                          onClick={() => router.push(`/miembros/ver?id=${f.id}`)}
                          className="cursor-pointer"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar persona={f} />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{f.nombre} {f.apellido}</p>
                                <p className="truncate text-[11px] text-muted-foreground">{f.etapa}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                              <UserCheck className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{f.discipulador}</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <BarraProgreso value={f.progreso ?? 0} bar={cfg.bar} className="w-20 sm:w-28" />
                              <span className="w-9 text-right text-xs font-medium tabular-nums text-muted-foreground">
                                {f.progreso !== null ? `${f.progreso}%` : "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "text-sm tabular-nums",
                              f.reunionPct < 40 && "font-medium text-red-600",
                              f.reunionPct >= 40 && f.reunionPct < 60 && "font-medium text-amber-600"
                            )}>
                              {f.reuniones}/{f.objetivoReuniones}
                            </span>
                          </TableCell>
                          <TableCell>
                            {f.ultimaReunion ? (
                              <div className="space-y-0.5">
                                <p className="text-sm tabular-nums">{format(new Date(f.ultimaReunion + "T00:00:00"), "dd/MM/yyyy", { locale: es })}</p>
                                {f.diasSinContacto !== null && f.diasSinContacto >= 15 && (
                                  <p className={cn("text-[11px] font-medium", f.diasSinContacto >= 30 ? "text-red-600" : "text-amber-600")}>
                                    {f.diasSinContacto} días sin reunión
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <EstadoBadge estado={f.estado} />
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* COLUMNA DERECHA: EVOLUCIÓN + ATENCIÓN */}
        <div className="flex min-w-0 flex-col gap-3">
          <Card size="sm" className="flex-1">
            <CardHeader className="shrink-0 border-b border-border/40 pb-2">
              <CardTitle className="text-base font-bold">Evolución del progreso promedio</CardTitle>
              <CardDescription>Detectá si el grupo avanza, se estanca o retrocede</CardDescription>
              <div className="flex rounded-lg border bg-muted p-0.5">
                {([
                  { value: "progreso", label: "Progreso" },
                  { value: "reuniones", label: "Reuniones" },
                  { value: "miembros", label: "Miembros" },
                ] as { value: TipoGrafico; label: string }[]).map((t) => (
                  <Button
                    key={t.value}
                    size="sm"
                    variant={tipoGrafico === t.value ? "default" : "ghost"}
                    onClick={() => setTipoGrafico(t.value)}
                    className="h-7 flex-1 px-1 text-xs"
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-full min-h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.grafico.serie} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                    <XAxis dataKey="etiqueta" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    {tipoGrafico === "progreso" && (
                      <Line type="monotone" dataKey="progreso" name="Progreso promedio" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                    )}
                    {tipoGrafico === "reuniones" && (
                      <Line type="monotone" dataKey="reuniones" name="Reuniones" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                    )}
                    {tipoGrafico === "miembros" && (
                      <Line type="monotone" dataKey="miembrosActivos" name="Miembros activos" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* DISCÍPULOS QUE NECESITAN ATENCIÓN */}
          <Card size="sm" className="shrink-0 border-red-300/70 dark:border-red-900/70" id="atencion">
            <CardHeader className="shrink-0 border-b border-red-200/60 pb-2 dark:border-red-900/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <CardTitle className="text-base font-bold min-w-0 flex-1">Miembros que necesitan atención</CardTitle>
                <Badge variant="destructive" className="shrink-0">{data.atencion.length}</Badge>
              </div>
              <CardDescription>Solo quienes presentan problemas de progreso o reuniones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.atencion.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">No hay miembros que necesiten atención.</p>
              ) : (
                <>
                  {data.atencion.map((d) => {
                    const cfg = ESTADOS_DISCIPULADOR[d.estado];
                    return (
                      <button
                        key={d.id}
                        onClick={() => router.push(`/miembros/ver?id=${d.id}`)}
                        className={cn("flex w-full items-center gap-2.5 rounded-lg border bg-card p-2.5 text-left transition-colors hover:border-primary/50", cfg.card)}
                      >
                        <Avatar persona={d} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-medium">{d.nombre} {d.apellido}</p>
                            <EstadoBadge estado={d.estado} />
                          </div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                            {d.progreso !== null ? `Progreso: ${d.progreso}%` : "Sin seguimiento"}
                            {d.ultimaReunion ? ` · Última reunión: ${format(new Date(d.ultimaReunion + "T00:00:00"), "dd/MM/yyyy", { locale: es })}` : " · Sin reuniones"}
                            {` · Reuniones: ${d.reuniones}/${d.objetivoReuniones}`}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    );
                  })}
                  <Button variant="outline" size="sm" className="mt-1 w-full h-7 text-xs" onClick={irTablaRiesgo}>
                    Ver todos los que necesitan atención
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <Card size="sm">
        <CardHeader className="shrink-0 border-b border-border/40 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-base font-bold">Actividad reciente</CardTitle>
              <Badge variant="secondary">{data.actividad.length}</Badge>
            </div>
            <Link href="/seguimiento">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Ver toda la actividad
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <CardDescription>Solo los eventos más relevantes del período</CardDescription>
        </CardHeader>
        <CardContent>
          {data.actividad.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">No hay actividad reciente en el período.</p>
          ) : (
            <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
              {data.actividad.map((a) => {
                const cfg = ACTIVIDAD_ICONOS[a.tipo];
                const contenido = (
                  <div className="flex items-center gap-2.5 rounded-lg border p-2.5">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", cfg.cls)}>
                      <cfg.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{a.titulo}</p>
                      <p className="mt-0.5 truncate text-sm text-foreground">{a.descripcion}</p>
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {tiempoRelativo(a.fecha, a.hora)}
                    </span>
                  </div>
                );
                return a.miembro_id ? (
                  <Link key={a.id} href={`/miembros/ver?id=${a.miembro_id}`} className="block transition-colors hover:border-primary/50 rounded-lg">
                    {contenido}
                  </Link>
                ) : (
                  <div key={a.id}>{contenido}</div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
