-- Renombrar el rol 'discipulo' → 'miembro' en profiles y en la función trigger.

-- 1. Actualizar datos existentes
UPDATE public.profiles SET rol = 'miembro' WHERE rol = 'discipulo';

-- 2. Actualizar CHECK constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_rol_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_rol_check
  CHECK (rol IN ('admin', 'discipulador', 'miembro'));

-- 3. Actualizar la función trigger handle_new_user (default = 'miembro')
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rol_final user_role := 'miembro';
BEGIN
  IF NEW.raw_user_meta_data->> 'registro_discipulador' = 'true' THEN
    rol_final := 'discipulador';
  END IF;

  INSERT INTO public.profiles (id, email, nombre, apellido, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->> 'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->> 'apellido', ''),
    rol_final
  )
  ON CONFLICT (id) DO UPDATE SET rol = rol_final;

  RETURN NEW;
END;
$$;
