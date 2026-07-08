import { createClient } from "@/lib/supabase/server";
import { OracionClient } from "./oracion-client";

export default async function OracionPage() {
  const supabase = await createClient();

  const { data: oraciones } = await supabase
    .from("oraciones")
    .select("*, discipulos:discipulo_id(nombre, apellido)")
    .order("fecha", { ascending: false });

  const { data: discipulos } = await supabase
    .from("discipulos")
    .select("id, nombre, apellido")
    .eq("estado", "activo")
    .order("apellido", { ascending: true });

  return (
    <OracionClient
      oraciones={oraciones || []}
      discipulos={discipulos || []}
    />
  );
}
