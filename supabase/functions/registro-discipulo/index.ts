import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Falta SERVICE_ROLE_KEY" }, 500);
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();

    const {
      email,
      password,
      nombre,
      apellido,
      sexo,
      fecha_nacimiento,
      telefono,
      direccion,
      convive_con,
      don_espiritual,
      ministerio,
      estudia,
      trabaja,
    } = body;

    if (!email || !password || !nombre || !apellido) {
      return json({ error: "Faltan campos obligatorios: email, password, nombre, apellido" }, 400);
    }

    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, apellido },
    });

    if (authError || !userData.user) {
      return json({ error: authError?.message || "Error al crear el usuario" }, 400);
    }

    const userId = userData.user.id;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ nombre, apellido })
      .eq("id", userId);

    if (profileError) {
      return json({ error: `Perfil no actualizado: ${profileError.message}` }, 500);
    }

    const { error: discipuloError } = await supabase.from("discipulos").insert({
      id: userId,
      nombre,
      apellido,
      email,
      sexo: sexo || null,
      fecha_nacimiento: fecha_nacimiento || null,
      telefono: telefono || null,
      direccion: direccion || null,
      convive_con: convive_con || null,
      dones: don_espiritual || null,
      ministerio: ministerio || null,
      estudia: estudia ?? null,
      trabaja: trabaja || null,
      etapa_id: 1,
      estado: "activo",
    });

    if (discipuloError) {
      return json({ error: `Discípulo no creado: ${discipuloError.message}` }, 500);
    }

    return json({ id: userId, nombre, apellido, email }, 200);
  } catch (err) {
    return json({ error: (err as Error).message || "Error interno" }, 500);
  }
});
