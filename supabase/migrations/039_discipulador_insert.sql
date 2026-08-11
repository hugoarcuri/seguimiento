-- =====================================================
-- MIGRACIÓN 039: Permitir a discipuladores crear discípulos
-- La política de INSERT en discipulos solo permitía admin.
-- Ahora un discipulador puede crear discípulos asignados
-- a sí mismo (lider_id = auth.uid()).
-- =====================================================

drop policy if exists "Admins/líderes pueden insertar discípulos" on public.discipulos;
create policy "Admins/líderes pueden insertar discípulos"
  on public.discipulos for insert
  with check (public.is_admin() or lider_id = auth.uid());
