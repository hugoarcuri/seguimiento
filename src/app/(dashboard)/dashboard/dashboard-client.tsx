"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Users,
  Trophy,
  Activity,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Church,
  HeartHandshake,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface DiscipuloRaw {
  id: string;
  nombre: string;
  apellido: string;
  avatar_url?: string | null;
  etapa_id: number;
  estado: string;
  lider_id?: string | null;
  bautizado?: boolean | null;
  es_miembro?: boolean | null;
}

export interface UrgenteItem {
  discipulo: DiscipuloRaw;
  razones: string[];
}

export interface ListoAvanzar {
  discipulo: DiscipuloRaw;
  progreso: number;
  proximaEtapa?: string;
}

export interface OracionVieja {
  id: string;
  pedido: string;
  dias: number;
}

export interface OracionReciente {
  id: string;
  pedido: string;
  estado: string;
  fecha: string;
  discipulo?: string;
}

export interface EventoReciente {
  id: string;
  descripcion: string;
  tipo: string;
  fecha: string;
  persona?: string;
}

export interface EvangelismoListo {
  id: string;
  nombre: string;
  apellido: string;
  estado: string;
  dias: number;
}

export interface DiscipuladorItem {
  id: string;
  nombre: string;
  apellido: string;
  total: number;
  enRiesgo: number;
  sinContacto: number;
}

export interface EtapaCount {
  id: number;
  nombre: string;
  cantidad: number;
}

export interface Salud {
  totalDiscipulos: number;
  activos: number;
  pausados: number;
  retirados: number;
  retencionPct: number;
  enEtapaFinal: number;
  metaPct: number;
  promedioProgreso: number;
  tareasCumplimientoPct: number;
  tareasVencidas: number;
  bautizadosPct: number;
  miembrosPct: number;
  oracionesPendientes: number;
  oracionesRespondidasPct: number;
  contactoPct: number;
  discipulosPorEtapa: EtapaCount[];
}

export interface DashboardData {
  etapaFinal: { id: number; nombre: string };
  salud: Salud;
  urgentes: UrgenteItem[];
  oracionesViejas: OracionVieja[];
  listosAvanzar: ListoAvanzar[];
  evangelismoListos: EvangelismoListo[];
  discipuladores: DiscipuladorItem[];
  oracionesRecientes: OracionReciente[];
  evangelismoRecientes: EventoReciente[];
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

function Avatar({ persona, className }: { persona: DiscipuloRaw; className?: string }) {
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

function Barra({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded bg-muted">
        <div className={cn("h-full rounded", className)} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const { etapaFinal, salud } = data;
  const nombreMeta = etapaFinal.nombre.replace(/^\d+\.\s*/, "");
  const maxPorEtapa = Math.max(...salud.discipulosPorEtapa.map((e) => e.cantidad), 1);
  const totalListos = data.listosAvanzar.length + data.evangelismoListos.length;

  const stats = [
    {
      title: "Discípulos activos",
      value: salud.activos,
      description: `${salud.totalDiscipulos} en total · ${salud.pausados} pausados · ${salud.retirados} retirados`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      href: "/discipulos",
    },
    {
      title: `En la meta · ${nombreMeta}`,
      value: salud.enEtapaFinal,
      description: `${salud.metaPct}% de los activos`,
      icon: Trophy,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
      href: "/discipulos",
    },
    {
      title: "Progreso promedio",
      value: `${salud.promedioProgreso}%`,
      description: "seguimientos activos",
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950",
      href: "/seguimiento",
    },
    {
      title: "Tareas cumplidas",
      value: `${salud.tareasCumplimientoPct}%`,
      description: `${salud.tareasVencidas} vencidas · ${salud.oracionesPendientes} oraciones pendientes`,
      icon: ClipboardCheck,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950",
      href: "/tareas",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold lg:text-xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          El objetivo final es que todas las personas lleguen a {etapaFinal.nombre}
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

      {/* 3 COLUMNAS: SALUD+ACTIVIDAD | URGENTES | LISTOS+DISCIPULADORES */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="flex min-h-0 flex-col gap-3">
          <Card size="sm" className="flex min-h-0 flex-col lg:max-h-[26rem]">
          <CardHeader className="shrink-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-emerald-500" />
              Salud real del discipulado
            </CardTitle>
            <CardDescription>Retención, madurez, contacto y avance de la iglesia</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="space-y-2.5">
                <Barra label="Retención (activos)" value={salud.retencionPct} className="bg-blue-500" />
                <Barra label="Contacto en los últimos 15 días" value={salud.contactoPct} className="bg-emerald-500" />
                <Barra label="Bautizados" value={salud.bautizadosPct} className="bg-amber-500" />
                <Barra label="Miembros" value={salud.miembrosPct} className="bg-violet-500" />
                <Barra label="Oraciones respondidas" value={salud.oracionesRespondidasPct} className="bg-cyan-500" />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Personas por etapa
                </p>
              <div className="space-y-2">
                {salud.discipulosPorEtapa.map((e, i) => {
                  const esMeta = i === salud.discipulosPorEtapa.length - 1;
                  const pct = Math.round((e.cantidad / maxPorEtapa) * 100);
                  return (
                    <Link key={e.id} href="/discipulos" className="group block rounded p-1 transition-colors hover:bg-muted/50">
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "flex min-w-0 items-center gap-1.5 truncate text-xs font-medium",
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
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* ACTIVIDAD RECIENTE */}
          <Card size="sm" className="flex min-h-0 flex-col lg:max-h-[20rem]">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-blue-500" />
                Actividad reciente
              </CardTitle>
              <CardDescription>Motivos de oración y avances de evangelismo</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="grid gap-4">
            {/* MOTIVOS DE ORACIÓN */}
            <div>
              <Link href="/oracion" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground">
                <Church className="h-3.5 w-3.5" /> Motivos de oración
                <ArrowRight className="h-3 w-3" />
              </Link>
              {data.oracionesRecientes.length === 0 ? (
                <p className="py-1 text-xs text-muted-foreground">Sin motivos recientes</p>
              ) : (
                <div className="space-y-2">
                  {data.oracionesRecientes.map((o) => (
                    <Link key={o.id} href="/oracion" className="block rounded-lg border p-2.5 transition-colors hover:border-primary/50 hover:no-underline">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm text-foreground">{o.pedido}</p>
                        {o.estado === "respondida" ? (
                          <Badge variant="secondary" className="shrink-0 px-1.5 text-[10px]">Respondida</Badge>
                        ) : o.estado === "en_oracion" ? (
                          <Badge variant="outline" className="shrink-0 px-1.5 text-[10px] text-blue-600 dark:text-blue-400">En oración</Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0 px-1.5 text-[10px] text-amber-600 dark:text-amber-400">Pendiente</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {o.discipulo ? `${o.discipulo} · ` : ""}
                        {format(new Date(o.fecha + "T00:00:00"), "dd/MM/yyyy", { locale: es })}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* EVANGELISMO */}
            <div>
              <Link href="/evangelismo" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground">
                <HeartHandshake className="h-3.5 w-3.5" /> Evangelismo
                <ArrowRight className="h-3 w-3" />
              </Link>
              {data.evangelismoRecientes.length === 0 ? (
                <p className="py-1 text-xs text-muted-foreground">Sin actividad reciente</p>
              ) : (
                <div className="space-y-2">
                  {data.evangelismoRecientes.map((e) => (
                    <Link key={e.id} href="/evangelismo" className="block rounded-lg border p-2.5 transition-colors hover:border-primary/50 hover:no-underline">
                      <p className="line-clamp-2 text-sm text-foreground">{e.descripcion}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {e.persona ? `${e.persona} · ` : ""}
                        {format(new Date(e.fecha + "T00:00:00"), "dd/MM/yyyy", { locale: es })}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          </CardContent>
        </Card>
      </div>

        {/* QUIÉN NECESITA ATENCIÓN URGENTE */}
        <Card size="sm" className="flex min-h-0 flex-col border-red-200 dark:border-red-900 lg:max-h-[46rem]">
          <CardHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Necesitan atención urgente
              </CardTitle>
              <Badge variant="destructive">{data.urgentes.length}</Badge>
            </div>
            <CardDescription>Sin seguimiento, progreso bajo, sin encuentro, pendientes o sin discipulador</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-2 overflow-y-auto">
          {data.urgentes.length === 0 ? (
            <p className="py-1 text-sm text-muted-foreground">No hay nadie que requiera atención urgente</p>
          ) : (
            data.urgentes.map((u) => (
              <div
                key={u.discipulo.id}
                className="flex items-center gap-2.5 rounded-lg border border-red-200/70 bg-red-50/40 p-2 dark:bg-red-950/20"
              >
                <Avatar persona={u.discipulo} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/discipulos/ver?id=${u.discipulo.id}`}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {u.discipulo.apellido}, {u.discipulo.nombre}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {u.razones.map((r) => (
                      <Badge
                        key={r}
                        variant="outline"
                        className="px-1.5 text-[10px] text-red-600 dark:text-red-400"
                      >
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}

          {data.oracionesViejas.length > 0 && (
            <div className="mt-2 space-y-1.5 border-t pt-2">
              <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <Clock className="h-3 w-3" /> Oraciones sin respuesta (30+ días)
              </p>
              {data.oracionesViejas.map((o) => (
                <Link
                  key={o.id}
                  href="/oracion"
                  className="flex items-center gap-2 rounded text-xs transition-colors hover:bg-muted/50 hover:no-underline"
                >
                  <Church className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{o.pedido}</span>
                  <span className="shrink-0 font-medium text-amber-600">{o.dias} días</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
        </Card>

      {/* COL 3: LISTOS + DISCIPULADORES */}
      <div className="flex min-h-0 flex-col gap-3">
        <Card size="sm" className="flex min-h-0 flex-col border-emerald-200 dark:border-emerald-900 lg:max-h-[24rem]">
          <CardHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Listos para avanzar
              </CardTitle>
              <Badge variant="secondary">{totalListos}</Badge>
            </div>
            <CardDescription>Progreso 80%+ en su etapa o 30+ días en la etapa de evangelismo</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-2 overflow-y-auto">
          {data.listosAvanzar.length > 0 && (
            <>
              <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-3 w-3 text-emerald-500" /> Discípulos ({data.listosAvanzar.length})
              </p>
              {data.listosAvanzar.map((l) => (
                <div key={l.discipulo.id} className="flex items-center gap-2.5 rounded-lg border border-emerald-200/70 bg-emerald-50/40 p-2 dark:bg-emerald-950/20">
                  <Avatar persona={l.discipulo} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/discipulos/ver?id=${l.discipulo.id}`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {l.discipulo.apellido}, {l.discipulo.nombre}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {l.progreso}% completado
                      {l.proximaEtapa && (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                          <ArrowRight className="h-3 w-3" /> {l.proximaEtapa}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}

          {data.evangelismoListos.length > 0 && (
            <>
              <p className="flex items-center gap-1 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <HeartHandshake className="h-3 w-3 text-emerald-500" /> Evangelismo ({data.evangelismoListos.length})
              </p>
              {data.evangelismoListos.map((p) => (
                <div key={p.id} className="flex items-center gap-2.5 rounded-lg border border-emerald-200/70 bg-emerald-50/40 p-2 dark:bg-emerald-950/20">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50">
                    <HeartHandshake className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href="/evangelismo" className="block truncate text-sm font-medium hover:underline">
                      {p.nombre} {p.apellido}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {p.dias} días en {p.estado === "oracion_salvacion" ? "oración" : p.estado === "actos_servicio" ? "actos de servicio" : "evangelio"}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                </div>
              ))}
            </>
          )}

          {totalListos === 0 && (
            <p className="py-1 text-sm text-muted-foreground">No hay nadie listo para avanzar ahora mismo</p>
          )}
        </CardContent>
      </Card>

          {/* DISCIPULADORES QUE REQUIEREN APOYO */}
          <Card size="sm" className="flex min-h-0 flex-col lg:max-h-[20rem]">
            <CardHeader className="shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <HeartHandshake className="h-4 w-4 text-muted-foreground" />
                  Discipuladores que requieren apoyo
                </CardTitle>
                <Badge variant="secondary">{data.discipuladores.length}</Badge>
              </div>
              <CardDescription>Por cantidad de discípulos en riesgo o sin encuentro reciente</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 overflow-y-auto">
              {data.discipuladores.length === 0 ? (
                <p className="py-1 text-sm text-muted-foreground">Todos los discipuladores están al día</p>
              ) : (
                <div className="grid gap-2">
                  {data.discipuladores.map((d) => (
                    <Link
                      key={d.id}
                      href="/discipulos"
                      className="rounded-lg border p-3 transition-colors hover:border-primary/50 hover:no-underline"
                    >
                      <p className="truncate text-sm font-medium">{d.nombre} {d.apellido}</p>
                      <p className="text-xs text-muted-foreground">{d.total} discípulos</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {d.enRiesgo > 0 && (
                          <Badge variant="destructive" className="px-1.5 text-[10px]">
                            {d.enRiesgo} en riesgo
                          </Badge>
                        )}
                        {d.sinContacto > 0 && (
                          <Badge variant="outline" className="px-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                            {d.sinContacto} sin encuentro
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
