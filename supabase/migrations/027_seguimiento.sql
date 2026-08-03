-- =====================================================
-- MIGRACIÓN 027: Nueva sección "Seguimiento"
-- Ficha de crecimiento espiritual por discípulo con 5 etapas.
-- =====================================================

-- 1. SEGUIMIENTOS (uno por discípulo, un solo activo)
create table if not exists seguimientos (
  id uuid primary key default gen_random_uuid(),
  discipulo_id uuid not null references discipulos(id) on delete cascade,
  discipulador_id uuid not null references profiles(id),
  etapa integer not null default 1 check (etapa between 1 and 5),
  progreso integer not null default 0 check (progreso >= 0 and progreso <= 100),
  estado text not null default 'activo' check (estado in ('activo', 'pausado')),
  fecha_inicio date not null default current_date,
  ultima_actualizacion timestamptz not null default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Un discípulo solo puede tener UN seguimiento activo
create unique index if not exists seguimientos_discipulo_activo_unique
  on seguimientos (discipulo_id) where estado = 'activo';

-- 2. EVALUACIONES (una fila por seguimiento; 8 áreas escala 0-2)
create table if not exists seguimiento_evaluaciones (
  id uuid primary key default gen_random_uuid(),
  seguimiento_id uuid not null references seguimientos(id) on delete cascade,
  fecha date not null default current_date,
  vida_devocional integer check (vida_devocional is null or vida_devocional between 0 and 2),
  oracion integer check (oracion is null or oracion between 0 and 2),
  lectura_biblica integer check (lectura_biblica is null or lectura_biblica between 0 and 2),
  comunion integer check (comunion is null or comunion between 0 and 2),
  caracter integer check (caracter is null or caracter between 0 and 2),
  servicio integer check (servicio is null or servicio between 0 and 2),
  evangelismo integer check (evangelismo is null or evangelismo between 0 and 2),
  discipulado integer check (discipulado is null or discipulado between 0 and 2),
  created_at timestamptz default now(),
  unique (seguimiento_id)
);

-- 3. OBJETIVOS
create table if not exists seguimiento_objetivos (
  id uuid primary key default gen_random_uuid(),
  seguimiento_id uuid not null references seguimientos(id) on delete cascade,
  descripcion text not null,
  completado boolean not null default false,
  fecha_cumplimiento date,
  created_at timestamptz default now()
);

-- 4. OBSERVACIONES (no se sobrescriben: se agregan)
create table if not exists seguimiento_observaciones (
  id uuid primary key default gen_random_uuid(),
  seguimiento_id uuid not null references seguimientos(id) on delete cascade,
  usuario uuid not null references profiles(id),
  fecha timestamptz not null default now(),
  comentario text not null
);

-- 5. HISTORIAL (cambios de etapa, evaluaciones, comentarios, objetivos)
create table if not exists seguimiento_historial (
  id uuid primary key default gen_random_uuid(),
  seguimiento_id uuid not null references seguimientos(id) on delete cascade,
  fecha timestamptz not null default now(),
  tipo text not null check (tipo in ('etapa', 'evaluacion', 'objetivo', 'observacion')),
  descripcion text not null
);

-- 6. RLS
alter table seguimientos enable row level security;
alter table seguimiento_evaluaciones enable row level security;
alter table seguimiento_objetivos enable row level security;
alter table seguimiento_observaciones enable row level security;
alter table seguimiento_historial enable row level security;

-- Admins y el discipulador gestionan el seguimiento
create policy "Admins/discipulador gestionan seguimientos"
  on seguimientos for all
  using (public.is_admin() or discipulador_id = auth.uid())
  with check (public.is_admin() or discipulador_id = auth.uid());

create policy "Admins/discipulador gestionan evaluaciones"
  on seguimiento_evaluaciones for all
  using (exists (select 1 from seguimientos where seguimientos.id = seguimiento_evaluaciones.seguimiento_id and (public.is_admin() or discipulador_id = auth.uid())))
  with check (exists (select 1 from seguimientos where seguimientos.id = seguimiento_evaluaciones.seguimiento_id and (public.is_admin() or discipulador_id = auth.uid())));

create policy "Admins/discipulador gestionan objetivos"
  on seguimiento_objetivos for all
  using (exists (select 1 from seguimientos where seguimientos.id = seguimiento_objetivos.seguimiento_id and (public.is_admin() or discipulador_id = auth.uid())))
  with check (exists (select 1 from seguimientos where seguimientos.id = seguimiento_objetivos.seguimiento_id and (public.is_admin() or discipulador_id = auth.uid())));

create policy "Admins/discipulador gestionan observaciones"
  on seguimiento_observaciones for all
  using (exists (select 1 from seguimientos where seguimientos.id = seguimiento_observaciones.seguimiento_id and (public.is_admin() or discipulador_id = auth.uid())))
  with check (exists (select 1 from seguimientos where seguimientos.id = seguimiento_observaciones.seguimiento_id and (public.is_admin() or discipulador_id = auth.uid())));

create policy "Admins/discipulador gestionan historial"
  on seguimiento_historial for all
  using (exists (select 1 from seguimientos where seguimientos.id = seguimiento_historial.seguimiento_id and (public.is_admin() or discipulador_id = auth.uid())))
  with check (exists (select 1 from seguimientos where seguimientos.id = seguimiento_historial.seguimiento_id and (public.is_admin() or discipulador_id = auth.uid())));

-- 7. Trigger updated_at
create trigger update_seguimientos_updated_at
  before update on seguimientos for each row execute function update_updated_at();