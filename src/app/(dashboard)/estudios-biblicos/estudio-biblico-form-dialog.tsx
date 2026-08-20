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
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estudio?: EstudioBiblico | null;
  onGuardado: () => void;
}

const TIPOS_CONTENIDO = [
  { value: "titulo", label: "Título" },
  { value: "subtitulo", label: "Subtítulo" },
  { value: "texto", label: "Texto" },
  { value: "referencia", label: "Referencia bíblica" },
] as const;

const ETAPAS = [
  { value: "1", label: "No creyente" },
  { value: "2", label: "Nuevo creyente" },
  { value: "3", label: "Discípulo" },
  { value: "4", label: "Siervo" },
  { value: "5", label: "Multiplicador" },
];

const inputClass = "h-11 md:h-8";
const labelClass = "text-[11px] font-medium text-muted-foreground";

function ListaDinamica({
  items,
  onAdd,
  onRemove,
  onChange,
  placeholder,
  prefix,
}: {
  items: string[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, v: string) => void;
  placeholder: string;
  prefix?: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <span className="text-primary text-sm shrink-0">{prefix ? `${idx + 1}.` : "•"}</span>
          <Input
            value={item}
            onChange={(e) => onChange(idx, e.target.value)}
            className={inputClass + " flex-1"}
            placeholder={placeholder}
          />
          <Button type="button" size="icon-xs" variant="ghost" onClick={() => onRemove(idx)}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="ghost" onClick={onAdd} className="h-6 text-xs">
        <Plus className="h-3 w-3 mr-1" /> Agregar
      </Button>
    </div>
  );
}

export function EstudioBiblicoFormDialog({ open, onOpenChange, estudio, onGuardado }: Props) {
  const [saving, setSaving] = useState(false);
  const esEdicion = !!estudio;

  const [puntosClave, setPuntosClave] = useState<string[]>([""]);
  const [consejos, setConsejos] = useState<string[]>([""]);
  const [guiaPreguntas, setGuiaPreguntas] = useState<string[]>([""]);

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
      contenido: [{ tipo: "titulo", valor: "" }],
      preguntas: [{ enunciado: "", tipo: "texto_libre" }],
      guia: { objetivo: "", puntosClave: [""], consejos: [""], preguntas: [""] },
      activo: true,
    },
  });

  const { fields: camposContenido, append: agregarContenido, remove: eliminarContenido } = useFieldArray({ control, name: "contenido" });
  const { fields: camposPreguntas, append: agregarPregunta, remove: eliminarPregunta } = useFieldArray({ control, name: "preguntas" });

  useEffect(() => {
    if (open) {
      if (estudio) {
        const pk = estudio.guia.puntosClave.length > 0 ? estudio.guia.puntosClave : [""];
        const co = estudio.guia.consejos.length > 0 ? estudio.guia.consejos : [""];
        const gp = estudio.guia.preguntas.length > 0 ? estudio.guia.preguntas : [""];
        reset({
          numero: estudio.numero,
          etapa_id: estudio.etapa_id,
          titulo: estudio.titulo,
          descripcion: estudio.descripcion,
          contenido: estudio.contenido.length > 0 ? estudio.contenido : [{ tipo: "titulo", valor: "" }],
          preguntas: estudio.preguntas.length > 0 ? estudio.preguntas : [{ enunciado: "", tipo: "texto_libre" }],
          guia: { objetivo: estudio.guia.objetivo || "", puntosClave: pk, consejos: co, preguntas: gp },
          activo: estudio.activo,
        });
        setPuntosClave(pk);
        setConsejos(co);
        setGuiaPreguntas(gp);
      } else {
        reset({
          numero: 1,
          etapa_id: 2,
          titulo: "",
          descripcion: "",
          contenido: [{ tipo: "titulo", valor: "" }],
          preguntas: [{ enunciado: "", tipo: "texto_libre" }],
          guia: { objetivo: "", puntosClave: [""], consejos: [""], preguntas: [""] },
          activo: true,
        });
        setPuntosClave([""]);
        setConsejos([""]);
        setGuiaPreguntas([""]);
      }
    }
  }, [open, estudio, reset]);

  const onSubmit = async (data: EstudioBiblicoInput) => {
    const finalData = {
      ...data,
      guia: {
        ...data.guia,
        puntosClave: puntosClave.filter((s) => s.trim() !== ""),
        consejos: consejos.filter((s) => s.trim() !== ""),
        preguntas: guiaPreguntas.filter((s) => s.trim() !== ""),
      },
    };

    setSaving(true);
    const supabase = createClient();
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

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar Estudio" : "Nuevo Estudio Bíblico"}</DialogTitle>
          <DialogDescription>
            {esEdicion ? "Modificá la información del estudio." : "Completá los datos para crear un nuevo estudio bíblico."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Información básica</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={labelClass}>Número *</Label>
                <Input type="number" className={inputClass} {...register("numero", { valueAsNumber: true })} />
                {errors.numero && <p className="text-xs text-destructive">{errors.numero.message}</p>}
              </div>
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
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Título *</Label>
              <Input className={inputClass} {...register("titulo")} placeholder="Título del estudio" />
              {errors.titulo && <p className="text-xs text-destructive">{errors.titulo.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Descripción *</Label>
              <Textarea rows={2} className="text-sm" {...register("descripcion")} placeholder="Breve descripción del estudio" />
              {errors.descripcion && <p className="text-xs text-destructive">{errors.descripcion.message}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={watch("activo")} onCheckedChange={(c) => setValue("activo", c === true)} />
              Activo (visible para miembros)
            </label>
          </div>

          {/* Contenido */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Contenido del estudio</p>
              <Button type="button" size="sm" variant="outline" onClick={() => agregarContenido({ tipo: "texto", valor: "" })}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Agregar sección
              </Button>
            </div>
            {errors.contenido && <p className="text-xs text-destructive">{errors.contenido.message}</p>}
            <div className="space-y-3">
              {camposContenido.map((campo, idx) => (
                <div key={campo.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      {...register(`contenido.${idx}.tipo`)}
                      className="h-8 rounded-md border bg-background px-2 text-xs shrink-0 w-28"
                    >
                      {TIPOS_CONTENIDO.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <Button type="button" size="icon-xs" variant="ghost" onClick={() => eliminarContenido(idx)} className="ml-auto shrink-0">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  <Controller
                    control={control}
                    name={`contenido.${idx}.valor`}
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder={
                          watch(`contenido.${idx}.tipo`) === "titulo" ? "Título principal" :
                          watch(`contenido.${idx}.tipo`) === "subtitulo" ? "Subtítulo" :
                          watch(`contenido.${idx}.tipo`) === "referencia" ? "Juan 3:16 — «Porque...»" :
                          "Escribí el contenido..."
                        }
                      />
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preguntas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Preguntas para el discípulo</p>
              <Button type="button" size="sm" variant="outline" onClick={() => agregarPregunta({ enunciado: "", tipo: "texto_libre" })}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Agregar pregunta
              </Button>
            </div>
            {errors.preguntas && <p className="text-xs text-destructive">{errors.preguntas.message}</p>}
            <div className="space-y-2">
              {camposPreguntas.map((campo, idx) => (
                <div key={campo.id} className="flex gap-2 items-start">
                  <span className="text-xs font-bold text-muted-foreground mt-2 shrink-0 w-5">{idx + 1}.</span>
                  <Input
                    {...register(`preguntas.${idx}.enunciado`)}
                    className={inputClass + " flex-1"}
                    placeholder="Escribí la pregunta..."
                  />
                  <Button type="button" size="icon-xs" variant="ghost" onClick={() => eliminarPregunta(idx)} className="mt-1 shrink-0">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Guía del Discipulador */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Guía del Discipulador</p>
            <div className="space-y-1">
              <Label className={labelClass}>Objetivo *</Label>
              <Textarea rows={2} className="text-sm" {...register("guia.objetivo")} placeholder="Objetivo del estudio para el discipulador" />
              {errors.guia?.objetivo && <p className="text-xs text-destructive">{errors.guia.objetivo.message}</p>}
            </div>

            <div className="space-y-1">
              <Label className={labelClass}>Puntos clave</Label>
              <ListaDinamica
                items={puntosClave}
                onAdd={() => setPuntosClave([...puntosClave, ""])}
                onRemove={(i) => setPuntosClave(puntosClave.filter((_, idx) => idx !== i))}
                onChange={(i, v) => { const n = [...puntosClave]; n[i] = v; setPuntosClave(n); }}
                placeholder="Punto clave..."
              />
            </div>

            <div className="space-y-1">
              <Label className={labelClass}>Consejos</Label>
              <ListaDinamica
                items={consejos}
                onAdd={() => setConsejos([...consejos, ""])}
                onRemove={(i) => setConsejos(consejos.filter((_, idx) => idx !== i))}
                onChange={(i, v) => { const n = [...consejos]; n[i] = v; setConsejos(n); }}
                placeholder="Consejo..."
              />
            </div>

            <div className="space-y-1">
              <Label className={labelClass}>Preguntas de reflexión</Label>
              <ListaDinamica
                items={guiaPreguntas}
                onAdd={() => setGuiaPreguntas([...guiaPreguntas, ""])}
                onRemove={(i) => setGuiaPreguntas(guiaPreguntas.filter((_, idx) => idx !== i))}
                onChange={(i, v) => { const n = [...guiaPreguntas]; n[i] = v; setGuiaPreguntas(n); }}
                placeholder="Pregunta de reflexión..."
                prefix="n"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {esEdicion ? "Guardar cambios" : "Crear estudio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
