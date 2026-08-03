"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Target } from "lucide-react";
import { format } from "date-fns";

interface MetaActualCardProps {
  metaActual?: string | null;
  metaActualDesde?: string | null;
  onGuardar: (texto: string) => Promise<void>;
  onCompletar: () => Promise<void>;
  saving?: boolean;
}

export function MetaActualCard({ metaActual, metaActualDesde, onGuardar, onCompletar, saving }: MetaActualCardProps) {
  const [texto, setTexto] = useState(metaActual || "");

  return (
    <Card>
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Meta actual</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {metaActual ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{metaActual}</p>
              {metaActualDesde && (
                <p className="text-[11px] text-muted-foreground">Desde {format(new Date(metaActualDesde + "T12:00:00"), "dd/MM/yyyy")}</p>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => { void onCompletar(); }} disabled={saving}>
              {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              <CheckCircle2 className="h-3 w-3 mr-1" /> Completada
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input placeholder="¿Cuál es la meta de esta etapa?" className="h-9 text-sm" value={texto} onChange={(e) => setTexto(e.target.value)} />
            <Button size="sm" onClick={() => { void onGuardar(texto); }} disabled={saving || !texto.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Guardar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}