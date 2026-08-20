-- =====================================================
-- MIGRACIÓN 056: Estudios Bíblicos interactivos
-- Respuestas de miembros y progreso en estudios.
-- =====================================================

-- 1. RESPUESTAS (una por miembro + estudio + pregunta)
create table if not exists estudios_biblicos_respuestas (
  id uuid primary key default gen_random_uuid(),
  miembro_id uuid not null references miembros(id) on delete cascade,
  estudio_numero integer not null,
  pregunta_index integer not null,
  respuesta text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint estudios_respuesta_unique unique (miembro_id, estudio_numero, pregunta_index)
);

-- 2. PROGRESO (un registro por miembro + estudio)
create table if not exists estudios_biblicos_progreso (
  id uuid primary key default gen_random_uuid(),
  miembro_id uuid not null references miembros(id) on delete cascade,
  estudio_numero integer not null,
  completado boolean not null default false,
  completado_en timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint estudios_progreso_unique unique (miembro_id, estudio_numero)
);

-- 3. RLS
alter table estudios_biblicos_respuestas enable row level security;
alter table estudios_biblicos_progreso enable row level security;

-- Miembros: solo ven y gestionan sus propias respuestas
create policy "Miembros gestionan sus propias respuestas"
  on estudios_biblicos_respuestas for all
  using (
    exists (
      select 1 from miembros
      where miembros.id = estudios_biblicos_respuestas.miembro_id
        and miembros.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from miembros
      where miembros.id = estudios_biblicos_respuestas.miembro_id
        and miembros.user_id = auth.uid()
    )
  );

create policy "Miembros gestionan su propio progreso"
  on estudios_biblicos_progreso for all
  using (
    exists (
      select 1 from miembros
      where miembros.id = estudios_biblicos_progreso.miembro_id
        and miembros.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from miembros
      where miembros.id = estudios_biblicos_progreso.miembro_id
        and miembros.user_id = auth.uid()
    )
  );

-- Discipuladores: ven respuestas/progreso de sus miembros
create policy "Discipuladores ven respuestas de sus miembros"
  on estudios_biblicos_respuestas for select
  using (
    exists (
      select 1 from miembros
      where miembros.id = estudios_biblicos_respuestas.miembro_id
        and miembros.lider_id = auth.uid()
    )
  );

create policy "Discipuladores ven progreso de sus miembros"
  on estudios_biblicos_progreso for select
  using (
    exists (
      select 1 from miembros
      where miembros.id = estudios_biblicos_progreso.miembro_id
        and miembros.lider_id = auth.uid()
    )
  );

-- Admins: acceso total
create policy "Admins acceso total a respuestas"
  on estudios_biblicos_respuestas for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins acceso total a progreso"
  on estudios_biblicos_progreso for all
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Triggers updated_at
create trigger update_estudios_biblicos_respuestas_updated_at
  before update on estudios_biblicos_respuestas
  for each row execute function update_updated_at();

create trigger update_estudios_biblicos_progreso_updated_at
  before update on estudios_biblicos_progreso
  for each row execute function update_updated_at();
