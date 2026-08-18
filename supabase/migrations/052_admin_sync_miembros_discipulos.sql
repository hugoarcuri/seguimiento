-- =====================================================
-- MIGRACIÓN 052: RPC admin-sync-miembros-discipulos
-- =====================================================
-- Para cada perfil con rol 'miembro'/'discipulo' que NO tenga
-- fila en discipulos, crea el discipulo + seguimiento.
-- Solo el admin puede llamarlo.

CREATE OR REPLACE FUNCTION public.admin_sync_miembros_discipulos()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_profile record;
  v_discipulo_id uuid;
BEGIN
  -- Solo admins
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden usar esta función';
  END IF;

  FOR v_profile IN
    SELECT p.id, p.email, p.nombre, p.apellido, p.fecha_conversion, p.fecha_nacimiento, p.telefono
    FROM public.profiles p
    WHERE p.rol IN ('miembro', 'discipulo')
      AND NOT EXISTS (
        SELECT 1 FROM public.discipulos d WHERE d.user_id = p.id
      )
  LOOP
    -- Crear discipulo
    INSERT INTO public.discipulos (
      lider_id, user_id, nombre, apellido, email,
      fecha_conversion, fecha_nacimiento, telefono,
      etapa_id, estado
    ) VALUES (
      v_profile.id,
      v_profile.id,
      COALESCE(v_profile.nombre, ''),
      COALESCE(v_profile.apellido, ''),
      v_profile.email,
      v_profile.fecha_conversion,
      v_profile.fecha_nacimiento,
      v_profile.telefono,
      1,
      'activo'
    )
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO v_discipulo_id;

    -- Si el DO NOTHING no devolvió id, buscarlo
    IF v_discipulo_id IS NULL THEN
      SELECT id INTO v_discipulo_id
      FROM public.discipulos
      WHERE user_id = v_profile.id
      LIMIT 1;
    END IF;

    -- Crear seguimiento si no existe
    IF v_discipulo_id IS NOT NULL THEN
      INSERT INTO public.seguimientos (
        discipulo_id, discipulador_id, etapa, progreso, estado
      )
      SELECT v_discipulo_id, v_profile.id, 1, 0, 'activo'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.seguimientos
        WHERE discipulo_id = v_discipulo_id AND estado = 'activo'
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_sync_miembros_discipulos() TO authenticated;
