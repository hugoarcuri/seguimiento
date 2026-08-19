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
      miembro_id,
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

    let miembroId = miembro_id;

    if (miembro_id) {
      const { error: linkError } = await supabase
        .from("miembros")
        .update({ user_id: userId })
        .eq("id", miembro_id);

      if (linkError) {
        return json({ error: `No se pudo vincular miembro: ${linkError.message}` }, 500);
      }
    } else {
      const { data: miembroData, error: miembroError } = await supabase
        .from("miembros")
        .insert({
          id: userId,
          user_id: userId,
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
        })
        .select("id")
        .single();

      if (miembroError) {
        return json({ error: `Miembro no creado: ${miembroError.message}` }, 500);
      }
      miembroId = miembroData.id;
    }

    if (miembroId) {
      await supabase
        .from("seguimientos")
        .insert({
          miembro_id: miembroId,
          discipulador_id: userId,
          etapa: 1,
          progreso: 0,
          estado: "activo",
        })
        .select();
    }

    return json({ id: userId, miembro_id: miembroId, nombre, apellido, email }, 200);
  } catch (err) {
    return json({ error: (err as Error).message || "Error interno" }, 500);
  }
});
