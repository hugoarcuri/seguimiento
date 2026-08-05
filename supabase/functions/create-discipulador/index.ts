// Edge Function: crear un discipulador (usuario + perfil con rol 'discipulador').
// Se invoca desde la app con supabase.functions.invoke("create-discipulador", ...).
//
// Despliegue (desde la raíz del proyecto, con Supabase CLI):
//   supabase login
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key> --project-ref kbyklyueupqjwsvtfcxz
//   supabase functions deploy create-discipulador --project-ref kbyklyueupqjwsvtfcxz
//
// El service_role_key se obtiene en: Dashboard del proyecto -> Settings -> API -> service_role.

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
    return new Response("ok", { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json(
      {
        error:
          "Falta SUPABASE_SERVICE_ROLE_KEY. Configuralo con: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key> --project-ref kbyklyueupqjwsvtfcxz",
      },
      500
    );
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { nombre, apellido, email, telefono, password } = await req.json();

    if (!nombre || !apellido || !email || !password) {
      return json({ error: "Faltan campos obligatorios" }, 400);
    }

    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, apellido, telefono: telefono || null },
    });

    if (authError || !userData.user) {
      return json({ error: authError?.message || "Error al crear el usuario" }, 400);
    }

    // El trigger handle_new_user crea el perfil con rol 'discipulo';
    // aquí se promueve a 'discipulador' y se completan los datos.
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        rol: "discipulador",
        nombre,
        apellido,
        email,
        telefono: telefono || null,
      })
      .eq("id", userData.user.id);

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
