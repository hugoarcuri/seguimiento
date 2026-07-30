"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PersonaOracionFormProps {
  onAgregar: (p: { nombre: string; apellido: string; estado: string }) => void;
}

export function PersonaOracionForm({ onAgregar }: PersonaOracionFormProps) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [estado, setEstado] = useState("Oración");

  const handleAgregar = () => {
    if (!nombre.trim() || !apellido.trim()) return;
    onAgregar({ nombre: nombre.trim(), apellido: apellido.trim(), estado });
    setNombre("");
    setApellido("");
    setEstado("Oración");
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 space-y-1">
        <Label className="text-xs">Nombre</Label>
        <Input className="h-8 text-xs" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="flex-1 space-y-1">
        <Label className="text-xs">Apellido</Label>
        <Input className="h-8 text-xs" placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Estado</Label>
        <Select value={estado} onValueChange={(v) => setEstado(v?.toString() ?? "Oración")}>
          <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Oración" className="text-xs">Oración</SelectItem>
            <SelectItem value="Oración y servicio" className="text-xs">Oración y servicio</SelectItem>
            <SelectItem value="Oración y predicación" className="text-xs">Oración y predicación</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button size="sm" className="h-8" onClick={handleAgregar} disabled={!nombre.trim() || !apellido.trim()}>Agregar</Button>
    </div>
  );
}
