import { createClient } from "@/lib/supabase/server";
import { EncuentrosClient } from "./encuentros-client";

export default async function EncuentrosPage() {
  const supabase = await createClient();

  const { data: encuentros } = await supabase
    .from("encuentros")
    .select("*, discipulos:discipulo_id(nombre, apellido)")
    .order("fecha", { ascending: false });

  const { data: discipulos } = await supabase
    .from("discipulos")
    .select("id, nombre, apellido")
    .eq("estado", "activo")
    .order("apellido", { ascending: true });

  return (
    <EncuentrosClient
      encuentros={encuentros || []}
      discipulos={discipulos || []}
    />
  );
}
