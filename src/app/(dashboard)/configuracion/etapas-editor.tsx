"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useEtapas } from "@/hooks/useEtapas";
import type { Etapa } from "@/types/database";

interface Draft {
  nombre: string;
  descripcion: string;
  objetivos: string;
  material_recomendado: string;
}

function EtapaEditorRow({
  etapa,
  index,
  total,
  reordenando,
  guardando,
  onGuardar,
  onReordenar,
}: {
  etapa: Etapa;
  index: number;
  total: number;
  reordenando: boolean;
  guardando: boolean;
  onGuardar: (id: number, draft: Draft) => Promise<void>;
  onReordenar: (idx: number, dir: -1 | 1) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(() => ({
    nombre: etapa.nombre,
    descripcion: etapa.descripcion || "",
    objetivos: (etapa.objetivos || []).join("\n"),
    material_recomendado: etapa.material_recomendado || "",
  }));

  const actualizar = (campo: keyof Draft, valor: string) => {
    setDraft((prev) => ({ ...prev, [campo]: valor }));
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {etapa.id}
          </span>
          <p className="truncate font-medium">Etapa {index + 1}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="outline"
            size="icon"
            title="Subir"
            disabled={reordenando || index === 0}
            onClick={() => onReordenar(index, -1)}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Bajar"
            disabled={reordenando || index === total - 1}
            onClick={() => onReordenar(index, 1)}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor={`etapa-nombre-${etapa.id}`}>Nombre</Label>
          <Input
            id={`etapa-nombre-${etapa.id}`}
            value={draft.nombre}
            onChange={(ev) => actualizar("nombre", ev.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`etapa-desc-${etapa.id}`}>Descripción</Label>
          <Input
            id={`etapa-desc-${etapa.id}`}
            value={draft.descripcion}
            onChange={(ev) => actualizar("descripcion", ev.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`etapa-obj-${etapa.id}`}>Objetivos (uno por línea)</Label>
          <Textarea
            id={`etapa-obj-${etapa.id}`}
            rows={4}
            value={draft.objetivos}
            onChange={(ev) => actualizar("objetivos", ev.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`etapa-mat-${etapa.id}`}>Material recomendado</Label>
          <Input
            id={`etapa-mat-${etapa.id}`}
            value={draft.material_recomendado}
            onChange={(ev) => actualizar("material_recomendado", ev.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={() => onGuardar(etapa.id, draft)} disabled={guardando}>
          {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Guardar
        </Button>
      </div>
    </div>
  );
}

export function EtapasEditor() {
  const { etapas, refresh } = useEtapas();
  const [guardandoId, setGuardandoId] = useState<number | null>(null);
  const [reordenando, setReordenando] = useState(false);

  const guardar = async (id: number, draft: Draft) => {
    setGuardandoId(id);
    const supabase = createClient();
    const objetivos = draft.objetivos.split("\n").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase
      .from("etapas")
      .update({
        nombre: draft.nombre.trim(),
        descripcion: draft.descripcion.trim() || null,
        objetivos: objetivos.length ? objetivos : null,
        material_recomendado: draft.material_recomendado.trim() || null,
      })
      .eq("id", id);
    setGuardandoId(null);
    if (error) {
      toast.error("Error al guardar la etapa");
      return;
    }
    toast.success("Etapa guardada");
    await refresh();
  };

  const reordenar = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= etapas.length) return;
    setReordenando(true);
    const actual = etapas[idx];
    const vecino = etapas[target];
    const supabase = createClient();
    const { error } = await supabase
      .from("etapas")
      .upsert([
        { id: actual.id, orden: vecino.orden },
        { id: vecino.id, orden: actual.orden },
      ], { onConflict: "id" });
    setReordenando(false);
    if (error) {
      toast.error("Error al reordenar las etapas");
      return;
    }
    toast.success("Etapas reordenadas");
    await refresh();
  };

  return (
    <div className="space-y-3">
      {etapas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Cargando etapas...</p>
      ) : (
        etapas.map((e, i) => (
          <EtapaEditorRow
            key={e.id}
            etapa={e}
            index={i}
            total={etapas.length}
            reordenando={reordenando}
            guardando={guardandoId === e.id}
            onGuardar={guardar}
            onReordenar={reordenar}
          />
        ))
      )}
    </div>
  );
}
