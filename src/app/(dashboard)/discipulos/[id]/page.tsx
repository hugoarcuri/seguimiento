import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DiscipuloDetailClient } from "./discipulo-detail-client";

export default async function DiscipuloDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: discipulo } = await supabase
    .from("discipulos")
    .select("*")
    .eq("id", id)
    .single();

  if (!discipulo) {
    notFound();
  }

  const { data: etapas } = await supabase
    .from("etapas")
    .select("*")
    .order("orden", { ascending: true });

  const { data: encuentros } = await supabase
    .from("encuentros")
    .select("*")
    .eq("discipulo_id", id)
    .order("fecha", { ascending: false });

  const { data: oraciones } = await supabase
    .from("oraciones")
    .select("*")
    .eq("discipulo_id", id)
    .order("fecha", { ascending: false });

  const { data: tareas } = await supabase
    .from("tareas")
    .select("*")
    .eq("discipulo_id", id)
    .order("created_at", { ascending: false });

  const { data: timeline } = await supabase
    .from("timeline")
    .select("*")
    .eq("discipulo_id", id)
    .order("created_at", { ascending: false });

  return (
    <DiscipuloDetailClient
      discipulo={discipulo}
      etapas={etapas || []}
      encuentros={encuentros || []}
      oraciones={oraciones || []}
      tareas={tareas || []}
      timeline={timeline || []}
    />
  );
}
