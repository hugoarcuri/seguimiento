"use client";

import { ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SupabaseDesafio } from "./data";

interface DesafiosCardProps {
  desafios: SupabaseDesafio[];
  nuevoDesafio: string;
  setNuevoDesafio: (v: string) => void;
  onAgregar: () => void;
  onSolicitarEliminar: (id: string) => void;
}

export function DesafiosCard({
  desafios,
  nuevoDesafio,
  setNuevoDesafio,
  onAgregar,
  onSolicitarEliminar,
}: DesafiosCardProps) {
  const pendientes = desafios.filter((d) => d.estado !== "completado" && d.estado !== "no_realizado");

  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Desafíos</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Nuevo desafío..."
            className="h-9 text-sm"
            value={nuevoDesafio}
            onChange={(e) => setNuevoDesafio(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onAgregar(); }}
          />
          <Button size="sm" variant="outline" onClick={onAgregar} disabled={!nuevoDesafio.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {pendientes.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">Sin desafíos pendientes</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {pendientes.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-muted/30 text-sm">
                <span className="truncate">{d.descripcion}</span>
                <button
                  type="button"
                  onClick={() => onSolicitarEliminar(d.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`Eliminar desafío: ${d.descripcion}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
