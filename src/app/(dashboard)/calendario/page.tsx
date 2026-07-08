import { createClient } from "@/lib/supabase/server";
import { CalendarioClient } from "./calendario-client";

export default async function CalendarioPage() {
  const supabase = await createClient();

  const { data: encuentros } = await supabase
    .from("encuentros")
    .select("*, discipulos:discipulo_id(nombre, apellido)")
    .order("fecha", { ascending: true });

  return <CalendarioClient encuentros={encuentros || []} />;
}
