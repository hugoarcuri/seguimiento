-- 021: Líderes gestionan personas_oracion de sus discípulos
-- Las policies originales (010) solo permitían admin o el propio discípulo,
-- por lo que un líder no podía ver/insertar/eliminar las personas de oración
-- de sus discípulos en la evaluación de seguimiento.

-- Líderes leen/insertan/eliminan personas_oracion de sus discípulos
drop policy if exists "Líderes gestionan personas_oracion de sus discípulos" on public.personas_oracion;

create policy "Líderes gestionan personas_oracion de sus discípulos"
  on public.personas_oracion for all
  using (
    exists (
      select 1 from public.discipulos
      where discipulos.id = personas_oracion.discipulo_id
      and discipulos.lider_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.discipulos
      where discipulos.id = personas_oracion.discipulo_id
      and discipulos.lider_id = auth.uid()
    )
  );
