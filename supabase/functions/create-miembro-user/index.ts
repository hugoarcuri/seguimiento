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

    const { miembro_id, email, password, nombre, apellido } = await req.json();

    if (!miembro_id || !email || !password || !nombre || !apellido) {
      return json({ error: "Faltan campos obligatorios (miembro_id, email, password, nombre, apellido)" }, 400);
    }

    // 1. Verificar si ya existe un auth user con este email
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingUser = authUsers?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      await supabase.auth.admin.updateUserById(userId, { password });
    } else {
      const { data: userData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nombre, apellido },
      });

      if (authError || !userData.user) {
        return json({ error: authError?.message || "Error al crear usuario" }, 400);
      }
      userId = userData.user.id;
    }

    // 2. Vincular miembro al usuario auth
    const { error: linkError } = await supabase
      .from("miembros")
      .update({ user_id: userId })
      .eq("id", miembro_id);

    if (linkError) {
      return json({ error: `Miembro no vinculado: ${linkError.message}` }, 500);
    }

    // 3. Asegurar que existe un seguimiento para este miembro
    await supabase
      .from("seguimientos")
      .insert({
        miembro_id,
        discipulador_id: userId,
        etapa: 1,
        progreso: 0,
        estado: "activo",
      })
      .select()
      .maybeSingle();

    return json({ id: userId, email, linked: true }, 200);
  } catch (err) {
    return json({ error: (err as Error).message || "Error interno" }, 500);
  }
});
