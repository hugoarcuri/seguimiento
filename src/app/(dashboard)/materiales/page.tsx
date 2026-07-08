import { createClient } from "@/lib/supabase/server";
import { MaterialesClient } from "./materiales-client";

export default async function MaterialesPage() {
  const supabase = await createClient();

  const { data: materiales } = await supabase
    .from("materiales")
    .select("*, etapas:etapa_id(nombre)")
    .order("created_at", { ascending: false });

  const { data: etapas } = await supabase
    .from("etapas")
    .select("*")
    .order("orden", { ascending: true });

  return (
    <MaterialesClient
      materiales={materiales || []}
      etapas={etapas || []}
    />
  );
}
