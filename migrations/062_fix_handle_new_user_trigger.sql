-- Migración 062: Fix handle_new_user trigger
-- Problema: el trigger usaba tipo user_role que puede no existir,
-- y referenciaba columnas (estudia, trabaja) que pueden no existir en miembros.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rol_final text := 'miembro';
  nuevo_miembro_id uuid;
  v_miembro_existente uuid;
  v_profile_eliminado record;
BEGIN
  IF NEW.raw_user_meta_data->> 'registro_discipulador' = 'true' THEN
    rol_final := 'discipulador';
  END IF;

  -- Buscar profile eliminado para restaurar
  SELECT id INTO v_profile_eliminado
  FROM public.profiles
  WHERE email = NEW.email AND deleted_at IS NOT NULL
  LIMIT 1;

  IF v_profile_eliminado IS NOT NULL THEN
    -- Restaurar profile existente
    UPDATE public.profiles
    SET id = NEW.id,
        nombre = COALESCE(NULLIF(NEW.raw_user_meta_data->> 'nombre', ''), nombre),
        apellido = COALESCE(NULLIF(NEW.raw_user_meta_data->> 'apellido', ''), apellido),
        rol = rol_final,
        deleted_at = NULL
    WHERE id = v_profile_eliminado.id;

    -- Si era miembro, restaurar el miembro vinculándolo al nuevo user_id
    IF rol_final = 'miembro' THEN
      SELECT id INTO v_miembro_existente
      FROM public.miembros
      WHERE email = NEW.email AND estado = 'eliminado'
      LIMIT 1;

      IF v_miembro_existente IS NOT NULL THEN
        UPDATE public.miembros
        SET user_id = NEW.id, estado = 'activo',
            nombre = COALESCE(NULLIF(NEW.raw_user_meta_data->> 'nombre', ''), nombre),
            apellido = COALESCE(NULLIF(NEW.raw_user_meta_data->> 'apellido', ''), apellido)
        WHERE id = v_miembro_existente;

        INSERT INTO public.seguimientos (miembro_id, discipulador_id, etapa, progreso, estado)
        SELECT v_miembro_existente, NEW.id, 1, 0, 'activo'
        WHERE NOT EXISTS (
          SELECT 1 FROM public.seguimientos WHERE miembro_id = v_miembro_existente AND estado = 'activo'
        );
      END IF;
    END IF;
  ELSE
    -- No hay profile eliminado: crear normalmente
    INSERT INTO public.profiles (id, email, nombre, apellido, rol)
    VALUES (NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->> 'nombre', ''),
      COALESCE(NEW.raw_user_meta_data->> 'apellido', ''),
      rol_final)
    ON CONFLICT (id) DO UPDATE SET rol = rol_final;

    IF rol_final = 'miembro' THEN
      SELECT id INTO v_miembro_existente
      FROM public.miembros
      WHERE email = NEW.email AND user_id IS NULL AND estado != 'eliminado'
      LIMIT 1;

      IF v_miembro_existente IS NOT NULL THEN
        UPDATE public.miembros
        SET user_id = NEW.id,
            nombre = COALESCE(NULLIF(NEW.raw_user_meta_data->> 'nombre', ''), nombre),
            apellido = COALESCE(NULLIF(NEW.raw_user_meta_data->> 'apellido', ''), apellido)
        WHERE id = v_miembro_existente;

        INSERT INTO public.seguimientos (miembro_id, discipulador_id, etapa, progreso, estado)
        SELECT v_miembro_existente, NEW.id, 1, 0, 'activo'
        WHERE NOT EXISTS (
          SELECT 1 FROM public.seguimientos WHERE miembro_id = v_miembro_existente AND estado = 'activo'
        );
      ELSE
        INSERT INTO public.miembros (
          lider_id, user_id, nombre, apellido, email, sexo, fecha_nacimiento,
          telefono, direccion, fecha_conversion, bautizado, es_miembro,
          dones, convive_con, etapa_id, estado
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
  END IF;

  RETURN NEW;
END;
$$;
