"use client";

import { useState } from "react";
import { getEstudiosPorEtapa, getBasePath } from "@/lib/constants/estudios-biblicos";
import type { Etapa } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronDown, ChevronRight, Download, Eye, GraduationCap, BookOpen } from "lucide-react";

interface Props {
  etapas: Etapa[];
  puedeVerGuia: boolean;
  etapaMiembro?: number | null;
}

export function EstudiosBiblicosClient({ etapas, puedeVerGuia, etapaMiembro }: Props) {
  const defaultEtapa = etapaMiembro
    ? String(etapaMiembro)
    : String(etapas[0]?.id ?? 2);

  const [etapaSeleccionada, setEtapaSeleccionada] = useState<string>(defaultEtapa);
  const [pasoAbierto, setPasoAbierto] = useState<number | null>(null);
  const [guiaAbierta, setGuiaAbierta] = useState<number | null>(null);

  const togglePaso = (numero: number) => {
    setPasoAbierto((prev) => (prev === numero ? null : numero));
    setGuiaAbierta(null);
  };

  const toggleGuia = (numero: number) => {
    setGuiaAbierta((prev) => (prev === numero ? null : numero));
  };

  const handleTabChange = (value: string) => {
    setEtapaSeleccionada(value);
    setPasoAbierto(null);
    setGuiaAbierta(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Estudios Bíblicos</h1>
        <p className="text-muted-foreground">
          Material organizado por etapas de discipulado
        </p>
      </div>

      <Tabs value={etapaSeleccionada} onValueChange={handleTabChange}>
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto scrollbar-none"
        >
          {etapas.map((etapa) => (
            <TabsTrigger key={etapa.id} value={String(etapa.id)} className="whitespace-nowrap">
              {etapa.nombre}
            </TabsTrigger>
          ))}
        </TabsList>

        {etapas.map((etapa) => {
          const estudiosEtapa = getEstudiosPorEtapa(etapa.id);
          return (
            <TabsContent key={etapa.id} value={String(etapa.id)}>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">{etapa.nombre}</h2>
                  {etapa.descripcion && (
                    <p className="text-sm text-muted-foreground">{etapa.descripcion}</p>
                  )}
                </div>

                {estudiosEtapa.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Próximamente disponible
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        El material para esta etapa está en preparación
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {estudiosEtapa.map((paso) => {
                      const abierto = pasoAbierto === paso.numero;
                      const guiaVisible = guiaAbierta === paso.numero;
                      const pdfUrl = `${getBasePath()}/${paso.archivo}`;

                      return (
                        <Card key={paso.numero} className="overflow-hidden">
                          <button
                            type="button"
                            onClick={() => togglePaso(paso.numero)}
                            className="flex w-full items-center gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                              {paso.numero}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{paso.titulo}</p>
                              <p className="text-xs text-muted-foreground truncate">{paso.descripcion}</p>
                            </div>
                            {abierto ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                          </button>

                          {abierto && (
                            <CardContent className="px-4 pb-4 pt-0 space-y-3">
                              <p className="text-sm text-muted-foreground">{paso.descripcion}</p>

                              <div className="flex flex-wrap gap-2">
                                <a
                                  href={pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Ver material
                                </a>
                                <a
                                  href={pdfUrl}
                                  download
                                  className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Descargar
                                </a>
                              </div>

                              <iframe
                                src={pdfUrl}
                                className="w-full h-[500px] rounded-lg border"
                                title={`Paso ${paso.numero} - ${paso.titulo}`}
                              />

                              {puedeVerGuia && (
                                <div className="mt-4">
                                  <button
                                    type="button"
                                    onClick={() => toggleGuia(paso.numero)}
                                    className="flex w-full items-center gap-2 rounded-lg border p-3 text-left hover:bg-accent/50 transition-colors"
                                  >
                                    <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
                                    <span className="text-sm font-medium flex-1">Guía del Miembro</span>
                                    {guiaVisible ? (
                                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    )}
                                  </button>

                                  {guiaVisible && (
                                    <div className="mt-3 space-y-4 rounded-lg border p-4 bg-muted/30">
                                      <div>
                                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Objetivo</h4>
                                        <p className="text-sm">{paso.guia.objetivo}</p>
                                      </div>

                                      <div>
                                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Puntos clave</h4>
                                        <ul className="text-sm space-y-1">
                                          {paso.guia.puntosClave.map((punto, i) => (
                                            <li key={i} className="flex gap-2">
                                              <span className="text-primary mt-0.5">•</span>
                                              <span>{punto}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div>
                                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Consejos</h4>
                                        <ul className="text-sm space-y-1">
                                          {paso.guia.consejos.map((consejo, i) => (
                                            <li key={i} className="flex gap-2">
                                              <span className="text-primary mt-0.5">•</span>
                                              <span>{consejo}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div>
                                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Preguntas para reflexión</h4>
                                        <ul className="text-sm space-y-1">
                                          {paso.guia.preguntas.map((pregunta, i) => (
                                            <li key={i} className="flex gap-2">
                                              <span className="text-primary mt-0.5">{i + 1}.</span>
                                              <span>{pregunta}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
