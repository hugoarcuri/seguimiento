-- ============================================================
-- 044: Trigger para registro público de discipuladores
-- ============================================================
-- Ejecutar en el SQL Editor de Supabase.

-- 1. Crear la función que crea el perfil y actualiza el rol
CREATE OR REPLACE FUNCTION public.handle_new_discipulador()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Wait for the handle_new_user trigger to create the profile
  PERFORM pg_sleep(0.1);

  -- Update the profile role to discipulador
  UPDATE public.profiles
  SET rol = 'discipulador'::user_role
  WHERE id = NEW.id
    AND raw_user_meta_data ->> 'registro_discipulador' = 'true';

  RETURN NEW;
END;
$$;

-- 2. Crear el trigger (fire AFTER the profile is created)
DROP TRIGGER IF EXISTS on_auth_user_created_discipulador ON auth.users;
CREATE TRIGGER on_auth_user_created_discipulador
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_discipulador();
