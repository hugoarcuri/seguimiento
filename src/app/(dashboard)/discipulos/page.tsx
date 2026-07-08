import { createClient } from "@/lib/supabase/server";
import { DiscipulosClient } from "./discipulos-client";

export default async function DiscipulosPage() {
  const supabase = await createClient();

  const { data: discipulos } = await supabase
    .from("discipulos")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: etapas } = await supabase
    .from("etapas")
    .select("*")
    .order("orden", { ascending: true });

  return (
    <DiscipulosClient
      discipulos={discipulos || []}
      etapas={etapas || []}
    />
  );
}
