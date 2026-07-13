"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@/hooks/useUser";

const etapaColors = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

const etapaLabels = [
  "Nuevos Comienzos",
  "Crecimiento",
  "Carácter",
  "Compromiso",
];

export default function SeguimientoPage() {
  const { user } = useUser();
  const supabase = createClient();
  const [discipulos, setDiscipulos] = useState<any[]>([]);
  const [tareas, setTareas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase.from("profiles").select("rol").eq("id", authUser.id).single();
      const isAdminUser = profile?.rol === "admin";

      let discipulosQuery = supabase.from("discipulos").select("*, etapas:etapa_id(*)").order("apellido", { ascending: true });
      if (!isAdminUser) discipulosQuery = discipulosQuery.eq("lider_id", authUser.id);

      let tareasQuery = supabase
        .from("tareas")
        .select("*, discipulo:discipulos(nombre, apellido)")
        .eq("tipo", "lectura")
        .order("created_at", { ascending: false });
      if (!isAdminUser) tareasQuery = tareasQuery.eq("discipulo_id", authUser.id);

      const [discipulosRes, tareasRes] = await Promise.all([discipulosQuery, tareasQuery]);
      setDiscipulos(discipulosRes.data || []);
      setTareas(tareasRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Seguimiento</h1>
        <p className="text-muted-foreground">Progreso en el plan de discipulado</p>
      </div>

      <div className="grid gap-4">
        {discipulos.map((d) => {
          const etapaIndex = Math.min(Math.max((d.etapa_id || 1) - 1, 0), 3);
          const progress = ((etapaIndex + 1) / 4) * 100;
          const lecturas = tareas.filter((t) => t.discipulo_id === d.id);
          const completadas = lecturas.filter((t) => t.estado === "completada").length;

          return (
            <Card key={d.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={`/discipulos/${d.id}`} className="text-lg font-semibold hover:underline">
                      {d.apellido}, {d.nombre}
                    </Link>
                    <p className="text-sm text-muted-foreground">{d.etapas?.nombre || etapaLabels[etapaIndex]}</p>
                  </div>
                  <Badge variant={d.estado === "activo" ? "default" : "secondary"} className="capitalize">
                    {d.estado}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="flex gap-1 h-2">
                    {etapaLabels.map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full ${i <= etapaIndex ? etapaColors[i] : "bg-muted"}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {etapaLabels.map((label, i) => (
                      <span key={i} className={i <= etapaIndex ? "font-medium text-foreground" : ""}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <BookOpen className="h-4 w-4" />
                    Lecturas Bíblicas
                    <span className="text-muted-foreground font-normal">
                      ({completadas}/{lecturas.length} completadas)
                    </span>
                  </div>
                  {lecturas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin lecturas asignadas</p>
                  ) : (
                    <div className="space-y-1">
                      {lecturas.slice(0, 5).map((t) => (
                        <div key={t.id} className="flex items-center gap-2 text-sm">
                          {t.estado === "completada" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className={t.estado === "completada" ? "line-through text-muted-foreground" : ""}>
                            {t.titulo}
                          </span>
                          {t.fecha_limite && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(new Date(t.fecha_limite), "dd/MM")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
