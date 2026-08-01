-- 022: Hardening de funciones security definer
-- Todas las funciones security definer deben fijar search_path para
-- evitar search-path hijacking (una de las top 10 recomendaciones de Supabase).
-- 003 (is_admin) y 019 (get_my_rol) carecían de SET search_path.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and rol = 'admin'
  );
$$;

create or replace function public.get_my_rol()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid();
$$;
