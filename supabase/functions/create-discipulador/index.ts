// Edge Function: crear un discipulador (usuario + perfil con rol 'discipulador').
// Se invoca desde la app con supabase.functions.invoke("create-discipulador", ...).
//
// Despliegue (desde la raíz del proyecto, con Supabase CLI):
//   supabase login
//   supabase secrets set SERVICE_ROLE_KEY=<service_role_key> --project-ref kbyklyueupqjwsvtfcxz
//   supabase functions deploy create-discipulador --project-ref kbyklyueupqjwsvtfcxz
//
// El service_role_key se obtiene en: Dashboard del proyecto -> Settings -> API -> service_role.
// Nota: los nombres de secret que empiezan con SUPABASE_ están reservados por la plataforma,
// por eso se usa SERVICE_ROLE_KEY.

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
    return json(
      {
        error:
          "Falta SERVICE_ROLE_KEY. Configuralo con: supabase secrets set SERVICE_ROLE_KEY=<service_role_key> --project-ref kbyklyueupqjwsvtfcxz",
      },
      500
    );
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { nombre, apellido, email, telefono, password, fecha_nacimiento, sexo, direccion, convive_con, fecha_conversion, don_espiritual, bautizado, es_miembro, fortalezas, debilidades } = await req.json();

    if (!nombre || !apellido || !email || !password) {
      return json({ error: "Faltan campos obligatorios" }, 400);
    }

    // 1. Buscar perfil existente con este email (eliminado o no)
    const { data: perfilExistente } = await supabase
      .from("profiles")
      .select("id, deleted_at")
      .eq("email", email)
      .maybeSingle();

    if (perfilExistente) {
      // Restaurar/actualizar el perfil existente en vez de crear uno nuevo
      const { error: restoreError } = await supabase
        .from("profiles")
        .update({
          nombre,
          apellido,
          rol: "discipulador",
          telefono: telefono || null,
          fecha_nacimiento: fecha_nacimiento || null,
          sexo: sexo || null,
          direccion: direccion || null,
          convive_con: convive_con || null,
          fecha_conversion: fecha_conversion || null,
          don_espiritual: don_espiritual || null,
          bautizado: bautizado ?? false,
          es_miembro: es_miembro ?? false,
          fortalezas: fortalezas || null,
          debilidades: debilidades || null,
          deleted_at: null,
        })
        .eq("id", perfilExistente.id);

      if (restoreError) {
        return json({ error: `Error al restaurar perfil: ${restoreError.message}` }, 500);
      }

      // Actualizar la contraseña del usuario auth
      const { error: pwError } = await supabase.auth.admin.updateUserById(
        perfilExistente.id,
        { password }
      );

      if (pwError) {
        return json({ error: `Perfil restaurado pero error al actualizar contraseña: ${pwError.message}` }, 500);
      }

      return json(
        { id: perfilExistente.id, nombre, apellido, email, restored: true },
        200
      );
    }

    // 2. No hay perfil: intentar crear usuario auth nuevo
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, apellido, telefono: telefono || null },
    });

    // 3. Si falla porque el email ya existe en auth.users, buscar el usuario y recrear el perfil
    if (authError) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const existingUser = authUsers?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

      if (existingUser) {
        // Actualizar contraseña del usuario existente
        await supabase.auth.admin.updateUserById(existingUser.id, { password });

        // Crear o actualizar perfil
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert({
            id: existingUser.id,
            email,
            nombre,
            apellido,
            rol: "discipulador",
            telefono: telefono || null,
            fecha_nacimiento: fecha_nacimiento || null,
            sexo: sexo || null,
            direccion: direccion || null,
            convive_con: convive_con || null,
            fecha_conversion: fecha_conversion || null,
            don_espiritual: don_espiritual || null,
            bautizado: bautizado ?? false,
            es_miembro: es_miembro ?? false,
            fortalezas: fortalezas || null,
            debilidades: debilidades || null,
            deleted_at: null,
          }, { onConflict: "id" });

        if (upsertError) {
          return json({ error: `Usuario auth recuperado pero error en perfil: ${upsertError.message}` }, 500);
        }

        return json({ id: existingUser.id, nombre, apellido, email, restored: true }, 200);
      }

      return json({ error: authError.message || "Error al crear el usuario" }, 400);
    }

    if (!userData.user) {
      return json({ error: "Error al crear el usuario" }, 400);
    }

    // 4. Crear perfil para el nuevo usuario
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userData.user.id,
        email,
        nombre,
        apellido,
        rol: "discipulador",
        telefono: telefono || null,
        fecha_nacimiento: fecha_nacimiento || null,
        sexo: sexo || null,
        direccion: direccion || null,
        convive_con: convive_con || null,
        fecha_conversion: fecha_conversion || null,
        don_espiritual: don_espiritual || null,
        bautizado: bautizado ?? false,
        es_miembro: es_miembro ?? false,
        fortalezas: fortalezas || null,
        debilidades: debilidades || null,
      }, { onConflict: "id" });

    if (profileError) {
      return json({ error: `Perfil no actualizado: ${profileError.message}` }, 500);
    }

    return json(
      { id: userData.user.id, nombre, apellido, email },
      200
    );
  } catch (err) {
    return json({ error: (err as Error).message || "Error interno" }, 500);
  }
});
