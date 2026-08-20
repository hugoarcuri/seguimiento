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

const ETAPAS = [
  { value: "1", label: "1. No creyente" },
  { value: "2", label: "2. Nuevo creyente" },
  { value: "3", label: "3. Discípulo" },
  { value: "4", label: "4. Siervo" },
  { value: "5", label: "5. Multiplicador" },
];

const inputClass = "h-11 md:h-8";
const labelClass = "text-[11px] font-medium text-muted-foreground";

export function EstudioBiblicoFormDialog({ open, onOpenChange, estudio, onGuardado }: Props) {
  const [saving, setSaving] = useState(false);
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

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90dvh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{esEdicion ? "Editar Estudio" : "Nuevo Estudio Bíblico"}</DialogTitle>
          <DialogDescription>
            {esEdicion ? "Modificá la información del estudio." : "Completá los datos para crear un nuevo estudio bíblico."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="px-6 space-y-3 shrink-0">
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
              <Textarea rows={1} className="text-sm" {...register("descripcion")} placeholder="Breve descripción" />
              {errors.descripcion && <p className="text-xs text-destructive">{errors.descripcion.message}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={watch("activo")} onCheckedChange={(c) => setValue("activo", c === true)} />
              <span className="text-sm">Activo</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-3">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Contenido</p>
                  <Button type="button" size="sm" variant="outline" onClick={() => agregarContenido({ tipo: "texto", valor: "" })}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Agregar sección
                  </Button>
                </div>
                {errors.contenido && <p className="text-xs text-destructive">{errors.contenido.message}</p>}
                <div className="space-y-2">
                  {camposContenido.map((campo, idx) => (
                    <div key={campo.id} className="rounded-lg border p-2 space-y-1">
                      <div className="flex items-center justify-end">
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
                            rows={14}
                          />
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Preguntas de reflexión</p>
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
            </div>
          </div>

          <div className="px-6 pb-6 pt-3 shrink-0">
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {esEdicion ? "Guardar cambios" : "Crear estudio"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
