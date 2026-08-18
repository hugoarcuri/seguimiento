-- =====================================================
-- MIGRACIÓN 050: Auto-crear discípulo al registrarse como miembro
-- =====================================================
-- Cuando un usuario se registra vía /registro con registro_miembro: true,
-- el trigger ahora crea:
--   1. perfil en profiles (ya existía)
--   2. registro en discipulos vinculado vía user_id
--   3. seguimiento activo en etapa 1
--
-- Esto permite que el miembro aparezca automáticamente en los
-- dashboards de admin y discipulador.

-- 1. Función trigger actualizada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rol_final user_role := 'miembro';
  nuevo_discipulo_id uuid;
BEGIN
  IF NEW.raw_user_meta_data->> 'registro_discipulador' = 'true' THEN
    rol_final := 'discipulador';
  END IF;

  -- 1. Crear perfil
  INSERT INTO public.profiles (id, email, nombre, apellido, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->> 'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->> 'apellido', ''),
    rol_final
  )
  ON CONFLICT (id) DO UPDATE SET rol = rol_final;

  -- 2. Si se registra como miembro, crear también el discípulo
  IF NEW.raw_user_meta_data->> 'registro_miembro' = 'true' AND rol_final = 'miembro' THEN
    INSERT INTO public.discipulos (
      lider_id, user_id, nombre, apellido, email, sexo,
      fecha_nacimiento, telefono, direccion, fecha_conversion,
      bautizado, es_miembro, dones, convive_con, estudia, trabaja,
      etapa_id, estado
    ) VALUES (
      NEW.id,  -- lider_id = el mismo usuario (auto-discipulado inicial)
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->> 'nombre', ''),
      COALESCE(NEW.raw_user_meta_data->> 'apellido', ''),
      NEW.email,
      NULLIF(NEW.raw_user_meta_data->> 'sexo', ''),
      NULLIF(NEW.raw_user_meta_data->> 'fecha_nacimiento', '')::date,
      NULLIF(NEW.raw_user_meta_data->> 'telefono', ''),
      NULLIF(NEW.raw_user_meta_data->> 'direccion', ''),
      NULLIF(NEW.raw_user_meta_data->> 'fecha_conversion', '')::date,
      COALESCE((NEW.raw_user_meta_data->> 'bautizado')::boolean, false),
      COALESCE((NEW.raw_user_meta_data->> 'es_miembro')::boolean, false),
      NULLIF(NEW.raw_user_meta_data->> 'don_espiritual', ''),
      NULLIF(NEW.raw_user_meta_data->> 'convive_con', ''),
      NULLIF(NEW.raw_user_meta_data->> 'estudia', ''),
      NULLIF(NEW.raw_user_meta_data->> 'trabaja', ''),
      1,
      'activo'
    )
    ON CONFLICT (user_id) DO NOTHING  -- evitar duplicados si re-registra
    RETURNING id INTO nuevo_discipulo_id;

    -- 3. Crear seguimiento activo en etapa 1
    IF nuevo_discipulo_id IS NOT NULL THEN
      INSERT INTO public.seguimientos (
        discipulo_id, discipulador_id, etapa, progreso, estado
      ) VALUES (
        nuevo_discipulo_id,
        NEW.id,
        1,
        0,
        'activo'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
