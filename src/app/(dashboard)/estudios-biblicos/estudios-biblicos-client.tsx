"use client";

import { useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getEstudiosPorEtapa } from "@/lib/constants/estudios-biblicos";
import type { PasoEstudio } from "@/lib/constants/estudios-biblicos";
import type { Etapa, EstudioBiblico, EstudioBiblicoRespuesta, EstudioBiblicoProgreso } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown, ChevronRight, GraduationCap, BookOpen,
  CheckCircle2, Loader2, Save, Send, Plus, Pencil, Trash2, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { EstudioBiblicoFormDialog } from "./estudio-biblico-form-dialog";

interface Props {
  etapas: Etapa[];
  estudios: EstudioBiblico[];
  esAdmin: boolean;
  puedeVerGuia: boolean;
  etapaMiembro?: number | null;
  miembroId: string | null;
  respuestas: EstudioBiblicoRespuesta[];
  progreso: EstudioBiblicoProgreso[];
  cargando: boolean;
  onActualizarRespuestas: (r: EstudioBiblicoRespuesta[]) => void;
  onActualizarProgreso: (p: EstudioBiblicoProgreso[]) => void;
  onRecargarEstudios: () => Promise<void>;
}

export function EstudiosBiblicosClient({
  etapas, estudios, esAdmin, puedeVerGuia, etapaMiembro, miembroId,
  respuestas, progreso, cargando,
  onActualizarRespuestas, onActualizarProgreso, onRecargarEstudios,
}: Props) {
  const defaultEtapa = etapaMiembro ? String(etapaMiembro) : String(etapas[0]?.id ?? 2);

  const esMiembro = !esAdmin && !puedeVerGuia;
  const etapasVisibles = esMiembro && etapaMiembro
    ? etapas.filter((e) => e.id <= etapaMiembro)
    : etapas;

  const [etapaSeleccionada, setEtapaSeleccionada] = useState<string>(defaultEtapa);
  const [pasoAbierto, setPasoAbierto] = useState<number | null>(null);
  const [guiaAbierta, setGuiaAbierta] = useState<number | null>(null);
  const [respuestasLocales, setRespuestasLocales] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState<Record<string, boolean>>({});
  const [guardadoOk, setGuardadoOk] = useState<Record<string, boolean>>({});
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [estudioEditando, setEstudioEditando] = useState<EstudioBiblico | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

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

  const abrirCrear = () => {
    setEstudioEditando(null);
    setDialogAbierto(true);
  };

  const abrirEditar = (e: EstudioBiblico) => {
    setEstudioEditando(e);
    setDialogAbierto(true);
  };

  const eliminarEstudio = async (estudio: EstudioBiblico) => {
    if (!confirm(`¿Eliminar el estudio "${estudio.titulo}"? Esta acción no se puede deshacer.`)) return;
    setEliminando(estudio.id);
    const supabase = createClient();
    const { error } = await supabase.from("estudios_biblicos").delete().eq("id", estudio.id);
    setEliminando(null);
    if (error) {
      toast.error("Error al eliminar el estudio");
      return;
    }
    toast.success("Estudio eliminado");
    await onRecargarEstudios();
  };

  const getRespuesta = useCallback((estudioNumero: number, preguntaIndex: number): string => {
    const key = `${estudioNumero}-${preguntaIndex}`;
    if (respuestasLocales[key] !== undefined) return respuestasLocales[key];
    const guardada = respuestas.find(
      (r) => r.estudio_numero === estudioNumero && r.pregunta_index === preguntaIndex
    );
    return guardada?.respuesta ?? "";
  }, [respuestas, respuestasLocales]);

  const handleRespuestaChange = (estudioNumero: number, preguntaIndex: number, valor: string) => {
    setRespuestasLocales((prev) => ({ ...prev, [`${estudioNumero}-${preguntaIndex}`]: valor }));
    setGuardadoOk((prev) => ({ ...prev, [`${estudioNumero}-${preguntaIndex}`]: false }));
  };

  const guardarRespuesta = async (estudioNumero: number, preguntaIndex: number) => {
    if (!miembroId) return;
    const key = `${estudioNumero}-${preguntaIndex}`;
    const texto = respuestasLocales[key] ?? "";
    if (texto.trim() === "") return;

    setGuardando((prev) => ({ ...prev, [key]: true }));

    const existente = respuestas.find(
      (r) => r.estudio_numero === estudioNumero && r.pregunta_index === preguntaIndex
    );

    if (existente) {
      const { error } = await supabase
        .from("estudios_biblicos_respuestas")
        .update({ respuesta: texto })
        .eq("id", existente.id);
      if (!error) {
        onActualizarRespuestas(
          respuestas.map((r) => r.id === existente.id ? { ...r, respuesta: texto } : r)
        );
        setGuardadoOk((prev) => ({ ...prev, [key]: true }));
      }
    } else {
      const { data, error } = await supabase
        .from("estudios_biblicos_respuestas")
        .insert({
          miembro_id: miembroId,
          estudio_numero: estudioNumero,
          pregunta_index: preguntaIndex,
          respuesta: texto,
        })
        .select()
        .single();
      if (!error && data) {
        onActualizarRespuestas([...respuestas, data as EstudioBiblicoRespuesta]);
        setGuardadoOk((prev) => ({ ...prev, [key]: true }));
      }
    }

    setGuardando((prev) => ({ ...prev, [key]: false }));
  };

  const contarRespondidas = (estudio: PasoEstudio): number => {
    let count = 0;
    estudio.preguntas.forEach((_, i) => {
      const key = `${estudio.numero}-${i}`;
      const texto = respuestasLocales[key] ?? respuestas.find(
        (r) => r.estudio_numero === estudio.numero && r.pregunta_index === i
      )?.respuesta ?? "";
      if (texto.trim() !== "") count++;
    });
    return count;
  };

  const marcarCompletado = async (estudioNumero: number) => {
    if (!miembroId) return;

    const existente = progreso.find((p) => p.estudio_numero === estudioNumero);

    if (existente) {
      const { error } = await supabase
        .from("estudios_biblicos_progreso")
        .update({ completado: true, completado_en: new Date().toISOString() })
        .eq("id", existente.id);
      if (!error) {
        onActualizarProgreso(
          progreso.map((p) => p.id === existente.id ? { ...p, completado: true, completado_en: new Date().toISOString() } : p)
        );
      }
    } else {
      const { data, error } = await supabase
        .from("estudios_biblicos_progreso")
        .insert({
          miembro_id: miembroId,
          estudio_numero: estudioNumero,
          completado: true,
          completado_en: new Date().toISOString(),
        })
        .select()
        .single();
      if (!error && data) {
        onActualizarProgreso([...progreso, data as EstudioBiblicoProgreso]);
      }
    }
  };

  const estaCompletado = (estudioNumero: number): boolean => {
    return progreso.some((p) => p.estudio_numero === estudioNumero && p.completado);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Estudios Bíblicos</h1>
          <p className="text-muted-foreground">
            Material organizado por etapas de discipulado
          </p>
        </div>
        {esAdmin && (
          <Button onClick={abrirCrear} className="gap-2">
            <Plus className="h-4 w-4" />
            Crear estudio
          </Button>
        )}
      </div>

      <Tabs value={etapaSeleccionada} onValueChange={handleTabChange}>
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto scrollbar-none"
        >
          {etapasVisibles.map((etapa) => (
            <TabsTrigger key={etapa.id} value={String(etapa.id)} className="whitespace-nowrap">
              {etapa.id}. {etapa.nombre}
            </TabsTrigger>
          ))}
          {esMiembro && etapaMiembro && etapas
            .filter((e) => e.id > etapaMiembro)
            .map((etapa) => (
              <TabsTrigger key={etapa.id} value={String(etapa.id)} disabled className="whitespace-nowrap opacity-50 cursor-not-allowed">
                <Lock className="h-3 w-3 mr-1" />
                {etapa.id}. {etapa.nombre}
              </TabsTrigger>
            ))
          }
        </TabsList>

        {etapasVisibles.length === 0 && esMiembro && (
          <div className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Tu etapa de discipulado no ha sido asignada todavía.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Contactá a tu discipulador para que te asigne una etapa.</p>
          </div>
        )}

        {etapasVisibles.map((etapa) => {
          const estudiosEtapa = getEstudiosPorEtapa(estudios, etapa.id);
          return (
            <TabsContent key={etapa.id} value={String(etapa.id)}>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">{etapa.id}. {etapa.nombre}</h2>
                  {etapa.descripcion && (
                    <p className="text-sm text-muted-foreground">{etapa.descripcion}</p>
                  )}
                </div>

                {estudiosEtapa.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {esAdmin ? "No hay estudios para esta etapa" : "Próximamente disponible"}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {esAdmin ? "Creá el primer estudio con el botón de arriba" : "El material para esta etapa está en preparación"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {estudiosEtapa.map((paso) => {
                      const abierto = pasoAbierto === paso.numero;
                      const guiaVisible = guiaAbierta === paso.numero;
                      const completado = estaCompletado(paso.numero);
                      const respondidas = contarRespondidas(paso);
                      const total = paso.preguntas.length;
                      const estudioDb = estudios.find((e) => e.numero === paso.numero && e.etapa_id === etapa.id);

                      return (
                        <Card key={paso.numero} className="overflow-hidden">
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => togglePaso(paso.numero)}
                              className="flex flex-1 items-center gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
                            >
                              <div className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                                completado
                                  ? "bg-emerald-500 text-white"
                                  : "bg-primary text-primary-foreground"
                              )}>
                                {completado ? <CheckCircle2 className="h-5 w-5" /> : paso.numero}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{paso.titulo}</p>
                                <p className="text-xs text-muted-foreground truncate">{paso.descripcion}</p>
                                {!cargando && miembroId && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={completado ? "default" : "secondary"} className="text-[10px]">
                                      {completado ? "Completado" : `${respondidas}/${total} respondidas`}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              {abierto ? (
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                              )}
                            </button>

                            {esAdmin && estudioDb && (
                              <div className="flex items-center gap-1 pr-3 shrink-0">
                                <Button size="icon-xs" variant="ghost" onClick={() => abrirEditar(estudioDb)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon-xs"
                                  variant="ghost"
                                  onClick={() => eliminarEstudio(estudioDb)}
                                  disabled={eliminando === estudioDb.id}
                                >
                                  {eliminando === estudioDb.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>

                          {abierto && (
                            <CardContent className="px-4 pb-4 pt-0 space-y-5">
                              <div className="space-y-3">
                                {paso.contenido.map((seccion, i) => {
                                  if (seccion.tipo === "titulo") {
                                    return <h3 key={i} className="text-lg font-bold text-foreground" dangerouslySetInnerHTML={{ __html: seccion.valor }} />;
                                  }
                                  if (seccion.tipo === "subtitulo") {
                                    return <h4 key={i} className="text-base font-semibold text-foreground mt-4" dangerouslySetInnerHTML={{ __html: seccion.valor }} />;
                                  }
                                  if (seccion.tipo === "referencia") {
                                    return (
                                      <blockquote key={i} className="border-l-4 border-primary/40 pl-4 py-2 italic text-sm text-muted-foreground bg-muted/30 rounded-r-lg" dangerouslySetInnerHTML={{ __html: seccion.valor }} />
                                    );
                                  }
                                  return (
                                    <div key={i} className="text-sm leading-relaxed prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: seccion.valor }} />
                                  );
                                })}
                              </div>

                              {!cargando && miembroId && (
                                <div className="space-y-4 mt-6 pt-4 border-t">
                                  <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Send className="h-4 w-4 text-primary" />
                                    Tus respuestas
                                  </h4>

                                  {paso.preguntas.map((pregunta, i) => {
                                    const key = `${paso.numero}-${i}`;
                                    const valor = getRespuesta(paso.numero, i);
                                    const estaGuardando = guardando[key];
                                    const ok = guardadoOk[key];

                                    return (
                                      <div key={i} className="space-y-2">
                                        <label className="text-sm font-medium">
                                          {i + 1}. {pregunta.enunciado}
                                        </label>
                                        {pregunta.tipo === "opcion_multiple" && pregunta.opciones ? (
                                          <div className="space-y-1">
                                            {pregunta.opciones.map((op) => (
                                              <label key={op} className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input
                                                  type="radio"
                                                  name={`pregunta-${paso.numero}-${i}`}
                                                  value={op}
                                                  checked={valor === op}
                                                  onChange={() => handleRespuestaChange(paso.numero, i, op)}
                                                  className="accent-primary"
                                                />
                                                {op}
                                              </label>
                                            ))}
                                          </div>
                                        ) : (
                                          <Textarea
                                            value={valor}
                                            onChange={(e) => handleRespuestaChange(paso.numero, i, e.target.value)}
                                            placeholder="Escribe tu respuesta aquí..."
                                            className="min-h-20"
                                          />
                                        )}
                                        <div className="flex items-center gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => guardarRespuesta(paso.numero, i)}
                                            disabled={estaGuardando || valor.trim() === ""}
                                          >
                                            {estaGuardando ? (
                                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                            ) : (
                                              <Save className="h-3.5 w-3.5 mr-1" />
                                            )}
                                            Guardar
                                          </Button>
                                          {ok && (
                                            <span className="text-xs text-emerald-600">Guardado</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  <div className="flex items-center gap-3 pt-2">
                                    {!estaCompletado(paso.numero) && respondidas === total ? (
                                      <Button
                                        onClick={() => marcarCompletado(paso.numero)}
                                        className="gap-2"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Marcar como completado
                                      </Button>
                                    ) : estaCompletado(paso.numero) ? (
                                      <Badge variant="default" className="gap-1.5 py-1.5 px-3">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Estudio completado
                                      </Badge>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        Responde todas las preguntas para poder marcar como completado
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {puedeVerGuia && (
                                <div className="mt-4 pt-4 border-t">
                                  <button
                                    type="button"
                                    onClick={() => toggleGuia(paso.numero)}
                                    className="flex w-full items-center gap-2 rounded-lg border p-3 text-left hover:bg-accent/50 transition-colors"
                                  >
                                    <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
                                    <span className="text-sm font-medium flex-1">Guía del Discipulador</span>
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
                                          {paso.guia.puntosClave.map((punto, j) => (
                                            <li key={j} className="flex gap-2">
                                              <span className="text-primary mt-0.5">•</span>
                                              <span>{punto}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div>
                                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Consejos</h4>
                                        <ul className="text-sm space-y-1">
                                          {paso.guia.consejos.map((consejo, j) => (
                                            <li key={j} className="flex gap-2">
                                              <span className="text-primary mt-0.5">•</span>
                                              <span>{consejo}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div>
                                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Preguntas para reflexión</h4>
                                        <ul className="text-sm space-y-1">
                                          {paso.guia.preguntas.map((pregunta, j) => (
                                            <li key={j} className="flex gap-2">
                                              <span className="text-primary mt-0.5">{j + 1}.</span>
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

      <EstudioBiblicoFormDialog
        open={dialogAbierto}
        onOpenChange={setDialogAbierto}
        estudio={estudioEditando}
        onGuardado={onRecargarEstudios}
      />
    </div>
  );
}
