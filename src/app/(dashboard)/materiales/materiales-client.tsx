"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Loader2, BookOpen, Video, FileText, Link2, Headphones, StickyNote } from "lucide-react";
import { toast } from "sonner";
import type { Etapa } from "@/types/database";

const tipoIconos: Record<string, React.ReactNode> = {
  libro: <BookOpen className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  audio: <Headphones className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
  nota: <StickyNote className="h-4 w-4" />,
};

const tipoColors: Record<string, string> = {
  libro: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pdf: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  video: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  audio: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  link: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  nota: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

interface MaterialesClientProps {
  materiales: any[];
  etapas: Etapa[];
}

export function MaterialesClient({ materiales, etapas }: MaterialesClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<string>("");
  const [url, setUrl] = useState("");
  const [etapaId, setEtapaId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("materiales").insert({
      titulo,
      descripcion,
      tipo,
      url,
      etapa_id: etapaId ? parseInt(etapaId) : null,
      creado_por: user.id,
    });

    if (error) {
      toast.error("Error al crear material");
    } else {
      toast.success("Material creado");
      setOpen(false);
      setTitulo("");
      setDescripcion("");
      setTipo("");
      setUrl("");
      setEtapaId("");
      router.refresh();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Materiales</h1>
          <p className="text-muted-foreground">
            Recursos y materiales de discipulado
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Material
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Material</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select onValueChange={(v: any) => setTipo(v ?? "")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="libro">Libro</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="nota">Nota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select onValueChange={(v: any) => setEtapaId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las etapas" />
                  </SelectTrigger>
                  <SelectContent>
                    {etapas.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Material
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {materiales.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay materiales registrados
            </CardContent>
          </Card>
        ) : (
          materiales.map((material) => (
            <Card key={material.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-1.5 rounded-md ${tipoColors[material.tipo] || ""}`}
                    >
                      {tipoIconos[material.tipo] || <FileText className="h-4 w-4" />}
                    </span>
                    <div>
                      <CardTitle className="text-base">{material.titulo}</CardTitle>
                      <CardDescription className="capitalize">
                        {material.tipo}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {material.descripcion && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {material.descripcion}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  {material.etapas && (
                    <Badge variant="secondary" className="text-xs">
                      {material.etapas.nombre}
                    </Badge>
                  )}
                </div>
                {material.url && (
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline block truncate"
                  >
                    {material.url}
                  </a>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
