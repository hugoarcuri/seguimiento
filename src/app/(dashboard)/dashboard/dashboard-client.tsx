"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { nombreEtapa } from "../seguimiento/seguimiento-constants";
import { Users, UserPlus, TrendingUp, CalendarCheck, Church, AlertCircle, Cake, Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar, PieChart, Pie, Cell, Legend } from "@/components/recharts-dynamic";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
import { format, isToday } from "date-fns";
import Link from "next/link";
import { es } from "date-fns/locale";

const AXIS = {
  tick: { fill: "currentColor", fontSize: 12 },
  tickLine: { stroke: "currentColor" },
  axisLine: { stroke: "currentColor" },
} as const;

const CURSOR = { fill: "hsl(var(--muted))", opacity: 0.7 };

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: string | number; payload?: { fill?: string } }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-popover-foreground">
      {label != null && <p className="mb-1.5 text-xs font-semibold">{label}</p>}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.payload?.fill || "currentColor" }} />
            <span className="text-xs text-muted-foreground capitalize">{p.name}</span>
            <span className="ml-auto text-xs font-semibold tabular-nums">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const pieLabel = ({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }: {
  cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number;
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.62;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="var(--foreground)" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 12, fontWeight: 600 }}>
      {`${Math.round(percent * 100)}%`}
    </text>
  );
};

interface DiscipuloBasico {
  id: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento?: string;
  etapa_id: number;
}

interface DashboardClientProps {
  totalDiscipulos: number;
  discipulosPorEtapa: Array<{ nombre: string; cantidad: number }>;
  activos: number;
  completados: number;
  pausados: number;
  retirados: number;
  oracionesPendientes: number;
  totalAgendas: number;
  totalOraciones: number;
  oracionesRespondidas: number;
  agendasPorMes: Array<{ mes: string; cantidad: number }>;
  proximasAgendas: Array<{
    id: string;
    fecha: string;
    tema_tratado: string;
    discipulo_id: string;
    lider_id: string;
  }>;
  oracionesPendientesList: Array<{
    id: string;
    discipulo_id: string;
    pedido: string;
    estado: string;
    fecha: string;
  }>;
  proximosCumples: DiscipuloBasico[];
  seguimientosActivos: number;
  promedioProgreso: number;
  seguimientosPorEtapa: Array<{ nombre: string; cantidad: number }>;
  seguimientoAtencion: Array<{
    id: string;
    etapa: number;
    progreso: number;
    estado: string;
    discipulos?: { nombre: string; apellido: string };
  }>;
}

export function DashboardClient({
  totalDiscipulos,
  discipulosPorEtapa,
  activos,
  completados,
  pausados,
  retirados,
  oracionesPendientes,
  totalAgendas,
  totalOraciones,
  oracionesRespondidas,
  agendasPorMes,
  proximasAgendas,
  oracionesPendientesList,
  proximosCumples,
  seguimientosActivos,
  promedioProgreso,
  seguimientosPorEtapa,
  seguimientoAtencion,
}: DashboardClientProps) {
  const chartData = discipulosPorEtapa.map((e, i) => ({
    name: e.nombre,
    value: e.cantidad,
    fill: COLORS[i % COLORS.length],
  }));

  const madurezChartData = seguimientosPorEtapa.map((e, i) => ({
    ...e,
    fill: COLORS[i % COLORS.length],
  }));

  const estadoData = [
    { name: "Activos", value: activos, fill: COLORS[0] },
    { name: "Completados", value: completados, fill: COLORS[1] },
    { name: "Pausados", value: pausados, fill: COLORS[2] },
    { name: "Retirados", value: retirados, fill: COLORS[3] },
  ];

  const primeraEtapa = discipulosPorEtapa[0];
  const ultimaEtapa = discipulosPorEtapa[discipulosPorEtapa.length - 1];

  const statsCards = [
    {
      title: "Total Discípulos",
      value: totalDiscipulos,
      description: `${activos} activos`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: primeraEtapa?.nombre || "Etapa inicial",
      value: primeraEtapa?.cantidad ?? 0,
      description: "Etapa inicial",
      icon: UserPlus,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      title: ultimaEtapa?.nombre || "Etapa final",
      value: ultimaEtapa?.cantidad ?? 0,
      description: "Etapa final",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "En Seguimiento",
      value: seguimientosActivos,
      description: `Progreso promedio ${promedioProgreso}%`,
      icon: Activity,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950",
    },
    {
      title: "Oración Pendiente",
      value: oracionesPendientes,
      description: "Necesitan atención",
      icon: AlertCircle,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del discipulado
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discípulos por Etapa</CardTitle>
              <CardDescription>
                Distribución actual en el proceso de discipulado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" {...AXIS} />
                    <YAxis {...AXIS} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={CURSOR} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Etapa de Madurez</CardTitle>
              <CardDescription>
                Discípulos en seguimiento por etapa de crecimiento espiritual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={madurezChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="nombre" {...AXIS} />
                    <YAxis {...AXIS} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={CURSOR} />
                    <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                      {madurezChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Próximas citas</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {proximasAgendas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay citas programadas
                </p>
              ) : (
                <div className="space-y-3">
                  {proximasAgendas.map((agenda) => (
                    <div
                      key={agenda.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {agenda.tema_tratado}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(agenda.fecha), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <Badge variant="secondary">Próximo</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {proximosCumples.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Cumpleaños Próximos</CardTitle>
                  <Cake className="h-4 w-4 text-pink-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {proximosCumples.map((d) => {
                    if (!d.fecha_nacimiento) return null;
                    const nac = new Date(d.fecha_nacimiento);
                    const cumple = new Date(new Date().getFullYear(), nac.getMonth(), nac.getDate());
                    return (
                      <div key={d.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <Link href={`/discipulos/${d.id}`} className="text-sm font-medium hover:underline">
                            {d.apellido}, {d.nombre}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {format(cumple, "dd/MM", { locale: es })}
                          </p>
                        </div>
                        <Badge variant={isToday(cumple) ? "default" : "secondary"}>
                          {isToday(cumple) ? "Hoy" : format(cumple, "EEEE", { locale: es })}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Seguimiento: necesitan atención
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {seguimientoAtencion.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay seguimientos activos con progreso bajo
                </p>
              ) : (
                <div className="space-y-3">
                  {seguimientoAtencion.map((s) => (
                    <div key={s.id} className="border-b pb-2 last:border-0">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/seguimiento/ver?id=${s.id}`}
                          className="text-sm font-medium hover:underline truncate"
                        >
                          {s.discipulos ? `${s.discipulos.apellido}, ${s.discipulos.nombre}` : "—"}
                        </Link>
                        <span className="text-xs font-medium tabular-nums shrink-0">{s.progreso}%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={s.progreso} className="flex-1" />
                        <Badge variant="outline" className="shrink-0">{nombreEtapa(s.etapa)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Oraciones Pendientes
                </CardTitle>
                <Church className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {oracionesPendientesList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay pedidos de oración pendientes
                </p>
              ) : (
                <div className="space-y-3">
                  {oracionesPendientesList.map((oracion) => (
                    <div
                      key={oracion.id}
                      className="border-b pb-2 last:border-0"
                    >
                      <p className="text-sm">{oracion.pedido}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(oracion.fecha), "dd/MM/yyyy")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Analíticas</h2>
        <div className="grid gap-4 md:grid-cols-4 mb-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Citas</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totalAgendas}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Oraciones</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totalOraciones}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Oraciones Respondidas</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{oracionesRespondidas}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Discípulos Completados</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{completados}</p></CardContent></Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Citas por Mes</CardTitle><CardDescription>Actividad de citas en el tiempo</CardDescription></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agendasPorMes}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" {...AXIS} />
                    <YAxis {...AXIS} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={CURSOR} />
                    <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Estado de Discípulos</CardTitle><CardDescription>Distribución por estado</CardDescription></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={estadoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={pieLabel} paddingAngle={2} stroke="var(--background)" />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      iconType="circle"
                      formatter={(value: string, entry: { payload?: { value?: number } }) => (
                        <span className="text-xs text-foreground">{value} · {entry?.payload?.value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
