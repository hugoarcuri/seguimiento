"use client";

import { useState } from "react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "@/components/recharts-dynamic";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users,
  UserCog,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  Bell,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  Clock,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import {
  ESTADOS_DISCIPULADOR,
  PERIODOS,
  type EstadoDiscipulador,
  type Periodo,
} from "./constants";

export interface DiscipuloDetalle {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url: string | null;
  estado: string;
  etapa: string;
  progreso: number | null;
  razones: string[];
  diasSinContacto: number | null;
  listoAvanzar: boolean;
}

export interface ReunionItem {
  id: string;
  discipulo: string;
  fecha: string;
  tema: string | null;
}

export interface DiscipuladorResumen {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  avatar_url: string | null;
  activos: number;
  progresoPromedio: number | null;
  reunidos: number;
  reunionesPct: number | null;
  estado: EstadoDiscipulador;
  enRiesgo: number;
  sinContacto: number;
  diasUltimaReunion: number | null;
  listosAvanzar: number;
  detalle: {
    discipulos: DiscipuloDetalle[];
    reunionesRecientes: ReunionItem[];
    alerta: string | null;
  };
}

export interface AtencionItem {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url: string | null;
  estado: EstadoDiscipulador;
  enRiesgo: number;
  diasUltimaReunion: number | null;
  progreso: number | null;
  reunionesPct: number | null;
}

export interface ActividadItem {
  id: string;
  tipo: "reunion" | "reunion_programada" | "nuevo_discipulo" | "tarea" | "sin_actividad";
  discipulador_id?: string;
  discipulador: string;
  descripcion: string;
  fecha: string;
}

export interface PuntoGrafico {
  etiqueta: string;
  reuniones: number;
  discipulosActivos: number;
}

export interface ProgresoEtapa {
  nombre: string;
  promedio: number;
  cantidad: number;
}

export interface DiscipuladoresDashboardData {
  periodo: Periodo;
  kpis: {
    discipuladoresActivos: number;
    pctActivos: number;
    discipulosActivos: number;
    nuevosEnPeriodo: number;
    reunionesRealizadas: number;
    objetivoReuniones: number;
    reunionesPct: number;
    progresoPromedio: number | null;
    conSeguimiento: number;
    requierenAtencion: number;
  };
  tabla: DiscipuladorResumen[];
  atencion: AtencionItem[];
  grafico: {
    serie: PuntoGrafico[];
    progresoPorEtapa: ProgresoEtapa[];
  };
  actividad: ActividadItem[];
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

function Avatar({ persona, className }: { persona: { id: string; nombre: string; apellido: string; avatar_url: string | null }; className?: string }) {
  if (persona.avatar_url) {
    return (
      <img
        src={persona.avatar_url}
        alt=""
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

function EstadoBadge({ estado }: { estado: EstadoDiscipulador }) {
  const cfg = ESTADOS_DISCIPULADOR[estado];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", cfg.badge)}>
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
  reunion: { icon: CalendarCheck, cls: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400" },
  reunion_programada: { icon: Clock, cls: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400" },
  nuevo_discipulo: { icon: UserPlus, cls: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400" },
  tarea: { icon: CheckCircle2, cls: "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400" },
  sin_actividad: { icon: AlertTriangle, cls: "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400" },
};

type TipoGrafico = "reuniones" | "discipulos" | "etapas";

export function DiscipuladoresDashboardClient({
  data,
  periodo,
  onPeriodoChange,
}: {
  data: DiscipuladoresDashboardData;
  periodo: Periodo;
  onPeriodoChange: (p: Periodo) => void;
}) {
  const { kpis } = data;
  const [seleccionado, setSeleccionado] = useState<DiscipuladorResumen | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [soloRiesgo, setSoloRiesgo] = useState(false);
  const [tipoGrafico, setTipoGrafico] = useState<TipoGrafico>("reuniones");

  const abrirDetalle = (disc: DiscipuladorResumen) => {
    setSeleccionado(disc);
    setAbierto(true);
  };

  const irAtencion = () => {
    document.getElementById("atencion")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filasTabla = soloRiesgo
    ? data.tabla.filter((d) => d.estado === "en_riesgo" || d.estado === "necesita_ayuda" || d.estado === "critico")
    : data.tabla;

  const stats = [
    {
      title: "Discipuladores activos",
      value: kpis.discipuladoresActivos,
      description: `${kpis.pctActivos}% activos`,
      icon: UserCog,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      href: "/discipuladores",
    },
    {
      title: "Discípulos activos",
      value: kpis.discipulosActivos,
      description: `+${kpis.nuevosEnPeriodo} nuevos en el período`,
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950",
      href: "/discipulos",
    },
    {
      title: "Reuniones realizadas",
      value: kpis.reunionesRealizadas,
      description: `${kpis.reunionesPct}% del objetivo (${kpis.objetivoReuniones} discípulos)`,
      icon: CalendarCheck,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950",
      href: "/agenda",
    },
    {
      title: "Progreso promedio",
      value: kpis.progresoPromedio !== null ? `${kpis.progresoPromedio}%` : "—",
      description: `de ${kpis.conSeguimiento} seguimientos activos`,
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
      href: "/seguimiento",
    },
    {
      title: "Requieren atención",
      value: kpis.requierenAtencion,
      description: "discipuladores a acompañar",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950",
      destacado: true,
      href: "#atencion",
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-xl">Dashboard de Discipuladores</h1>
          <p className="text-sm text-muted-foreground">
            Resumen del avance, seguimiento y acompañamiento de los discipuladores y sus discípulos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-muted p-0.5">
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
          <Button variant="outline" size="icon-sm" onClick={irAtencion} title="Alertas" className="relative">
            <Bell className="h-4 w-4" />
            {kpis.requierenAtencion > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {kpis.requierenAtencion}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Inner = (
            <Card size="sm" className={cn("h-full transition-colors group-hover:border-primary/50", stat.destacado && "border-red-300 dark:border-red-800")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/40 pb-2">
                <CardTitle className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-wide">{stat.title}</CardTitle>
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
          if (stat.destacado) {
            return (
              <button key={stat.title} onClick={irAtencion} className="group block text-left">
                {Inner}
              </button>
            );
          }
          return (
            <Link key={stat.title} href={stat.href} className="group block">
              {Inner}
            </Link>
          );
        })}
      </div>

      {/* TABLA + GRÁFICO */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card size="sm" className="lg:col-span-2" id="tabla-rendimiento">
          <CardHeader className="shrink-0 border-b border-border/40 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold">Rendimiento de Discipuladores</CardTitle>
                <CardDescription>Hacé clic en una fila para ver el detalle</CardDescription>
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
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Discipulador</TableHead>
                  <TableHead className="text-center">Discípulos</TableHead>
                  <TableHead>Progreso promedio</TableHead>
                  <TableHead>Reuniones</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filasTabla.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      {soloRiesgo ? "No hay discipuladores en riesgo" : "No hay discipuladores registrados todavía."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filasTabla.map((d) => {
                    const cfg = ESTADOS_DISCIPULADOR[d.estado];
                    return (
                      <TableRow key={d.id} onClick={() => abrirDetalle(d)} className="cursor-pointer">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar persona={d} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{d.nombre} {d.apellido}</p>
                              <p className="truncate text-[11px] text-muted-foreground">{d.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm font-semibold tabular-nums">{d.activos}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BarraProgreso value={d.progresoPromedio ?? 0} bar={cfg.bar} />
                            <span className="w-9 text-right text-xs font-medium tabular-nums text-muted-foreground">
                              {d.progresoPromedio !== null ? `${d.progresoPromedio}%` : "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {d.activos > 0 ? (
                            <div className="flex items-center gap-2">
                              <BarraProgreso value={d.reunionesPct ?? 0} bar={cfg.bar} />
                              <span className="w-10 text-right text-xs font-medium tabular-nums text-muted-foreground">
                                {d.reunidos}/{d.activos}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <EstadoBadge estado={d.estado} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card size="sm" className="flex flex-col">
          <CardHeader className="shrink-0 border-b border-border/40 pb-2">
            <CardTitle className="text-base font-bold">Progreso general</CardTitle>
            <CardDescription>Evolución del trabajo a lo largo del tiempo</CardDescription>
            <div className="flex rounded-lg border bg-muted p-0.5">
              {([
                { value: "reuniones", label: "Reuniones" },
                { value: "discipulos", label: "Discípulos" },
                { value: "etapas", label: "Por etapa" },
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
            {tipoGrafico === "etapas" ? (
              data.grafico.progresoPorEtapa.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin seguimientos activos</p>
              ) : (
                <div className="h-full min-h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.grafico.progresoPorEtapa} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                      <XAxis dataKey="nombre" tick={{ fontSize: 10 }} interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => [`${v}%`, "Progreso promedio"]} />
                      <Bar dataKey="promedio" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )
            ) : (
              <div className="h-full min-h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.grafico.serie} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                    <XAxis dataKey="etiqueta" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    {tipoGrafico === "reuniones" ? (
                      <Line type="monotone" dataKey="reuniones" name="Reuniones" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                    ) : (
                      <Line type="monotone" dataKey="discipulosActivos" name="Discípulos activos" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* NECESITAN ATENCIÓN */}
      <Card size="sm" className="border-red-300/70 dark:border-red-900/70" id="atencion">
        <CardHeader className="shrink-0 border-b border-red-200/60 pb-2 dark:border-red-900/50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <CardTitle className="text-base font-bold">Discipuladores que necesitan atención</CardTitle>
              <Badge variant="destructive">{data.atencion.length}</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setSoloRiesgo(true);
                document.getElementById("tabla-rendimiento")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Ver todos los que necesitan atención
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <CardDescription>Estos discipuladores requieren acompañamiento o supervisión</CardDescription>
        </CardHeader>
        <CardContent>
          {data.atencion.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">No hay discipuladores que necesiten atención.</p>
          ) : (
            <div className="grid gap-2 lg:grid-cols-2">
              {data.atencion.map((d) => {
                const cfg = ESTADOS_DISCIPULADOR[d.estado];
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      const fila = data.tabla.find((t) => t.id === d.id);
                      if (fila) abrirDetalle(fila);
                    }}
                    className={cn("flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/50", cfg.card)}
                  >
                    <Avatar persona={{ id: d.id, nombre: d.nombre, apellido: d.apellido, avatar_url: d.avatar_url }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{d.nombre} {d.apellido}</p>
                        <EstadoBadge estado={d.estado} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {d.enRiesgo > 0 && `${d.enRiesgo} discípulo(s) en riesgo`}
                        {d.enRiesgo > 0 && d.diasUltimaReunion !== null && " · "}
                        {d.diasUltimaReunion !== null
                          ? `Última reunión: hace ${d.diasUltimaReunion} días`
                          : d.enRiesgo > 0 && " · sin reuniones registradas"}
                        {d.progreso !== null && ` · Progreso: ${d.progreso}%`}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ACTIVIDAD RECIENTE */}
      <Card size="sm">
        <CardHeader className="shrink-0 border-b border-border/40 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">Actividad reciente</CardTitle>
            <Badge variant="secondary">{data.actividad.length}</Badge>
          </div>
          <CardDescription>Lo más importante que pasó en el período</CardDescription>
        </CardHeader>
        <CardContent>
          {data.actividad.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">No hay actividad reciente en el período.</p>
          ) : (
            <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
              {data.actividad.map((a) => {
                const cfg = ACTIVIDAD_ICONOS[a.tipo];
                return (
                  <div key={a.id} className="flex items-center gap-2.5 rounded-lg border p-2.5">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", cfg.cls)}>
                      <cfg.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{a.discipulador}</span> {a.descripcion}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {format(new Date(a.fecha), "dd/MM/yyyy", { locale: es })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DETALLE DISCIPULADOR */}
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {seleccionado && <DetalleDiscipulador disc={seleccionado} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetalleDiscipulador({ disc }: { disc: DiscipuladorResumen }) {
  const cfg = ESTADOS_DISCIPULADOR[disc.estado];
  return (
    <>
      <SheetHeader className="border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/60">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <SheetTitle className="truncate">{disc.nombre} {disc.apellido}</SheetTitle>
            <SheetDescription className="truncate">{disc.email}</SheetDescription>
          </div>
          <div className="ml-auto shrink-0">
            <EstadoBadge estado={disc.estado} />
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {disc.detalle.alerta && (
          <div className={cn(
            "flex items-start gap-2 rounded-lg border p-3 text-sm",
            disc.estado === "critico"
              ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              : "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          )}>
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{disc.detalle.alerta}</span>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg border p-2 text-center">
            <p className="text-lg font-bold tabular-nums">{disc.activos}</p>
            <p className="text-[10px] text-muted-foreground">Discípulos</p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-lg font-bold tabular-nums">{disc.progresoPromedio !== null ? `${disc.progresoPromedio}%` : "—"}</p>
            <p className="text-[10px] text-muted-foreground">Progreso</p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-lg font-bold tabular-nums">{disc.reunidos}/{disc.activos}</p>
            <p className="text-[10px] text-muted-foreground">Reuniones</p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-lg font-bold tabular-nums text-red-600">{disc.enRiesgo}</p>
            <p className="text-[10px] text-muted-foreground">En riesgo</p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Discípulos asignados</h3>
            <span className="text-xs text-muted-foreground">{disc.detalle.discipulos.length}</span>
          </div>
          {disc.detalle.discipulos.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">Sin discípulos asignados</p>
          ) : (
            <div className="space-y-2">
              {disc.detalle.discipulos.map((d) => (
                <div key={d.id} className="rounded-lg border p-2">
                  <div className="flex items-start gap-2.5">
                    <Avatar persona={d} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/discipulos/ver?id=${d.id}`}
                          className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                        >
                          {d.apellido}, {d.nombre}
                        </Link>
                        {d.progreso !== null && (
                          <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">{d.progreso}%</span>
                        )}
                      </div>
                      {(d.estado === "pausado" || d.estado === "retirado" || d.listoAvanzar) && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {d.estado === "pausado" && (
                            <Badge variant="outline" className="px-1.5 text-[10px] text-amber-600 dark:text-amber-400">Pausado</Badge>
                          )}
                          {d.estado === "retirado" && (
                            <Badge variant="outline" className="px-1.5 text-[10px] text-muted-foreground">Retirado</Badge>
                          )}
                          {d.listoAvanzar && (
                            <Badge variant="secondary" className="px-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">Listo avanzar</Badge>
                          )}
                        </div>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">{d.etapa}</span>
                        {d.diasSinContacto !== null && d.diasSinContacto >= 15 && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-600">
                            <Clock className="h-3 w-3" /> {d.diasSinContacto} días
                          </span>
                        )}
                      </div>
                      {d.razones.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {d.razones.map((r) => (
                            <Badge key={r} variant="outline" className="px-1.5 text-[10px] text-red-600 dark:text-red-400">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {d.progreso !== null && (
                        <BarraProgreso value={d.progreso} bar={cfg.bar} className="mt-2" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Últimas reuniones</h3>
          {disc.detalle.reunionesRecientes.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">Sin reuniones registradas</p>
          ) : (
            <div className="space-y-2">
              {disc.detalle.reunionesRecientes.map((r) => (
                <div key={r.id} className="rounded-lg border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{r.discipulo}</p>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {format(new Date(r.fecha + "T00:00:00"), "dd/MM/yyyy", { locale: es })}
                    </span>
                  </div>
                  {r.tema && <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{r.tema}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
