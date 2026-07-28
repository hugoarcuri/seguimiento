"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import type { Etapa } from "@/types/database";

interface FilaImportacion {
  apellido: string;
  nombre: string;
  telefono?: string;
  email?: string;
  sexo?: "M" | "F";
  fecha_nacimiento?: string;
  direccion?: string;
  ministerio?: string;
  etapa_id?: number;
  estado: string;
  observaciones?: string;
  _errores?: string[];
  _valida: boolean;
}

const MAPEO_COLUMNAS: Record<string, keyof FilaImportacion> = {
  apellido: "apellido", apellidos: "apellido", surname: "apellido",
  nombre: "nombre", names: "nombre", name: "nombre", firstname: "nombre",
  telefono: "telefono", tel: "telefono", phone: "telefono", celular: "telefono", cel: "telefono",
  email: "email", correo: "email", mail: "email",
  sexo: "sexo", genero: "sexo", gener: "sexo", género: "sexo",
  nacimiento: "fecha_nacimiento", fechanacimiento: "fecha_nacimiento", birth: "fecha_nacimiento", dateofbirth: "fecha_nacimiento", dob: "fecha_nacimiento",
  direccion: "direccion", address: "direccion", dirección: "direccion", domicilio: "direccion",
  ministerio: "ministerio", ministry: "ministerio",
  etapa: "etapa_id", etap: "etapa_id", stage: "etapa_id",
  estado: "estado", status: "estado",
  observaciones: "observaciones", notes: "observaciones", nota: "observaciones", observacion: "observaciones",
};

const FORMATO_EJEMPLO_TEXTO = `apellido\tnombre\ttelefono\temail\tetapa\testado
García\tJuan\t1123456789\tjuan@gmail.com\t1\tactivo
Pérez\tMaría\t1198765432\tmaria@gmail.com\t2\tactivo`;

export function ImportarDiscipulos({ etapas }: { etapas: Etapa[] }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState<"texto" | "archivo">("texto");
  const [texto, setTexto] = useState("");
  const [filas, setFilas] = useState<FilaImportacion[]>([]);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: number; err: number; errores: string[] } | null>(null);

  const reset = () => {
    setTexto("");
    setFilas([]);
    setResultado(null);
    setImportando(false);
    setModo("texto");
  };

  const parseDesdeTexto = (txt: string) => {
    const lineas = txt.trim().split("\n").filter(Boolean);
    if (lineas.length < 2) {
      toast.error("El texto debe tener un encabezado y al menos una fila de datos");
      return;
    }

    const encabezados = lineas[0].split("\t").map((h) => MAPEO_COLUMNAS[h.trim().toLowerCase().replace(/[\s_-]+/g, "")] || h.trim().toLowerCase());
    const datos: FilaImportacion[] = [];

    for (let i = 1; i < lineas.length; i++) {
      const valores = lineas[i].split("\t");
      const fila: Record<string, string> = {};
      const errores: string[] = [];

      encabezados.forEach((col, j) => {
        if (col && valores[j] !== undefined) {
          fila[col as string] = valores[j].trim();
        }
      });

      if (!fila.apellido) errores.push("Falta apellido");
      if (!fila.nombre) errores.push("Falta nombre");

      let etapa = undefined;
      if (fila.etapa) {
        etapa = parseInt(fila.etapa);
        if (isNaN(etapa)) errores.push(`Etapa inválida: "${fila.etapa}"`);
      }

      datos.push({
        apellido: fila.apellido || "",
        nombre: fila.nombre || "",
        telefono: fila.telefono || undefined,
        email: fila.email || undefined,
        sexo: fila.sexo === "M" || fila.sexo === "F" ? fila.sexo : undefined,
        fecha_nacimiento: fila.fecha_nacimiento || undefined,
        direccion: fila.direccion || undefined,
        ministerio: fila.ministerio || undefined,
        etapa_id: etapa,
        estado: fila.estado || "activo",
        observaciones: fila.observaciones || undefined,
        _errores: errores.length > 0 ? errores : undefined,
        _valida: errores.length === 0 && !!fila.apellido && !!fila.nombre,
      });
    }

    setFilas(datos);
    if (datos.some((d) => !d._valida)) {
      toast.warning(`${datos.filter((d) => !d._valida).length} filas tienen errores`);
    }
  };

  const parseDesdeExcel = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (raw.length === 0) {
        toast.error("El archivo está vacío");
        return;
      }

      const mapeo: Record<string, string> = {};
      Object.keys(raw[0]).forEach((k) => {
        const key = k.trim().toLowerCase().replace(/[\s_-]+/g, "");
        mapeo[k] = (MAPEO_COLUMNAS[key] as string) || key;
      });

      const datos: FilaImportacion[] = raw.map((row) => {
        const fila: Record<string, string> = {};
        const errores: string[] = [];

        Object.entries(row).forEach(([col, val]) => {
          const mapped = mapeo[col];
          if (mapped && val) fila[mapped] = String(val).trim();
        });

        if (!fila.apellido) errores.push("Falta apellido");
        if (!fila.nombre) errores.push("Falta nombre");

        let etapa = undefined;
        if (fila.etapa) {
          etapa = parseInt(fila.etapa);
          if (isNaN(etapa)) {
            const e = etapas.find((e) => e.nombre.toLowerCase() === fila.etapa?.toLowerCase());
            etapa = e?.id;
            if (!etapa) errores.push(`Etapa inválida: "${fila.etapa}"`);
          }
        }

        return {
          apellido: fila.apellido || "",
          nombre: fila.nombre || "",
          telefono: fila.telefono || undefined,
          email: fila.email || undefined,
          sexo: fila.sexo === "M" || fila.sexo === "F" ? fila.sexo : undefined,
          fecha_nacimiento: fila.fecha_nacimiento || undefined,
          direccion: fila.direccion || undefined,
          ministerio: fila.ministerio || undefined,
          etapa_id: etapa,
          estado: fila.estado || "activo",
          observaciones: fila.observaciones || undefined,
          _errores: errores.length > 0 ? errores : undefined,
          _valida: errores.length === 0 && !!fila.apellido && !!fila.nombre,
        };
      });

      setFilas(datos);
      if (datos.some((d) => !d._valida)) {
        toast.warning(`${datos.filter((d) => !d._valida).length} filas tienen errores`);
      }
    } catch {
      toast.error("Error al leer el archivo. Asegurate que sea .xlsx o .csv válido");
    }
  };

  const handleImportar = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Debés iniciar sesión"); return; }

    setImportando(true);
    let ok = 0;
    let err = 0;
    const errores: string[] = [];

    for (const fila of filas) {
      if (!fila._valida) { err++; continue; }

      const { error } = await supabase.from("discipulos").insert({
        lider_id: user.id,
        apellido: fila.apellido,
        nombre: fila.nombre,
        telefono: fila.telefono || null,
        email: fila.email || null,
        sexo: fila.sexo || null,
        fecha_nacimiento: fila.fecha_nacimiento || null,
        direccion: fila.direccion || null,
        ministerio: fila.ministerio || null,
        etapa_id: fila.etapa_id || 1,
        estado: fila.estado || "activo",
        observaciones: fila.observaciones || null,
      });

      if (error) {
        err++;
        errores.push(`${fila.apellido}, ${fila.nombre}: ${error.message}`);
      } else {
        ok++;
      }
    }

    setResultado({ ok, err, errores });
    setImportando(false);

    if (ok > 0) {
      toast.success(`${ok} discípulos importados`);
      router.refresh();
    }
    if (err > 0) {
      toast.error(`${err} discípulos no pudieron importarse`);
    }
  };

  const validadas = filas.filter((f) => f._valida);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-1" /> Importar
      </Button>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Discípulos</DialogTitle>
          <DialogDescription>Importá discípulos desde texto copiado o archivo Excel/CSV</DialogDescription>
        </DialogHeader>

        {resultado ? (
          <div className="space-y-4">
            <Card className={resultado.ok > 0 ? "border-emerald-200" : "border-red-200"}>
              <CardContent className="p-4 flex items-center gap-3">
                {resultado.ok > 0 ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <AlertTriangle className="h-6 w-6 text-red-500" />}
                <div>
                  <p className="text-sm font-medium">{resultado.ok} importados, {resultado.err} errores</p>
                </div>
              </CardContent>
            </Card>
            {resultado.errores.length > 0 && (
              <div className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                {resultado.errores.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => { reset(); setOpen(false); }}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : filas.length === 0 ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant={modo === "texto" ? "default" : "outline"} size="sm" onClick={() => setModo("texto")}>
                <FileText className="h-4 w-4 mr-1" /> Pegar texto
              </Button>
              <Button variant={modo === "archivo" ? "default" : "outline"} size="sm" onClick={() => setModo("archivo")}>
                <Upload className="h-4 w-4 mr-1" /> Subir archivo
              </Button>
            </div>

            {modo === "texto" ? (
              <div className="space-y-2">
                <Label>Pegá los datos separados por tabulaciones (copiados de Excel/Google Sheets)</Label>
                <Textarea rows={8} className="text-sm font-mono" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={FORMATO_EJEMPLO_TEXTO} />
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Ver formato de ejemplo</summary>
                  <pre className="mt-1 p-2 bg-muted rounded-md text-[11px]">{FORMATO_EJEMPLO_TEXTO}</pre>
                </details>
                <div className="text-xs text-muted-foreground">
                  Columnas: <strong>apellido</strong>*, <strong>nombre</strong>*, teléfono, email, etapa (1-4), estado, sexo (M/F), fecha_nacimiento (AAAA-MM-DD), dirección, ministerio, observaciones
                </div>
                <Button onClick={() => parseDesdeTexto(texto)} disabled={!texto.trim()}>
                  Previsualizar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="file-import">Seleccioná un archivo .xlsx o .csv</Label>
                <Input id="file-import" ref={fileInput} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { if (e.target.files?.[0]) parseDesdeExcel(e.target.files[0]); }} />
                <div className="text-xs text-muted-foreground">
                  La primera fila debe tener los nombres de columna. Columnas: <strong>apellido</strong>*, <strong>nombre</strong>*, teléfono, email, etapa, estado, sexo, fecha_nacimiento, dirección, ministerio, observaciones
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{filas.length} filas ({validadas.length} válidas, {filas.length - validadas.length} con errores)</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => { setFilas([]); setTexto(""); }}>
                  Volver
                </Button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Apellido</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Validación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map((f, i) => (
                    <TableRow key={i} className={f._valida ? "" : "bg-red-50 dark:bg-red-950/20"}>
                      <TableCell className="font-medium">{f.apellido}</TableCell>
                      <TableCell>{f.nombre}</TableCell>
                      <TableCell>{f.telefono || "—"}</TableCell>
                      <TableCell>{f.email || "—"}</TableCell>
                      <TableCell>{f.etapa_id || 1}</TableCell>
                      <TableCell className="capitalize">{f.estado}</TableCell>
                      <TableCell>
                        {f._valida ? (
                          <span className="text-xs text-emerald-600">✓</span>
                        ) : (
                          <span className="text-xs text-red-600" title={f._errores?.join("; ")}>{f._errores?.[0]}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setFilas([]); setTexto(""); }}>Cancelar</Button>
              <Button onClick={handleImportar} disabled={importando || validadas.length === 0}>
                {importando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar {validadas.length} discípulos
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
