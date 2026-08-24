-- MIGRACIÓN 057: Vincular miembros existentes al registrarse + fix constraints

-- 1. Permitir NULL en seguimientos.discipulador_id
ALTER TABLE public.seguimientos ALTER COLUMN discipulador_id DROP NOT NULL;

-- 2. Función eliminar_discipuladores corregida
CREATE OR REPLACE FUNCTION public.eliminar_discipuladores(p_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.seguimientos SET discipulador_id = NULL WHERE discipulador_id = ANY(p_ids);
  UPDATE public.miembros SET lider_id = NULL WHERE lider_id = ANY(p_ids);
  DELETE FROM public.profiles WHERE id = ANY(p_ids) AND rol = 'discipulador';
END;
$$;
GRANT EXECUTE ON FUNCTION public.eliminar_discipuladores(p_ids uuid[]) TO authenticated;

-- 3. handle_new_user: cuando un usuario se registra, vincula un miembro existente por email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rol_final user_role := 'miembro';
  nuevo_miembro_id uuid;
  v_miembro_existente uuid;
BEGIN
  IF NEW.raw_user_meta_data->> 'registro_discipulador' = 'true' THEN
    rol_final := 'discipulador';
  END IF;

  -- Crear o actualizar perfil
  INSERT INTO public.profiles (id, email, nombre, apellido, rol)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->> 'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->> 'apellido', ''),
    rol_final)
  ON CONFLICT (id) DO UPDATE SET rol = rol_final;

  -- Si es miembro, intentar vincular un miembro existente creado por admin
  IF rol_final = 'miembro' THEN
    SELECT id INTO v_miembro_existente
    FROM public.miembros
    WHERE email = NEW.email AND user_id IS NULL
    LIMIT 1;

    IF v_miembro_existente IS NOT NULL THEN
      -- Vincular miembro existente al nuevo usuario
      UPDATE public.miembros
      SET user_id = NEW.id,
          nombre = COALESCE(NULLIF(NEW.raw_user_meta_data->> 'nombre', ''), nombre),
          apellido = COALESCE(NULLIF(NEW.raw_user_meta_data->> 'apellido', ''), apellido)
      WHERE id = v_miembro_existente;

      -- Crear seguimiento si no existe
      INSERT INTO public.seguimientos (miembro_id, discipulador_id, etapa, progreso, estado)
      SELECT v_miembro_existente, NEW.id, 1, 0, 'activo'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.seguimientos WHERE miembro_id = v_miembro_existente AND estado = 'activo'
      );
    ELSE
      -- No hay miembro existente: crear uno nuevo (registro normal)
      INSERT INTO public.miembros (
        lider_id, user_id, nombre, apellido, email, sexo, fecha_nacimiento,
        telefono, direccion, fecha_conversion, bautizado, es_miembro,
        dones, convive_con, estudia, trabaja, etapa_id, estado
      ) VALUES (
        NEW.id, NEW.id,
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
        1, 'activo'
      )
      ON CONFLICT (user_id) DO NOTHING
      RETURNING id INTO nuevo_miembro_id;

      IF nuevo_miembro_id IS NOT NULL THEN
        INSERT INTO public.seguimientos (miembro_id, discipulador_id, etapa, progreso, estado)
        VALUES (nuevo_miembro_id, NEW.id, 1, 0, 'activo');
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
