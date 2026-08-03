"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Etapa } from "@/types/database";
import {
  Users,
  Trophy,
  Cake,
  Church,
  CalendarCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

const avatarColors = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500",
  "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500", "bg-cyan-500",
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

interface DiscipuloBasico {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url?: string | null;
  fecha_nacimiento?: string | null;
  etapa_id: number;
  bautizado?: boolean;
  es_miembro?: boolean;
}

interface CumpleInfo extends DiscipuloBasico {
  fecha_nacimiento: string;
  proxima_fecha: string;
  dias: number;
  edad: number;
}

interface SeguimientoBasico {
  id: string;
  etapa: number;
  progreso: number;
  estado: string;
  discipulos?: { nombre: string; apellido: string };
}

interface AgendaBasico {
  id: string;
  fecha: string;
  tema_tratado: string;
  discipulo_id: string;
  lider_id: string;
}

interface OracionBasica {
  id: string;
  discipulo_id: string;
  pedido: string;
  estado: string;
  fecha: string;
}

interface DashboardClientProps {
  totalDiscipulos: number;
  activos: number;
  discipulosPorEtapa: Array<{ id: number; nombre: string; cantidad: number }>;
  etapaFinal: { id: number; nombre: string };
  enEtapaFinal: number;
  faltanParaMeta: number;
  metaPct: number;
  multiplicadores: DiscipuloBasico[];
  cercaDeMeta: DiscipuloBasico[];
  cumpleProximos7: number;
  cumpleMes: CumpleInfo[];
  oracionesPendientes: number;
  proximasAgendas: AgendaBasico[];
  oracionesPendientesList: OracionBasica[];
  seguimientosActivos: number;
  promedioProgreso: number;
  seguimientoAtencion: SeguimientoBasico[];
  pendientes: DiscipuloBasico[];
  etapas: Etapa[];
}

function Avatar({ persona, className }: { persona: DiscipuloBasico; className?: string }) {
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

function ListaPersonas({
  personas,
  vacio,
  badgeNombre,
}: {
  personas: DiscipuloBasico[];
  vacio: string;
  badgeNombre: string;
}) {
  const visibles = personas.slice(0, 4);
  const restantes = personas.length - visibles.length;
  if (personas.length === 0) {
    return <p className="text-xs text-muted-foreground py-1">{vacio}</p>;
  }
  return (
    <div className="space-y-2">
      {visibles.map((p) => (
        <div key={p.id} className="flex items-center gap-2">
          <Avatar persona={p} />
          <Link
            href={`/discipulos/ver?id=${p.id}`}
            className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
          >
            {p.apellido}, {p.nombre}
          </Link>
          <Badge variant="outline" className="shrink-0 px-1.5 text-[10px]">{badgeNombre}</Badge>
        </div>
      ))}
      {restantes > 0 && (
        <p className="text-xs text-muted-foreground">y {restantes} más...</p>
      )}
    </div>
  );
}

export function DashboardClient({
  totalDiscipulos,
  activos,
  discipulosPorEtapa,
  etapaFinal,
  enEtapaFinal,
  faltanParaMeta,
  metaPct,
  multiplicadores,
  cercaDeMeta,
  cumpleProximos7,
  cumpleMes,
  oracionesPendientes,
  proximasAgendas,
  oracionesPendientesList,
  seguimientosActivos,
  promedioProgreso,
  seguimientoAtencion,
  pendientes,
  etapas,
}: DashboardClientProps) {
  const nombreEtapaFinal = etapaFinal.nombre.replace(/^\d+\.\s*/, "");
  const etapaPrevia = etapas.length > 1 ? etapas[etapas.length - 2] : null;
  const maxPorEtapa = Math.max(...discipulosPorEtapa.map((e) => e.cantidad), 1);

  const stats = [
    {
      title: "Total Discípulos",
      value: totalDiscipulos,
      description: `${activos} activos`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: `En la meta · ${nombreEtapaFinal}`,
      value: enEtapaFinal,
      description: `${metaPct}% del objetivo`,
      icon: Trophy,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
      title: "Cumpleaños próximos",
      value: cumpleProximos7,
      description: "en los próximos 7 días",
      icon: Cake,
      color: "text-pink-600",
      bg: "bg-pink-50 dark:bg-pink-950",
    },
    {
      title: "Oraciones pendientes",
      value: oracionesPendientes,
      description: "necesitan atención",
      icon: Church,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  return (
    <div className="flex flex-col gap-3 lg:h-[calc(100dvh-6.5rem)] lg:overflow-hidden">
      {/* HEADER */}
      <div className="lg:shrink-0">
        <h1 className="text-2xl font-bold lg:text-xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          El objetivo final es que todas las personas lleguen a {etapaFinal.nombre}
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 lg:shrink-0 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} size="sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="truncate text-sm">{stat.title}</CardTitle>
              <div className={cn("rounded-lg p-2 shrink-0", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CONTENIDO PRINCIPAL (2 filas) */}
      <div className="grid gap-3 md:grid-cols-3 lg:min-h-0 lg:flex-1 lg:grid-rows-2">
        {/* LA META */}
        <Card size="sm" className="min-h-0 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent md:col-span-2">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-500/15 p-2">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-amber-500">
                  La Meta del Discipulado
                </p>
                <h2 className="text-lg font-bold leading-tight">
                  Que todos lleguen a {etapaFinal.nombre}
                </h2>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{enEtapaFinal}</span> de{" "}
                  <span className="font-semibold text-foreground">{totalDiscipulos}</span> personas
                  · {metaPct}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Progress value={metaPct} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {faltanParaMeta === 0 ? (
                  <span className="inline-flex items-center gap-1 font-medium text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> ¡Objetivo cumplido!
                  </span>
                ) : (
                  <>Faltan <span className="font-semibold text-amber-600">{faltanParaMeta}</span></>
                )}
              </span>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden border-t pt-3 sm:grid-cols-2">
              <div className="min-h-0 overflow-y-auto pr-1">
                <div className="mb-2 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Multiplicadores ({multiplicadores.length})
                  </h3>
                </div>
                <ListaPersonas
                  personas={multiplicadores}
                  vacio="Todavía no hay nadie en la meta"
                  badgeNombre="Meta"
                />
              </div>
              <div className="min-h-0 overflow-y-auto pr-1">
                <div className="mb-2 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-blue-500" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Próximos a la meta ({cercaDeMeta.length})
                  </h3>
                </div>
                <ListaPersonas
                  personas={cercaDeMeta}
                  vacio="No hay personas en la etapa previa"
                  badgeNombre={etapaPrevia ? etapaPrevia.nombre.replace(/^\d+\.\s*/, "") : "Etapa previa"}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CUMPLEAÑOS */}
        <Card size="sm" className="min-h-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Cumpleaños próximos</CardTitle>
              <Cake className="h-4 w-4 text-pink-500" />
            </div>
            <CardDescription>Próximos 30 días</CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {cumpleMes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">
                No hay cumpleaños en los próximos 30 días
              </p>
            ) : (
              cumpleMes.slice(0, 6).map((c) => {
                const fechaCumple = new Date(c.proxima_fecha);
                const diasLabel =
                  c.dias === 0
                    ? "Hoy"
                    : c.dias === 1
                      ? "Mañana"
                      : c.dias <= 7
                        ? `en ${c.dias} días`
                        : format(fechaCumple, "dd MMM", { locale: es });
                return (
                  <div key={c.id} className="flex items-center gap-2.5">
                    <Avatar persona={c} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/discipulos/ver?id=${c.id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {c.apellido}, {c.nombre}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">
                        {format(fechaCumple, "dd/MM", { locale: es })} · cumple {c.edad} años
                      </p>
                    </div>
                    <Badge variant={c.dias <= 1 ? "default" : "secondary"} className="shrink-0 px-1.5 text-[10px]">
                      {diasLabel}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* ETAPAS */}
        <Card size="sm" className="min-h-0">
          <CardHeader>
            <CardTitle className="text-base">Personas por etapa</CardTitle>
            <CardDescription>Camino hacia {etapaFinal.nombre}</CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {discipulosPorEtapa.map((e, i) => {
              const esMeta = i === discipulosPorEtapa.length - 1;
              const pct = Math.round((e.cantidad / maxPorEtapa) * 100);
              return (
                <div key={e.id}>
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 truncate text-xs font-medium",
                        esMeta && "text-amber-600"
                      )}
                    >
                      {esMeta && <Trophy className="h-3 w-3 shrink-0" />}
                      {e.nombre}
                    </span>
                    <span className="text-sm font-bold tabular-nums shrink-0">{e.cantidad}</span>
                  </div>
                  <div className="h-3.5 overflow-hidden rounded bg-muted">
                    <div
                      className={cn("h-full rounded", esMeta ? "bg-amber-500" : "bg-primary/80")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-xs text-muted-foreground">Faltan para la meta</span>
              <span className="text-sm font-bold text-amber-600 tabular-nums">{faltanParaMeta}</span>
            </div>
          </CardContent>
        </Card>

        {/* CITAS */}
        <Card size="sm" className="min-h-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Próximas citas</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {proximasAgendas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">No hay citas programadas</p>
            ) : (
              proximasAgendas.map((agenda) => (
                <div key={agenda.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{agenda.tema_tratado}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(agenda.fecha), "dd/MM/yyyy", { locale: es })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 px-1.5 text-[10px]">Próximo</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ORACIONES */}
        <Card size="sm" className="min-h-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Oraciones pendientes</CardTitle>
              <Church className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {oracionesPendientesList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">No hay pedidos de oración pendientes</p>
            ) : (
              oracionesPendientesList.map((oracion) => (
                <div key={oracion.id} className="border-b pb-2 last:border-0">
                  <p className="line-clamp-2 text-sm">{oracion.pedido}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(oracion.fecha), "dd/MM/yyyy", { locale: es })}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEGUIMIENTO: NECESITAN ATENCIÓN */}
      <Card size="sm" className="shrink-0">
        <CardContent className="flex items-center gap-4 p-3">
          <div className="shrink-0 space-y-0.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              Necesitan atención
            </p>
            <p className="text-[11px] text-muted-foreground">
              {seguimientosActivos} activos · progreso promedio {promedioProgreso}%
              {pendientes.length > 0 && ` · ${pendientes.length} pendientes`}
            </p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex gap-3 overflow-x-auto">
              {seguimientoAtencion.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Sin seguimientos con progreso bajo</p>
              ) : (
                seguimientoAtencion.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex min-w-[150px] flex-1 flex-col gap-1 rounded-lg border p-2">
                    <Link
                      href={`/seguimiento/ver?id=${s.id}`}
                      className="truncate text-xs font-medium hover:underline"
                    >
                      {s.discipulos ? `${s.discipulos.nombre} ${s.discipulos.apellido}` : "—"}
                    </Link>
                    <div className="flex items-center gap-2">
                      <Progress value={s.progreso} className="flex-1" />
                      <span className="text-[11px] font-medium tabular-nums">{s.progreso}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {pendientes.length > 0 && (
              <div className="flex gap-3 overflow-x-auto">
                {pendientes.slice(0, 5).map((d) => (
                  <div key={d.id} className="flex min-w-[190px] flex-1 flex-col gap-0.5 rounded-lg border border-amber-500/40 bg-amber-50 p-2 dark:bg-amber-950">
                    <Link
                      href={`/discipulos/ver?id=${d.id}`}
                      className="truncate text-xs font-medium hover:underline"
                    >
                      {d.apellido}, {d.nombre}
                    </Link>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      Pendiente: {!d.bautizado && "bautismo"}
                      {!d.bautizado && !d.es_miembro && " + "}
                      {!d.es_miembro && "membresía"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
