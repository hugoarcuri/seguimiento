-- =====================================================
-- MIGRACIÓN 037: Eliminar discipuladores con todo lo asociado
-- Función security definer que borra el perfil del discipulador
-- junto con sus registros (desvincula discípulos y elimina
-- seguimientos, agenda, oraciones, tareas, reuniones, etc.).
-- Usa to_regclass para no fallar si alguna tabla no existe.
-- =====================================================

create or replace function public.eliminar_discipuladores(p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores pueden eliminar discipuladores';
  end if;

  -- 1. Desvincular discípulos (quedan sin discipulador)
  update public.discipulos set lider_id = null where lider_id = any(p_ids);

  -- 2. Eliminar seguimientos (cascada a evaluaciones, objetivos, historial)
  if to_regclass('public.seguimiento_observaciones') is not null then
    delete from public.seguimiento_observaciones where usuario = any(p_ids);
  end if;
  if to_regclass('public.seguimientos') is not null then
    delete from public.seguimientos where discipulador_id = any(p_ids);
  end if;

  -- 3. Eliminar registros asociados al discipulador
  if to_regclass('public.encuentros') is not null then
    delete from public.encuentros where lider_id = any(p_ids);
  end if;
  if to_regclass('public.agenda') is not null then
    delete from public.agenda where lider_id = any(p_ids);
  end if;
  if to_regclass('public.oraciones') is not null then
    delete from public.oraciones where lider_id = any(p_ids);
  end if;
  if to_regclass('public.tareas') is not null then
    delete from public.tareas where lider_id = any(p_ids);
  end if;
  if to_regclass('public.reuniones') is not null then
    delete from public.reuniones where lider_id = any(p_ids);
  end if;
  if to_regclass('public.desafios') is not null then
    delete from public.desafios where lider_id = any(p_ids);
  end if;
  if to_regclass('public.acompanamiento_evangelistico') is not null then
    delete from public.acompanamiento_evangelistico where creado_por = any(p_ids);
  end if;
  if to_regclass('public.materiales') is not null then
    delete from public.materiales where creado_por = any(p_ids);
  end if;

  -- 4. Eliminar los perfiles
  delete from public.profiles where id = any(p_ids) and rol = 'discipulador';
end;
$$;

grant execute on function public.eliminar_discipuladores(uuid[]) to authenticated;
