"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { Discipulo, Etapa } from "@/types/database";

const estadoColors: Record<string, string> = {
  activo: "bg-green-500",
  pausado: "bg-yellow-500",
  completado: "bg-blue-500",
  retirado: "bg-red-500",
};

interface DiscipulosClientProps {
  discipulos: Discipulo[];
  etapas: Etapa[];
}

export function DiscipulosClient({ discipulos, etapas }: DiscipulosClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const filtered = discipulos.filter(
    (d) =>
      d.nombre.toLowerCase().includes(search.toLowerCase()) ||
      d.apellido.toLowerCase().includes(search.toLowerCase()) ||
      d.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getEtapaNombre = (etapaId: number) => {
    return etapas.find((e) => e.id === etapaId)?.nombre || "Sin etapa";
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("discipulos").delete().eq("id", id);

    if (error) {
      toast.error("Error al eliminar discípulo");
    } else {
      toast.success("Discípulo eliminado");
      setDeleteDialog(null);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discípulos</h1>
          <p className="text-muted-foreground">
            Gestiona todos los discípulos
          </p>
        </div>
        <Link
          href="/discipulos/nuevo"
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-8 gap-1.5 px-2.5 text-sm font-medium"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Discípulo
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Discípulos</CardTitle>
          <CardDescription>
            {filtered.length} de {discipulos.length} registros
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar discípulos..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                  <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron discípulos
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((discipulo) => (
                  <TableRow key={discipulo.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {discipulo.apellido}, {discipulo.nombre}
                        </p>
                        {discipulo.email && (
                          <p className="text-xs text-muted-foreground">
                            {discipulo.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getEtapaNombre(discipulo.etapa_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <div
                           className={`h-2 w-2 rounded-full ${estadoColors[discipulo.estado]}`}
                         />
                         <span className="capitalize">{discipulo.estado}</span>
                       </div>
                     </TableCell>
                     <TableCell>
                       {discipulo.fecha_nacimiento
                         ? (() => {
                             const hoy = new Date();
                             const nac = new Date(discipulo.fecha_nacimiento);
                             let edad = hoy.getFullYear() - nac.getFullYear();
                             const m = hoy.getMonth() - nac.getMonth();
                             if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
                             return edad;
                           })()
                         : "—"}
                     </TableCell>
                     <TableCell>{discipulo.telefono || "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/discipulos/${discipulo.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/discipulos/editar?id=${discipulo.id}`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteDialog(discipulo.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Discípulo</DialogTitle>
            <DialogDescription>
              ¿Estás seguro? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
