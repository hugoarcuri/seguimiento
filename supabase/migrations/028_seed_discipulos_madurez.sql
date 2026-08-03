-- =====================================================
-- MIGRACIÓN 028: Discípulos de muestra (uno por etapa de madurez)
-- Crea 5 discípulos de prueba, cada uno con un seguimiento
-- en una etapa distinta (1..5) para poder visualizar y probar
-- la sección "Seguimiento".
-- =====================================================

-- Referencia a un perfil real como líder/discipulador
-- (prefiere un admin, si no hay, toma cualquier perfil).
with lider as (
  select id from (
    select id, created_at,
           row_number() over (
             order by case when rol = 'admin' then 0 else 1 end, created_at asc
           ) as rn
    from profiles
  ) t where t.rn = 1
),
-- Etapas de madurez del seguimiento (1..5)
muestra as (
  select * from (values
    ('No Creyente',       1),
    ('Bebé Espiritual',   2),
    ('Niño Espiritual',   3),
    ('Joven Espiritual',  4),
    ('Padre/Madre Espiritual', 5)
  ) as m(apellido, etapa_madurez)
)
-- 1. Insertar discípulos (evita duplicados por nombre/apellido)
insert into discipulos (id, lider_id, apellido, nombre, etapa_id)
select gen_random_uuid(), (select id from lider), m.apellido, 'Muestra', 1
from muestra m
where not exists (
  select 1 from discipulos d where d.apellido = m.apellido and d.nombre = 'Muestra'
);

-- 2. Insertar seguimientos (etapa de madurez = 1..5)
with lider as (
  select id from profiles
  order by case when rol = 'admin' then 0 else 1 end, created_at asc
  limit 1
)
insert into seguimientos (id, discipulo_id, discipulador_id, etapa, progreso, estado, fecha_inicio)
select
  gen_random_uuid(),
  d.id,
  (select id from lider),
  m.etapa_madurez,
  0,
  'activo',
  current_date
from (values
  ('No Creyente',       1),
  ('Bebé Espiritual',   2),
  ('Niño Espiritual',   3),
  ('Joven Espiritual',  4),
  ('Padre/Madre Espiritual', 5)
) as m(apellido, etapa_madurez)
join discipulos d on d.apellido = m.apellido and d.nombre = 'Muestra'
where not exists (
  select 1 from seguimientos s where s.discipulo_id = d.id and s.estado = 'activo'
);