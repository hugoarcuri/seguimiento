-- =====================================================
-- MIGRACIÓN 014: Una reunión/evaluación por discípulo por semana
-- Usa CTEs en lugar de tablas temporales para que funcione
-- aunque el SQL Editor ejecute las sentencias por separado.
-- =====================================================

-- 1. Reasignar evaluaciones de reuniones duplicadas al id conservado
--    a) Eliminar las que chocan con un indicador ya evaluado en la reunión conservada
with id_map as (
  select r.id as old_id,
         first_value(r.id) over (
           partition by r.discipulo_id, date_trunc('week', r.fecha)
           order by r.fecha asc, r.created_at asc
           rows between unbounded preceding and unbounded following
         ) as keep_id
  from reuniones r
)
delete from evaluaciones e
using id_map im
where e.reunion_id = im.old_id
  and e.reunion_id <> im.keep_id
  and exists (
    select 1 from evaluaciones ek
    where ek.reunion_id = im.keep_id
      and ek.indicador_id = e.indicador_id
  );

--    b) Reasignar el resto
with id_map as (
  select r.id as old_id,
         first_value(r.id) over (
           partition by r.discipulo_id, date_trunc('week', r.fecha)
           order by r.fecha asc, r.created_at asc
           rows between unbounded preceding and unbounded following
         ) as keep_id
  from reuniones r
)
update evaluaciones e
set reunion_id = im.keep_id
from id_map im
where e.reunion_id = im.old_id
  and e.reunion_id <> im.keep_id;

-- 2. Observaciones pastorales: conservar solo las de la reunión conservada
with id_map as (
  select r.id as old_id,
         first_value(r.id) over (
           partition by r.discipulo_id, date_trunc('week', r.fecha)
           order by r.fecha asc, r.created_at asc
           rows between unbounded preceding and unbounded following
         ) as keep_id
  from reuniones r
)
delete from observaciones_pastorales op
using id_map im
where op.reunion_id = im.old_id
  and op.reunion_id <> im.keep_id;

-- 3. Desafíos: reasignar a la reunión conservada
with id_map as (
  select r.id as old_id,
         first_value(r.id) over (
           partition by r.discipulo_id, date_trunc('week', r.fecha)
           order by r.fecha asc, r.created_at asc
           rows between unbounded preceding and unbounded following
         ) as keep_id
  from reuniones r
)
update desafios d
set reunion_id = im.keep_id
from id_map im
where d.reunion_id = im.old_id
  and d.reunion_id is not null
  and d.reunion_id <> im.keep_id;

-- 4. Borrar reuniones duplicadas
with id_map as (
  select r.id as old_id,
         first_value(r.id) over (
           partition by r.discipulo_id, date_trunc('week', r.fecha)
           order by r.fecha asc, r.created_at asc
           rows between unbounded preceding and unbounded following
         ) as keep_id
  from reuniones r
)
delete from reuniones r
using id_map im
where r.id = im.old_id
  and r.id <> im.keep_id;

-- 5. Red de seguridad: una reunión por discípulo por semana ISO
create unique index if not exists reuniones_discipulo_semana_unique
  on reuniones (discipulo_id, date_trunc('week', fecha::timestamp));
