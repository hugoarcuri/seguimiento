import { createClient } from "@/lib/supabase/server";
import { DiscipuloForm } from "../discipulo-form";

export default async function NuevoDiscipuloPage() {
  const supabase = await createClient();

  const { data: etapas } = await supabase
    .from("etapas")
    .select("*")
    .order("orden", { ascending: true });

  const { data: lideres } = await supabase
    .from("profiles")
    .select("id, nombre, apellido")
    .eq("rol", "admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Discípulo</h1>
        <p className="text-muted-foreground">
          Registra un nuevo discípulo en el sistema
        </p>
      </div>
      <DiscipuloForm etapas={etapas || []} lideres={lideres || []} />
    </div>
  );
}
