-- =====================================================
-- MIGRACIÓN 014: Una reunión/evaluación por discípulo por semana
-- =====================================================

-- 1. Mapa de ids: cada reunión → id conservado (la más antigua del grupo por discípulo + semana ISO)
create temp table id_map as
select r.id as old_id,
       first_value(r.id) over (
         partition by r.discipulo_id, date_trunc('week', r.fecha)
         order by r.fecha asc, r.created_at asc
         rows between unbounded preceding and unbounded following
       ) as keep_id
from reuniones r;

-- 2. Reasignar evaluaciones de las duplicadas al id conservado
--    a) Eliminar las que chocan con un indicador ya evaluado en la reunión conservada
delete from evaluaciones e
where e.reunion_id <> (select keep_id from id_map where old_id = e.reunion_id)
  and exists (
    select 1 from evaluaciones ek
    where ek.reunion_id = (select keep_id from id_map where old_id = e.reunion_id)
      and ek.indicador_id = e.indicador_id
  );

--    b) Reasignar el resto
update evaluaciones e
set reunion_id = (select keep_id from id_map where old_id = e.reunion_id)
where e.reunion_id <> (select keep_id from id_map where old_id = e.reunion_id);

-- 3. Observaciones pastorales: conservar las de la reunión conservada
delete from observaciones_pastorales op
where op.reunion_id <> (select keep_id from id_map where old_id = op.reunion_id);

-- 4. Desafíos: reasignar a la reunión conservada
update desafios d
set reunion_id = (select keep_id from id_map where old_id = d.reunion_id)
where d.reunion_id is not null
  and d.reunion_id <> (select keep_id from id_map where old_id = d.reunion_id);

-- 5. Borrar reuniones duplicadas
delete from reuniones
where id <> (select keep_id from id_map where old_id = id);

-- 6. Red de seguridad: una reunión por discípulo por semana ISO
create unique index if not exists reuniones_discipulo_semana_unique
  on reuniones (discipulo_id, date_trunc('week', fecha::timestamp));

drop table id_map;
