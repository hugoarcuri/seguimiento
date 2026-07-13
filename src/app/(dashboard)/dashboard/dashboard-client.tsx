"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, TrendingUp, CalendarCheck, Church, AlertCircle, Cake, BookOpen, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
import { format, isToday } from "date-fns";
import Link from "next/link";
import { es } from "date-fns/locale";

interface DiscipuloBasico {
  id: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  etapa_id: number;
}

interface DashboardClientProps {
  totalDiscipulos: number;
  nuevos: number;
  consolidacion: number;
  caracter: number;
  servicio: number;
  activos: number;
  completados: number;
  pausados: number;
  retirados: number;
  oracionesPendientes: number;
  totalEncuentros: number;
  totalOraciones: number;
  oracionesRespondidas: number;
  discipulosPorEtapa: Array<{ nombre: string; cantidad: number }>;
  encuentrosPorMes: Array<{ mes: string; cantidad: number }>;
  proximosEncuentros: Array<{
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
}

export function DashboardClient({
  totalDiscipulos,
  nuevos,
  consolidacion,
  caracter,
  servicio,
  activos,
  completados,
  pausados,
  retirados,
  oracionesPendientes,
  totalEncuentros,
  totalOraciones,
  oracionesRespondidas,
  discipulosPorEtapa,
  encuentrosPorMes,
  proximosEncuentros,
  oracionesPendientesList,
  proximosCumples,
}: DashboardClientProps) {
  const chartData = [
    { name: "Nueva Vida", value: nuevos, fill: "hsl(var(--chart-1))" },
    { name: "Consolidación", value: consolidacion, fill: "hsl(var(--chart-2))" },
    { name: "Carácter", value: caracter, fill: "hsl(var(--chart-3))" },
    { name: "Servicio", value: servicio, fill: "hsl(var(--chart-4))" },
  ];

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
      title: "Nueva Vida",
      value: nuevos,
      description: "Etapa inicial",
      icon: UserPlus,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Servicio",
      value: servicio,
      description: "Etapa final",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
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
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Próximos Encuentros</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {proximosEncuentros.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay encuentros programados
                </p>
              ) : (
                <div className="space-y-3">
                  {proximosEncuentros.map((encuentro) => (
                    <div
                      key={encuentro.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {encuentro.tema_tratado}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(encuentro.fecha), "dd/MM/yyyy")}
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
                  {proximosCumples.map((d: any) => {
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
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Encuentros</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totalEncuentros}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Oraciones</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{totalOraciones}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Oraciones Respondidas</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{oracionesRespondidas}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Discípulos Completados</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{completados}</p></CardContent></Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Encuentros por Mes</CardTitle><CardDescription>Actividad de encuentros en el tiempo</CardDescription></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={encuentrosPorMes}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
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
                    <Pie data={[{ name: "Activos", value: activos }, { name: "Completados", value: completados }, { name: "Pausados", value: pausados }, { name: "Retirados", value: retirados }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {[{ name: "Activos", value: activos }, { name: "Completados", value: completados }, { name: "Pausados", value: pausados }, { name: "Retirados", value: retirados }].map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
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
