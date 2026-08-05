-- =====================================================
-- MIGRACIÓN 036: Sección "Discipuladores"
-- Nuevo rol 'discipulador', vínculo con discípulos via
-- discipulos.lider_id (ahora nullable) y permisos RLS.
-- =====================================================

-- 1. Nuevo rol 'discipulador' en profiles
alter table profiles drop constraint if exists profiles_rol_check;
alter table profiles
  add constraint profiles_rol_check check (rol in ('admin', 'discipulador', 'discipulo'));

-- 2. discipulos.lider_id pasa a ser opcional (permite desvincular)
alter table discipulos alter column lider_id drop not null;

-- 3. RLS: los admins pueden actualizar cualquier perfil
-- (editar datos del discipulador y cambiar su rol)
drop policy if exists "Admins pueden actualizar perfiles" on public.profiles;
create policy "Admins pueden actualizar perfiles"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- 4. RLS: un usuario puede ver el perfil de su discipulador
-- (o el de sus discípulos), para mostrar el vínculo en la app
drop policy if exists "Usuarios pueden ver perfil de su discipulador" on public.profiles;
create policy "Usuarios pueden ver perfil de su discipulador"
  on public.profiles for select
  using (
    exists (
      select 1 from public.discipulos
      where discipulos.lider_id = profiles.id
        and (
          discipulos.id::text = auth.uid()::text
          or discipulos.lider_id = auth.uid()
        )
    )
  );
