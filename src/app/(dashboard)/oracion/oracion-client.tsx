"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Church } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface OracionConDiscipulo {
  id: string;
  discipulo_id: string;
  lider_id?: string;
  pedido: string;
  respuesta?: string;
  estado: string;
  fecha: string;
  created_at?: string;
  updated_at?: string;
  discipulos?: { nombre: string; apellido: string };
}

interface OracionClientProps {
  oraciones: OracionConDiscipulo[];
  setOraciones: React.Dispatch<React.SetStateAction<OracionConDiscipulo[]>>;
  discipulos: Array<{ id: string; nombre: string; apellido: string }>;
}

export function OracionClient({ oraciones, setOraciones, discipulos }: OracionClientProps) {
  const [open, setOpen] = useState(false);
  const [discipuloId, setDiscipuloId] = useState("");
  const [pedido, setPedido] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [responderId, setResponderId] = useState<string | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase.from("oraciones").insert({
      discipulo_id: discipuloId,
      lider_id: user.id,
      pedido,
    }).select("*, discipulos:discipulo_id(nombre, apellido)").single();

    if (error) {
      toast.error("Error al registrar pedido");
    } else {
      toast.success("Pedido de oración registrado");
      setOpen(false);
      setDiscipuloId("");
      setPedido("");
      if (data) setOraciones((prev) => [data as never, ...prev]);
    }
    setSubmitting(false);
  };

  const updateEstado = async (id: string, estado: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("oraciones")
      .update({ estado })
      .eq("id", id);

    if (error) {
      toast.error("Error al actualizar");
    } else {
      toast.success("Estado actualizado");
      setOraciones((prev) => prev.map((o) => o.id === id ? { ...o, estado } : o));
    }
  };

  const handleResponder = async () => {
    if (!responderId || !respuestaTexto.trim()) return;
    const supabase = createClient();
    await supabase
      .from("oraciones")
      .update({ estado: "respondida", respuesta: respuestaTexto.trim() })
      .eq("id", responderId);
    toast.success("Respuesta registrada");
    setResponderId(null);
    setRespuestaTexto("");
    setOraciones((prev) => prev.map((o) => o.id === responderId ? { ...o, estado: "respondida", respuesta: respuestaTexto.trim() } : o));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Oración</h1>
          <p className="text-muted-foreground">
            Registra y da seguimiento a los pedidos de oración
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Pedido
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Pedido de Oración</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Discípulo *</Label>
                 <Select onValueChange={(v) => setDiscipuloId(v?.toString() ?? "")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar discípulo" />
                  </SelectTrigger>
                  <SelectContent>
                    {discipulos.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.apellido}, {d.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pedido">Pedido *</Label>
                <Textarea
                  id="pedido"
                  value={pedido}
                  onChange={(e) => setPedido(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Pedido
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {oraciones.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay pedidos de oración registrados
            </CardContent>
          </Card>
        ) : (
          oraciones.map((oracion) => (
            <Card key={oracion.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base line-clamp-2">
                      {oracion.pedido}
                    </CardTitle>
                    <CardDescription>
                      {oracion.discipulos?.nombre
                        ? `${oracion.discipulos.apellido}, ${oracion.discipulos.nombre}`
                        : "—"}{" "}
                      · {format(new Date(oracion.fecha), "dd/MM/yyyy")}
                    </CardDescription>
                  </div>
                  <Church className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      oracion.estado === "respondida"
                        ? "default"
                        : oracion.estado === "en_oracion"
                        ? "secondary"
                        : "outline"
                    }
                    className="capitalize"
                  >
                    {oracion.estado === "respondida"
                      ? "Respondida"
                      : oracion.estado === "en_oracion"
                      ? "En Oración"
                      : "Pendiente"}
                  </Badge>
                </div>
                {oracion.respuesta && (
                  <div className="text-sm bg-muted p-3 rounded-lg">
                    <span className="font-medium">Respuesta: </span>
                    {oracion.respuesta}
                  </div>
                )}
                <div className="flex gap-2">
                  {oracion.estado === "pendiente" && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateEstado(oracion.id, "en_oracion")}
                      >
                        En Oración
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setResponderId(oracion.id);
                          setRespuestaTexto("");
                        }}
                      >
                        Responder
                      </Button>
                    </>
                  )}
                  {oracion.estado === "en_oracion" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setResponderId(oracion.id);
                        setRespuestaTexto("");
                      }}
                    >
                      Marcar Respondida
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={responderId !== null} onOpenChange={() => setResponderId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Respuesta</DialogTitle>
            <DialogDescription>¿Cuál fue la respuesta a esta oración?</DialogDescription>
          </DialogHeader>
          <Textarea
            value={respuestaTexto}
            onChange={(e) => setRespuestaTexto(e.target.value)}
            placeholder="Escribí la respuesta..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponderId(null)}>Cancelar</Button>
            <Button onClick={handleResponder} disabled={!respuestaTexto.trim()}>Guardar Respuesta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
