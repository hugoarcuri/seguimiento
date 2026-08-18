"use client";

import { useState } from "react";
import { ESTUDIOS_BIBLICOS, NIVEL_LABEL } from "@/lib/constants/estudios-biblicos";
import { BASE_PATH } from "@/lib/constants/paths";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Download, Eye, GraduationCap } from "lucide-react";

interface Props {
  puedeVerGuia: boolean;
}

export function EstudiosBiblicosClient({ puedeVerGuia }: Props) {
  const [pasoAbierto, setPasoAbierto] = useState<number | null>(null);
  const [guiaAbierta, setGuiaAbierta] = useState<number | null>(null);

  const togglePaso = (numero: number) => {
    setPasoAbierto((prev) => (prev === numero ? null : numero));
    setGuiaAbierta(null);
  };

  const toggleGuia = (numero: number) => {
    setGuiaAbierta((prev) => (prev === numero ? null : numero));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Estudios Bíblicos</h1>
        <p className="text-muted-foreground">{NIVEL_LABEL}</p>
      </div>

      <div className="space-y-3">
        {ESTUDIOS_BIBLICOS.map((paso) => {
          const abierto = pasoAbierto === paso.numero;
          const guiaVisible = guiaAbierta === paso.numero;
          const pdfUrl = `${BASE_PATH}/estudios-biblicos/nivel-1/${paso.archivo}`;

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
                        <span className="text-sm font-medium flex-1">Guía del discipulador</span>
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
    </div>
  );
}
