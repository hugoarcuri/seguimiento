-- =====================================================
-- MIGRACIÓN 051: RPC ensure_miembro_discipulo
-- =====================================================
-- Si el usuario autenticado es miembro y no tiene registro
-- en discipulos, lo crea automáticamente junto con su seguimiento.
-- Devuelve el discipulo_id (creado o existente).

CREATE OR REPLACE FUNCTION public.ensure_miembro_discipulo()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_rol text;
  v_profile record;
  v_discipulo_id uuid;
BEGIN
  -- Solo miembros
  SELECT rol INTO v_rol FROM public.profiles WHERE id = v_user_id;
  IF v_rol IS NULL OR v_rol NOT IN ('miembro', 'discipulo') THEN
    RAISE EXCEPTION 'Solo los miembros pueden usar esta función';
  END IF;

  -- Buscar discipulo existente por user_id
  SELECT id INTO v_discipulo_id
  FROM public.discipulos
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_discipulo_id IS NOT NULL THEN
    RETURN v_discipulo_id;
  END IF;

  -- Obtener datos del perfil
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;

  -- Crear discipulo
  INSERT INTO public.discipulos (
    lider_id, user_id, nombre, apellido, email,
    fecha_nacimiento, telefono, etapa_id, estado
  ) VALUES (
    v_user_id,
    v_user_id,
    COALESCE(v_profile.nombre, ''),
    COALESCE(v_profile.apellido, ''),
    v_profile.email,
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
    WHERE user_id = v_user_id
    LIMIT 1;
  END IF;

  -- Crear seguimiento si no existe
  IF v_discipulo_id IS NOT NULL THEN
    INSERT INTO public.seguimientos (
      discipulo_id, discipulador_id, etapa, progreso, estado
    )
    SELECT v_discipulo_id, v_user_id, 1, 0, 'activo'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.seguimientos
      WHERE discipulo_id = v_discipulo_id AND estado = 'activo'
    );
  END IF;

  RETURN v_discipulo_id;
END;
$$;

-- Permitir que usuarios autenticados lo llamen
GRANT EXECUTE ON FUNCTION public.ensure_miembro_discipulo() TO authenticated;
