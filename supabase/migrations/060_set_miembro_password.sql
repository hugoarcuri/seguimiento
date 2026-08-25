-- Función para crear usuario auth y vincularlo a un miembro existente
-- O para actualizar la contraseña si ya tiene usuario
CREATE OR REPLACE FUNCTION public.set_miembro_password(
  p_miembro_id uuid,
  p_email text,
  p_password text,
  p_nombre text DEFAULT '',
  p_apellido text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_miembro record;
BEGIN
  SELECT user_id INTO v_miembro FROM public.miembros WHERE id = p_miembro_id;

  IF v_miembro IS NULL THEN
    RETURN jsonb_build_object('error', 'Miembro no encontrado');
  END IF;

  IF v_miembro.user_id IS NOT NULL THEN
    -- Ya tiene usuario: actualizar contraseña
    UPDATE auth.users
    SET encrypted_password = crypt(p_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = v_miembro.user_id;
    v_user_id := v_miembro.user_id;
  ELSE
    -- Buscar si ya existe un auth user con ese email
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

    IF v_user_id IS NOT NULL THEN
      -- Actualizar contraseña
      UPDATE auth.users
      SET encrypted_password = crypt(p_password, gen_salt('bf')),
          updated_at = now()
      WHERE id = v_user_id;
    ELSE
      -- Crear usuario nuevo
      v_user_id := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at, confirmation_token,
        email_change_token_current, email_change, email_change_token_new,
        recovery_token, raw_user_meta_data, raw_app_meta_data,
        is_super_admin, is_sso_user
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        now(), now(), now(), '', '', '', '', '',
        jsonb_build_object('nombre', p_nombre, 'apellido', p_apellido),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        false, false
      );
    END IF;

    -- Vincular miembro
    UPDATE public.miembros SET user_id = v_user_id WHERE id = p_miembro_id;
  END IF;

  -- Crear seguimiento si no existe
  INSERT INTO public.seguimientos (miembro_id, discipulador_id, etapa, progreso, estado)
  SELECT p_miembro_id, v_user_id, 1, 0, 'activo'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.seguimientos WHERE miembro_id = p_miembro_id AND estado = 'activo'
  );

  RETURN jsonb_build_object('id', v_user_id, 'ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_miembro_password(uuid, text, text, text, text) TO authenticated;
