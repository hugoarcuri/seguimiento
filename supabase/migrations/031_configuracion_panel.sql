-- =====================================================
-- MIGRACIÓN 031: Panel de configuración global
-- 1) RLS en etapas (leer todos, escribir solo admins)
-- 2) Seguimientos.etapa sin límite 1-5 (CRUD libre de etapas)
-- 3) Tabla configuracion (fila única) con switches por sección
-- =====================================================

-- 1. RLS en etapas
alter table etapas enable row level security;

create policy "Todos pueden leer etapas"
  on etapas for select using (true);

create policy "Admins gestionan etapas"
  on etapas for all using (public.is_admin()) with check (public.is_admin());

-- 2. Seguimientos: eliminar el límite de etapas (1-5)
alter table seguimientos drop constraint if exists seguimientos_etapa_check;

-- 3. Tabla de configuración global (una sola fila, id = 1)
create table if not exists configuracion (
  id integer primary key default 1 check (id = 1),
  seguimiento jsonb not null default '{}',
  personal jsonb not null default '{}',
  updated_at timestamptz default now()
);

alter table configuracion enable row level security;

create policy "Todos pueden leer configuracion"
  on configuracion for select using (true);

create policy "Admins gestionan configuracion"
  on configuracion for all using (public.is_admin()) with check (public.is_admin());

-- Trigger updated_at
create trigger update_configuracion_updated_at
  before update on configuracion for each row execute function update_updated_at();

-- 4. Seed con todo visible por defecto
insert into configuracion (id, seguimiento, personal)
values (
  1,
  '{
    "ficha_personal": true,
    "resumen": true,
    "evaluacion": true,
    "objetivos": true,
    "encuentros": true,
    "historial": true,
    "observaciones": true,
    "campos_evaluacion": {
      "relacion_dios": true,
      "habitos_pecaminosos": true,
      "don_espiritual": true,
      "ministerio": true,
      "relacion_autoridad": true,
      "estudia": true,
      "trabaja": true,
      "convive_con": true
    }
  }'::jsonb,
  '{
    "edad": true,
    "sexo": true,
    "telefono": true,
    "email": true,
    "direccion": true,
    "ministerio": true,
    "dones": true,
    "fecha_conversion": true,
    "fecha_bautismo": true,
    "observaciones": true
  }'::jsonb
)
on conflict (id) do nothing;
