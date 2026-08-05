"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DiscipuloForm } from "../discipulo-form";
import type { Etapa, Discipulo } from "@/types/database";

function EditarDiscipuloContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [discipuladores, setDiscipuladores] = useState<Array<{ id: string; nombre: string; apellido: string }>>([]);
  const [discipulo, setDiscipulo] = useState<Discipulo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      router.push("/discipulos");
      return;
    }
    const supabase = createClient();

    Promise.all([
      supabase.from("discipulos").select("*").eq("id", id).single(),
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
      supabase.from("profiles").select("id, nombre, apellido").or("rol.eq.discipulador,rol.eq.admin").order("apellido", { ascending: true }),
    ]).then(([discipuloRes, etapasRes, discipuladoresRes]) => {
      if (!discipuloRes.data) {
        router.push("/discipulos");
        return;
      }
      setDiscipulo(discipuloRes.data);
      setEtapas(etapasRes.data || []);
      setDiscipuladores(discipuladoresRes.data || []);
      setLoading(false);
    }).catch(console.error);
  }, [id, router]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!discipulo) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Discípulo</h1>
        <p className="text-muted-foreground">
          {discipulo.apellido}, {discipulo.nombre}
        </p>
      </div>
      <DiscipuloForm
        etapas={etapas}
        discipuladores={discipuladores}
        initialData={{
          ...discipulo,
          fecha_nacimiento: discipulo.fecha_nacimiento?.split("T")[0],
          fecha_conversion: discipulo.fecha_conversion?.split("T")[0],
          fecha_bautismo: discipulo.fecha_bautismo?.split("T")[0],
        }}
        isEditing
      />
    </div>
  );
}

export default function EditarDiscipuloPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>}>
      <EditarDiscipuloContent />
    </Suspense>
  );
}
