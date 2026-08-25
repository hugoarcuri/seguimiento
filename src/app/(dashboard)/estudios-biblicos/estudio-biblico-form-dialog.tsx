"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { estudioBiblicoSchema, type EstudioBiblicoInput } from "@/lib/validations/estudio-biblico";
import type { EstudioBiblico } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estudio?: EstudioBiblico | null;
  onGuardado: () => void;
}

const ETAPAS = [
  { value: "1", label: "1. No creyente" },
  { value: "2", label: "2. Nuevo creyente" },
  { value: "3", label: "3. Discípulo" },
  { value: "4", label: "4. Siervo" },
  { value: "5", label: "5. Multiplicador" },
];

const inputClass = "h-11 md:h-8";
const labelClass = "text-[18px] font-bold uppercase";

export function EstudioBiblicoFormDialog({ open, onOpenChange, estudio, onGuardado }: Props) {
  const [saving, setSaving] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const esEdicion = !!estudio;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EstudioBiblicoInput>({
    resolver: zodResolver(estudioBiblicoSchema),
    defaultValues: {
      numero: 1,
      etapa_id: 2,
      titulo: "",
      descripcion: "",
      contenido: [{ tipo: "texto", valor: "" }],
      preguntas: [{ enunciado: "", tipo: "texto_libre" }],
      guia: { objetivo: "", puntosClave: [""], consejos: [""], preguntas: [""] },
      activo: true,
    },
  });

  const { fields: camposContenido, append: agregarContenido, remove: eliminarContenido } = useFieldArray({ control, name: "contenido" });
  const { fields: camposPreguntas, append: agregarPregunta, remove: eliminarPregunta } = useFieldArray({ control, name: "preguntas" });
  const [guiaOpen, setGuiaOpen] = useState(false);

  const guiaObjetivo = watch("guia.objetivo");
  const guiaPuntos = watch("guia.puntosClave");
  const guiaConsejos = watch("guia.consejos");
  const guiaPreguntas = watch("guia.preguntas");

  const addGuiaItem = (field: "guia.puntosClave" | "guia.consejos" | "guia.preguntas") => {
    const current = watch(field) as string[];
    setValue(field, [...current, ""] as never);
  };
  const removeGuiaItem = (field: "guia.puntosClave" | "guia.consejos" | "guia.preguntas", idx: number) => {
    const current = watch(field) as string[];
    setValue(field, current.filter((_: string, i: number) => i !== idx) as never);
  };

  useEffect(() => {
    if (open) {
      if (estudio) {
        reset({
          numero: estudio.numero,
          etapa_id: estudio.etapa_id,
          titulo: estudio.titulo,
          descripcion: estudio.descripcion,
          contenido: estudio.contenido.length > 0 ? estudio.contenido : [{ tipo: "texto", valor: "" }],
          preguntas: estudio.preguntas.length > 0 ? estudio.preguntas : [{ enunciado: "", tipo: "texto_libre" }],
          guia: estudio.guia,
          activo: estudio.activo,
        });
      } else {
        reset({
          numero: 1,
          etapa_id: 2,
          titulo: "",
          descripcion: "",
          contenido: [{ tipo: "texto", valor: "" }],
          preguntas: [{ enunciado: "", tipo: "texto_libre" }],
          guia: { objetivo: "", puntosClave: [""], consejos: [""], preguntas: [""] },
          activo: true,
        });
      }
    }
  }, [open, estudio, reset]);

  const onSubmit = async (data: EstudioBiblicoInput) => {
    setSaving(true);
    const supabase = createClient();

    let numeroFinal = data.numero;
    if (!esEdicion) {
      const { data: existentes } = await supabase
        .from("estudios_biblicos")
        .select("numero")
        .eq("etapa_id", data.etapa_id)
        .order("numero", { ascending: false })
        .limit(1);
      numeroFinal = existentes && existentes.length > 0 ? existentes[0].numero + 1 : 1;
    }

    const finalData = { ...data, numero: numeroFinal };

    let error;
    if (esEdicion) {
      const res = await supabase.from("estudios_biblicos").update(finalData).eq("id", estudio.id);
      error = res.error;
    } else {
      const res = await supabase.from("estudios_biblicos").insert(finalData);
      error = res.error;
    }

    setSaving(false);

    if (error) {
      toast.error(error.message || "Error al guardar el estudio");
      return;
    }

    toast.success(esEdicion ? "Estudio actualizado" : "Estudio creado");
    reset();
    onOpenChange(false);
    onGuardado();
  };

  const toggleMaximize = () => setMaximized((m) => !m);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent
        showCloseButton={false}
        className={maximized
          ? "!inset-0 !w-full !h-full !max-w-none !max-h-none !rounded-none !border-none !p-0 !gap-0 !translate-x-0 !translate-y-0 !overflow-hidden"
          : "!overflow-hidden !flex !flex-col sm:max-w-3xl !p-0"
        }
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between shrink-0 h-9">
            <div className="px-6">
              <DialogTitle>{esEdicion ? "Editar Estudio" : "Nuevo Estudio Bíblico"}</DialogTitle>
              <DialogDescription className="sr-only">
                {esEdicion ? "Modificá la información del estudio." : "Completá los datos para crear un nuevo estudio bíblico."}
              </DialogDescription>
            </div>
            <div className="flex h-full">
              <button
                type="button"
                onClick={toggleMaximize}
                className="w-11 h-full flex items-center justify-center text-blue-600 hover:bg-blue-500 hover:text-white transition-colors"
                title={maximized ? "Restaurar" : "Maximizar"}
              >
                {maximized ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <rect x="2" y="0" width="8" height="8" rx="0.5" stroke="currentColor" strokeWidth="1" />
                    <rect x="0" y="2" width="8" height="8" rx="0.5" fill="var(--background)" stroke="currentColor" strokeWidth="1" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <rect x="0.5" y="0.5" width="9" height="9" rx="0.5" stroke="currentColor" strokeWidth="1" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-11 h-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                title="Cerrar"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M1 1L9 9M9 1L1 9" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-0 flex-1 px-6 pb-6 pt-2 gap-4">
              <div className="space-y-3 shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className={labelClass}>Etapa *</Label>
                    <Select value={String(watch("etapa_id"))} onValueChange={(v) => setValue("etapa_id", Number(v))}>
                      <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ETAPAS.map((e) => (
                          <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.etapa_id && <p className="text-xs text-destructive">{errors.etapa_id.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>Título *</Label>
                    <Input className={inputClass} {...register("titulo")} placeholder="Título del estudio" />
                    {errors.titulo && <p className="text-xs text-destructive">{errors.titulo.message}</p>}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className={labelClass}>Descripción *</Label>
                  <Textarea rows={1} className="text-sm h-8" {...register("descripcion")} placeholder="Breve descripción"
                    onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; }} />
                  {errors.descripcion && <p className="text-xs text-destructive">{errors.descripcion.message}</p>}
                </div>
              </div>

              <div className="flex flex-col min-h-0 flex-1 gap-2">
                <p className={labelClass}>Contenido</p>
                {errors.contenido && <p className="text-xs text-destructive shrink-0">{errors.contenido.message}</p>}
                <div className="flex-1 min-h-0 flex flex-col gap-2">
                  {camposContenido.map((campo, idx) => (
                    <div key={campo.id} className="rounded-lg border p-2 space-y-1 flex flex-col flex-1 min-h-0">
                      <div className="flex items-center justify-end shrink-0">
                        {camposContenido.length > 1 && (
                          <Button type="button" size="icon-xs" variant="ghost" onClick={() => eliminarContenido(idx)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <Controller
                        control={control}
                        name={`contenido.${idx}.valor`}
                        render={({ field }) => (
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Escribí el contenido del estudio..."
                            className="flex-1 min-h-0"
                          />
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <p className={labelClass}>Preguntas de reflexión</p>
                  <Button type="button" size="sm" variant="outline" onClick={() => agregarPregunta({ enunciado: "", tipo: "texto_libre" })}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
                  </Button>
                </div>
                {errors.preguntas && <p className="text-xs text-destructive">{errors.preguntas.message}</p>}
                <div className="space-y-1">
                  {camposPreguntas.map((campo, idx) => (
                    <div key={campo.id} className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-muted-foreground shrink-0 w-4 text-right">{idx + 1}.</span>
                      <Input
                        {...register(`preguntas.${idx}.enunciado`)}
                        className="h-8 text-sm flex-1"
                        placeholder="Pregunta..."
                      />
                      <Button type="button" size="icon-xs" variant="ghost" onClick={() => eliminarPregunta(idx)} className="shrink-0">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 shrink-0">
                <button type="button" onClick={() => setGuiaOpen(!guiaOpen)}
                  className="flex items-center gap-1 hover:bg-accent rounded px-1 py-0.5 transition-colors">
                  {guiaOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <p className={labelClass}>Guía del discipulador</p>
                </button>
                {guiaOpen && (
                  <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold uppercase">Objetivo</Label>
                      <Textarea rows={2} className="text-sm" value={guiaObjetivo || ""} onChange={(e) => setValue("guia.objetivo", e.target.value)} placeholder="Objetivo de la guía..."
                        onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; }} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold uppercase">Puntos clave</Label>
                        <Button type="button" size="sm" variant="outline" onClick={() => addGuiaItem("guia.puntosClave")}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
                        </Button>
                      </div>
                      {(guiaPuntos || []).map((punto: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-xs font-bold text-muted-foreground shrink-0 w-4 text-right">{idx + 1}.</span>
                          <Input value={punto} onChange={(e) => {
                            const arr = [...(guiaPuntos || [])];
                            arr[idx] = e.target.value;
                            setValue("guia.puntosClave", arr);
                          }} className="h-8 text-sm flex-1" placeholder="Punto clave..." />
                          <Button type="button" size="icon-xs" variant="ghost" onClick={() => removeGuiaItem("guia.puntosClave", idx)} className="shrink-0">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold uppercase">Consejos</Label>
                        <Button type="button" size="sm" variant="outline" onClick={() => addGuiaItem("guia.consejos")}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
                        </Button>
                      </div>
                      {(guiaConsejos || []).map((consejo: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-xs font-bold text-muted-foreground shrink-0 w-4 text-right">{idx + 1}.</span>
                          <Input value={consejo} onChange={(e) => {
                            const arr = [...(guiaConsejos || [])];
                            arr[idx] = e.target.value;
                            setValue("guia.consejos", arr);
                          }} className="h-8 text-sm flex-1" placeholder="Consejo..." />
                          <Button type="button" size="icon-xs" variant="ghost" onClick={() => removeGuiaItem("guia.consejos", idx)} className="shrink-0">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold uppercase">Preguntas de la guía</Label>
                        <Button type="button" size="sm" variant="outline" onClick={() => addGuiaItem("guia.preguntas")}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
                        </Button>
                      </div>
                      {(guiaPreguntas || []).map((pregunta: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-xs font-bold text-muted-foreground shrink-0 w-4 text-right">{idx + 1}.</span>
                          <Input value={pregunta} onChange={(e) => {
                            const arr = [...(guiaPreguntas || [])];
                            arr[idx] = e.target.value;
                            setValue("guia.preguntas", arr);
                          }} className="h-8 text-sm flex-1" placeholder="Pregunta..." />
                          <Button type="button" size="icon-xs" variant="ghost" onClick={() => removeGuiaItem("guia.preguntas", idx)} className="shrink-0">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {esEdicion ? "Guardar cambios" : "Crear estudio"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
