-- 019: Fix escalada de privilegios en profiles
-- La policy UPDATE original (001) usaba solo USING sin WITH CHECK,
-- permitiendo a cualquier usuario autopromoverse a rol='admin'.
-- Ahora el rol nuevo debe coincidir con el rol que el usuario ya tiene.

create or replace function public.get_my_rol()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid();
$$;

drop policy if exists "Usuarios pueden actualizar su propio perfil" on public.profiles;

create policy "Usuarios pueden actualizar su propio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and rol = public.get_my_rol()
  );
