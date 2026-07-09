-- Fix infinite recursion in RLS policies by using a security definer function
-- Previous policies that referenced profiles in subqueries caused recursion

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and rol = 'admin'
  );
$$;

-- Profiles
drop policy if exists "Admins pueden ver todos los perfiles" on public.profiles;
create policy "Admins pueden ver todos los perfiles"
  on public.profiles for select using (public.is_admin());

drop policy if exists "Admins pueden insertar perfiles" on public.profiles;
create policy "Admins pueden insertar perfiles"
  on public.profiles for insert with check (public.is_admin());

-- Discípulos
drop policy if exists "Admins/líderes pueden ver todos los discípulos" on public.discipulos;
create policy "Admins/líderes pueden ver todos los discípulos"
  on public.discipulos for select using (
    public.is_admin() or lider_id = auth.uid()
  );

drop policy if exists "Admins/líderes pueden insertar discípulos" on public.discipulos;
create policy "Admins/líderes pueden insertar discípulos"
  on public.discipulos for insert with check (public.is_admin());

drop policy if exists "Admins/líderes pueden actualizar discípulos" on public.discipulos;
create policy "Admins/líderes pueden actualizar discípulos"
  on public.discipulos for update using (
    public.is_admin() or lider_id = auth.uid()
  );

drop policy if exists "Admins pueden eliminar discípulos" on public.discipulos;
create policy "Admins pueden eliminar discípulos"
  on public.discipulos for delete using (public.is_admin());

-- Encuentros
drop policy if exists "Admins/líderes pueden gestionar encuentros" on public.encuentros;
create policy "Admins/líderes pueden gestionar encuentros"
  on public.encuentros for all using (
    public.is_admin() or lider_id = auth.uid()
  );

-- Oraciones
drop policy if exists "Admins/líderes pueden gestionar oraciones" on public.oraciones;
create policy "Admins/líderes pueden gestionar oraciones"
  on public.oraciones for all using (
    public.is_admin() or lider_id = auth.uid()
  );

-- Materiales
drop policy if exists "Admins pueden gestionar materiales" on public.materiales;
create policy "Admins pueden gestionar materiales"
  on public.materiales for all using (public.is_admin());

-- Tareas
drop policy if exists "Admins/líderes pueden gestionar tareas" on public.tareas;
create policy "Admins/líderes pueden gestionar tareas"
  on public.tareas for all using (
    public.is_admin() or lider_id = auth.uid()
  );

-- Timeline
drop policy if exists "Admins/líderes pueden gestionar timeline" on public.timeline;
create policy "Admins/líderes pueden gestionar timeline"
  on public.timeline for all using (
    public.is_admin() or exists (
      select 1 from public.discipulos
      where discipulos.id = timeline.discipulo_id
      and discipulos.lider_id = auth.uid()
    )
  );

-- Asistencia
drop policy if exists "Admins/líderes pueden gestionar asistencia" on public.asistencia;
create policy "Admins/líderes pueden gestionar asistencia"
  on public.asistencia for all using (
    public.is_admin() or exists (
      select 1 from public.encuentros
      where encuentros.id = asistencia.encuentro_id
      and encuentros.lider_id = auth.uid()
    )
  );
