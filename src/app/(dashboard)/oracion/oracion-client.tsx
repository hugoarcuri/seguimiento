"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Church } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface OracionClientProps {
  oraciones: any[];
  discipulos: Array<{ id: string; nombre: string; apellido: string }>;
}

export function OracionClient({ oraciones, discipulos }: OracionClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [discipuloId, setDiscipuloId] = useState("");
  const [pedido, setPedido] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("oraciones").insert({
      discipulo_id: discipuloId,
      lider_id: user.id,
      pedido,
    });

    if (error) {
      toast.error("Error al registrar pedido");
    } else {
      toast.success("Pedido de oración registrado");
      setOpen(false);
      setDiscipuloId("");
      setPedido("");
      router.refresh();
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
      router.refresh();
    }
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
                <Select onValueChange={(v: any) => setDiscipuloId(v ?? "")} required>
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
                          const respuesta = prompt("¿Cuál fue la respuesta?");
                          if (respuesta) {
                            const supabase = createClient();
                            supabase
                              .from("oraciones")
                              .update({ estado: "respondida", respuesta })
                              .eq("id", oracion.id)
                              .then(() => {
                                toast.success("Respuesta registrada");
                                router.refresh();
                              });
                          }
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
                        const respuesta = prompt("¿Cuál fue la respuesta?");
                        if (respuesta) {
                          const supabase = createClient();
                          supabase
                            .from("oraciones")
                            .update({ estado: "respondida", respuesta })
                            .eq("id", oracion.id)
                            .then(() => {
                              toast.success("Respuesta registrada");
                              router.refresh();
                            });
                        }
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
    </div>
  );
}
