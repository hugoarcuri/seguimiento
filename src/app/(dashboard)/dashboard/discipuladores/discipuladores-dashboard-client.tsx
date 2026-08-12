"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserCog, Users, AlertTriangle, Clock, ClipboardCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export interface DiscipuladorDetalle {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  total: number;
  activos: number;
  enRiesgo: number;
  sinContacto: number;
  progresoPromedio: number | null;
  listosAvanzar: number;
  discipulos: {
    id: string;
    nombre: string;
    apellido: string;
    avatar_url: string | null;
    estado: string;
    etapa: string;
    progreso: number | null;
    razones: string[];
    diasSinContacto: number | null;
  }[];
}

export interface DiscipuladoresDashboardData {
  kpis: {
    totalDiscipuladores: number;
    totalAsignados: number;
    totalEnRiesgo: number;
    totalSinContacto: number;
    sinDiscipulos: number;
  };
  detalle: DiscipuladorDetalle[];
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

export function DiscipuladoresDashboardClient({ data }: { data: DiscipuladoresDashboardData }) {
  const { kpis, detalle } = data;

  const stats = [
    {
      title: "Discipuladores",
      value: kpis.totalDiscipuladores,
      description: `${kpis.sinDiscipulos} sin discípulos asignados`,
      icon: UserCog,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      href: "/discipuladores",
    },
    {
      title: "Discípulos asignados",
      value: kpis.totalAsignados,
      description: "bajo la cobertura de discipuladores",
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950",
      href: "/discipulos",
    },
    {
      title: "En riesgo",
      value: kpis.totalEnRiesgo,
      description: "progreso bajo o sin seguimiento",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950",
      href: "/discipulos",
    },
    {
      title: "Sin contacto",
      value: kpis.totalSinContacto,
      description: `sin encuentro en 15+ días`,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
      href: "/agenda",
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold lg:text-xl">Dashboard Discipuladores</h1>
        <p className="text-sm text-muted-foreground">
          Estado y avance de cada discipulador y de los discípulos que tiene asignados
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href} className="group block">
            <Card size="sm" className="transition-colors group-hover:border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="min-w-0 flex-1 truncate text-sm">{stat.title}</CardTitle>
                <div className={cn("rounded-lg p-2 shrink-0", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* DETALLE POR DISCIPULADOR */}
      <div className="grid gap-3 lg:grid-cols-2">
        {detalle.length === 0 ? (
          <Card size="sm" className="lg:col-span-2">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No hay discipuladores registrados todavía.
            </CardContent>
          </Card>
        ) : (
          detalle.map((disc) => (
            <Card key={disc.id} size="sm" className="border-blue-200/60 dark:border-blue-900/60">
              <CardHeader className="shrink-0 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex min-w-0 items-center gap-2 text-base">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50">
                      <UserCog className="h-4 w-4" />
                    </div>
                    <span className="truncate">{disc.nombre} {disc.apellido}</span>
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0">{disc.total} discípulos</Badge>
                </div>
                <CardDescription className="truncate">{disc.email}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Mini KPIs del discipulador */}
                <div className="mb-3 grid grid-cols-4 gap-2">
                  <div className="rounded-lg border p-2 text-center">
                    <p className="text-lg font-bold tabular-nums text-emerald-600">{disc.activos}</p>
                    <p className="text-[10px] text-muted-foreground">Activos</p>
                  </div>
                  <div className="rounded-lg border p-2 text-center">
                    <p className="text-lg font-bold tabular-nums">{disc.progresoPromedio !== null ? `${disc.progresoPromedio}%` : "—"}</p>
                    <p className="text-[10px] text-muted-foreground">Progreso prom.</p>
                  </div>
                  <div className="rounded-lg border p-2 text-center">
                    <p className="text-lg font-bold tabular-nums text-red-600">{disc.enRiesgo}</p>
                    <p className="text-[10px] text-muted-foreground">En riesgo</p>
                  </div>
                  <div className="rounded-lg border p-2 text-center">
                    <p className="text-lg font-bold tabular-nums text-amber-600">{disc.sinContacto}</p>
                    <p className="text-[10px] text-muted-foreground">Sin contacto</p>
                  </div>
                </div>

                {/* Discípulos del discipulador */}
                {disc.discipulos.length === 0 ? (
                  <p className="py-1 text-sm text-muted-foreground">Sin discípulos asignados</p>
                ) : (
                  <div className="space-y-2">
                    {disc.discipulos.map((d) => (
                      <div key={d.id} className="flex items-center gap-2.5 rounded-lg border p-2">
                        <Avatar persona={d} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/discipulos/ver?id=${d.id}`}
                              className="truncate text-sm font-medium hover:underline"
                            >
                              {d.apellido}, {d.nombre}
                            </Link>
                            {d.estado === "pausado" && (
                              <Badge variant="outline" className="shrink-0 px-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                                Pausado
                              </Badge>
                            )}
                            {d.estado === "retirado" && (
                              <Badge variant="outline" className="shrink-0 px-1.5 text-[10px] text-muted-foreground">
                                Retirado
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-[11px] text-muted-foreground">{d.etapa}</span>
                            {d.progreso !== null && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium">
                                <ClipboardCheck className="h-3 w-3" />
                                {d.progreso}%
                              </span>
                            )}
                            {d.diasSinContacto !== null && d.diasSinContacto >= 15 && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-600">
                                <Clock className="h-3 w-3" />
                                {d.diasSinContacto} días
                              </span>
                            )}
                          </div>
                          {d.razones.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {d.razones.map((r) => (
                                <Badge
                                  key={r}
                                  variant="outline"
                                  className="px-1.5 text-[10px] text-red-600 dark:text-red-400"
                                >
                                  {r}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {d.progreso !== null && d.progreso >= 80 && (
                          <Badge variant="secondary" className="shrink-0 px-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                            Listo avanzar
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {disc.listosAvanzar > 0 && (
                  <Link
                    href="/discipulos"
                    className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                  >
                    <ArrowRight className="h-3 w-3" />
                    {disc.listosAvanzar} discípulo(s) listos para avanzar de etapa
                  </Link>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
