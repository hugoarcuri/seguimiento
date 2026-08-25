"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MiembroForm } from "../miembro-form";
import type { Etapa, Miembro } from "@/types/database";

function EditarMiembroContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [discipuladores, setDiscipuladores] = useState<Array<{ id: string; nombre: string; apellido: string }>>([]);
  const [miembro, setMiembro] = useState<Miembro | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      router.push("/miembros");
      return;
    }
    const supabase = createClient();

    Promise.all([
      supabase.from("miembros").select("*").eq("id", id).single(),
      supabase.from("etapas").select("*").order("orden", { ascending: true }),
      supabase.from("profiles").select("id, nombre, apellido").or("rol.eq.discipulador,rol.eq.admin").order("apellido", { ascending: true }),
    ]).then(([miembroRes, etapasRes, discipuladoresRes]) => {
      if (!miembroRes.data) {
        router.push("/miembros");
        return;
      }
      setMiembro(miembroRes.data);
      setEtapas(etapasRes.data || []);
      setDiscipuladores(discipuladoresRes.data || []);
      setLoading(false);
    }).catch(() => {});
  }, [id, router]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!miembro) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold break-words">Editar Miembro</h1>
        <p className="text-muted-foreground">
          {miembro.apellido}, {miembro.nombre}
        </p>
      </div>
      <MiembroForm
        etapas={etapas}
        discipuladores={discipuladores}
        initialData={{
          ...miembro,
          fecha_nacimiento: miembro.fecha_nacimiento?.split("T")[0],
          fecha_conversion: miembro.fecha_conversion?.split("T")[0],
          fecha_bautismo: miembro.fecha_bautismo?.split("T")[0],
        }}
        isEditing
      />
    </div>
  );
}

export default function EditarMiembroPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><p className="text-muted-foreground">Cargando...</p></div>}>
      <EditarMiembroContent />
    </Suspense>
  );
}
