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
    const miembro_id = body.miembro_id;
    const email = body.email;
    const password = body.password;
    const nombre = body.nombre;
    const apellido = body.apellido;

    if (!miembro_id || !email || !password) {
      return json({ error: "Faltan campos: miembro_id, email, password" }, 400);
    }

    // 1. Verificar si el miembro ya tiene un user_id
    const { data: miembro, error: miembroError } = await supabase
      .from("miembros")
      .select("user_id")
      .eq("id", miembro_id)
      .single();

    if (miembroError) {
      return json({ error: `Error al buscar miembro: ${miembroError.message}` }, 500);
    }

    let userId: string;

    if (miembro && miembro.user_id) {
      // Ya tiene usuario auth: solo actualizar contraseña
      userId = miembro.user_id;
      const { error: pwError } = await supabase.auth.admin.updateUserById(userId, { password });
      if (pwError) {
        return json({ error: `Error al actualizar contraseña: ${pwError.message}` }, 500);
      }
      return json({ id: userId, email, updated: true }, 200);
    }

    // 2. No tiene usuario: intentar crear uno nuevo
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre: nombre || "", apellido: apellido || "" },
    });

    if (!authError && userData && userData.user) {
      userId = userData.user.id;

      // Vincular miembro
      await supabase.from("miembros").update({ user_id: userId }).eq("id", miembro_id);

      // Crear seguimiento si no existe
      const { data: seg } = await supabase
        .from("seguimientos").select("id")
        .eq("miembro_id", miembro_id).eq("estado", "activo").maybeSingle();

      if (!seg) {
        await supabase.from("seguimientos").insert({
          miembro_id, discipulador_id: userId, etapa: 1, progreso: 0, estado: "activo",
        });
      }

      return json({ id: userId, email, created: true }, 200);
    }

    // 3. Error al crear: puede que el email ya exista en auth
    if (authError && authError.message && authError.message.includes("already registered")) {
      // Buscar el usuario existente por email usando la tabla profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (profiles) {
        userId = profiles.id;
        await supabase.auth.admin.updateUserById(userId, { password });
        await supabase.from("miembros").update({ user_id: userId }).eq("id", miembro_id);
        return json({ id: userId, email, restored: true }, 200);
      }

      // Si no hay profile, intentar con listUsers como último recurso
      try {
        const { data: lista } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existente = lista?.users?.find(
          (u: { email?: string }) => u.email && u.email.toLowerCase() === email.toLowerCase()
        );

        if (existente) {
          userId = existente.id;
          await supabase.auth.admin.updateUserById(userId, { password });
          await supabase.from("miembros").update({ user_id: userId }).eq("id", miembro_id);
          return json({ id: userId, email, restored: true }, 200);
        }
      } catch (_listErr) {
        // Ignorar error de listUsers
      }

      return json({ error: "El email ya existe pero no se pudo recuperar el usuario. Contacte al administrador." }, 400);
    }

    return json({ error: authError?.message || "Error al crear usuario" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message || "Error interno" }, 500);
  }
});
