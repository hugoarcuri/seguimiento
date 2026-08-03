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
  etapas: Etapa[];
}

function Avatar({ persona, className }: { persona: DiscipuloBasico; className?: string }) {
  if (persona.avatar_url) {
    return (
      <img
        src={persona.avatar_url}
        alt=""
        className={cn("h-9 w-9 shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold",
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
  const visibles = personas.slice(0, 5);
  const restantes = personas.length - visibles.length;
  if (personas.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">{vacio}</p>;
  }
  return (
    <div className="space-y-2">
      {visibles.map((p) => (
        <div key={p.id} className="flex items-center gap-2.5">
          <Avatar persona={p} />
          <Link
            href={`/discipulos/ver?id=${p.id}`}
            className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
          >
            {p.apellido}, {p.nombre}
          </Link>
          <Badge variant="outline" className="shrink-0">{badgeNombre}</Badge>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          El objetivo final es que todas las personas lleguen a {etapaFinal.nombre}
        </p>
      </div>

      {/* HERO: LA META */}
      <Card className="overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-amber-500/15 p-3">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-500">
                  La Meta del Discipulado
                </p>
                <h2 className="text-xl font-bold leading-tight">
                  Que todos lleguen a {etapaFinal.nombre}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold text-foreground">{enEtapaFinal}</span> de{" "}
                  <span className="font-semibold text-foreground">{totalDiscipulos}</span> personas
                  ya llegaron a la meta
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Progress value={metaPct} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {faltanParaMeta === 0 ? (
                  <span className="inline-flex items-center gap-1 font-medium text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> ¡Objetivo cumplido!
                  </span>
                ) : (
                  <>Faltan <span className="font-semibold text-amber-600">{faltanParaMeta}</span> personas para alcanzar el objetivo</>
                )}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold">Multiplicadores ({multiplicadores.length})</h3>
                </div>
                <ListaPersonas
                  personas={multiplicadores}
                  vacio="Todavía no hay nadie en la meta"
                  badgeNombre="Meta"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-semibold">
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
          </div>
        </CardContent>
      </Card>

      {/* STATS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate">{stat.title}</CardTitle>
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

      {/* ETAPAS + CUMPLEAÑOS */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personas en las diferentes etapas</CardTitle>
            <CardDescription>
              El camino de cada persona hasta {etapaFinal.nombre}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {discipulosPorEtapa.map((e, i) => {
              const esMeta = i === discipulosPorEtapa.length - 1;
              const pct = Math.round((e.cantidad / maxPorEtapa) * 100);
              return (
                <div key={e.id}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-sm font-medium truncate",
                        esMeta && "text-amber-600"
                      )}
                    >
                      {esMeta && <Trophy className="h-3.5 w-3.5 shrink-0" />}
                      {e.nombre}
                    </span>
                    <span className="text-sm font-bold tabular-nums shrink-0">{e.cantidad}</span>
                  </div>
                  <div className="h-5 overflow-hidden rounded-md bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-md",
                        esMeta ? "bg-amber-500" : "bg-primary/80"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-xs text-muted-foreground">Faltan para alcanzar la meta</span>
              <span className="text-sm font-bold text-amber-600 tabular-nums">
                {faltanParaMeta} personas
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cumpleaños próximos</CardTitle>
                <CardDescription>Los próximos 30 días</CardDescription>
              </div>
              <Cake className="h-4 w-4 text-pink-500" />
            </div>
          </CardHeader>
          <CardContent>
            {cumpleMes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No hay cumpleaños en los próximos 30 días
              </p>
            ) : (
              <div className="space-y-3">
                {cumpleMes.map((c) => {
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
                    <div key={c.id} className="flex items-center gap-3">
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
                      <Badge variant={c.dias <= 1 ? "default" : "secondary"} className="shrink-0">
                        {diasLabel}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* OPERATIVO */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Próximas citas</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {proximasAgendas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No hay citas programadas</p>
            ) : (
              <div className="space-y-3">
                {proximasAgendas.map((agenda) => (
                  <div key={agenda.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{agenda.tema_tratado}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(agenda.fecha), "dd/MM/yyyy", { locale: es })}
                      </p>
                    </div>
                    <Badge variant="secondary">Próximo</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Oraciones pendientes</CardTitle>
              <Church className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {oracionesPendientesList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No hay pedidos de oración pendientes</p>
            ) : (
              <div className="space-y-3">
                {oracionesPendientesList.map((oracion) => (
                  <div key={oracion.id} className="border-b pb-2 last:border-0">
                    <p className="line-clamp-2 text-sm">{oracion.pedido}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(oracion.fecha), "dd/MM/yyyy", { locale: es })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Seguimiento: necesitan atención</CardTitle>
                <CardDescription>
                  {seguimientosActivos} seguimientos activos · progreso promedio {promedioProgreso}%
                </CardDescription>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {seguimientoAtencion.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No hay seguimientos con progreso bajo</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {seguimientoAtencion.map((s) => (
                  <div key={s.id} className="rounded-lg border p-3">
                    <Link
                      href={`/seguimiento/ver?id=${s.id}`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {s.discipulos ? `${s.discipulos.apellido}, ${s.discipulos.nombre}` : "—"}
                    </Link>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={s.progreso} className="flex-1" />
                      <span className="text-xs font-medium tabular-nums shrink-0">{s.progreso}%</span>
                    </div>
                    <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
                      {etapas.find((e) => e.id === s.etapa)?.nombre || `Etapa ${s.etapa}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
