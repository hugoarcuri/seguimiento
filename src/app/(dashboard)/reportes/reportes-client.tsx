"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

interface ReportesClientProps {
  totalDiscipulos: number;
  totalEncuentros: number;
  totalOraciones: number;
  oracionesRespondidas: number;
  discipulosPorEtapa: Array<{ nombre: string; cantidad: number }>;
  encuentrosPorMes: Array<{ mes: string; cantidad: number }>;
  activos: number;
  completados: number;
  pausados: number;
  retirados: number;
}

export function ReportesClient({
  totalDiscipulos,
  totalEncuentros,
  totalOraciones,
  oracionesRespondidas,
  discipulosPorEtapa,
  encuentrosPorMes,
  activos,
  completados,
  pausados,
  retirados,
}: ReportesClientProps) {
  const estadoData = [
    { name: "Activos", value: activos },
    { name: "Completados", value: completados },
    { name: "Pausados", value: pausados },
    { name: "Retirados", value: retirados },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes</h1>
        <p className="text-muted-foreground">
          Estadísticas y métricas del discipulado
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Discípulos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalDiscipulos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Encuentros</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalEncuentros}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pedidos de Oración</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalOraciones}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Oraciones Respondidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{oracionesRespondidas}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Discípulos por Etapa</CardTitle>
            <CardDescription>Distribución en el proceso de discipulado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={discipulosPorEtapa}
                    dataKey="cantidad"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {discipulosPorEtapa.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Encuentros por Mes</CardTitle>
            <CardDescription>Actividad de encuentros en el tiempo</CardDescription>
          </CardHeader>
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
          <CardHeader>
            <CardTitle>Estado de Discípulos</CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadoData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {estadoData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
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
  );
}
