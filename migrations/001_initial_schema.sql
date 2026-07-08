-- =====================================================
-- MIGRACIÓN INICIAL: CRM de Discipulado
-- =====================================================

-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";

-- 2. TABLA DE ETAPAS (maestra)
create table if not exists etapas (
  id serial primary key,
  nombre text not null,
  descripcion text,
  orden integer not null default 0,
  objetivos jsonb default '[]',
  material_recomendado text,
  created_at timestamptz default now()
);

-- 3. TABLA DE PERFILES (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nombre text not null default '',
  apellido text not null default '',
  rol text not null default 'discipulo' check (rol in ('admin', 'discipulo')),
  telefono text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. TABLA DE DISCÍPULOS
create table if not exists discipulos (
  id uuid primary key default uuid_generate_v4(),
  lider_id uuid not null references profiles(id),
  apellido text not null,
  nombre text not null,
  dni text,
  fecha_nacimiento date,
  sexo text check (sexo in ('M', 'F')),
  telefono text,
  email text,
  direccion text,
  fecha_conversion date,
  fecha_bautismo date,
  etapa_id integer not null references etapas(id) default 1,
  estado text not null default 'activo' check (estado in ('activo', 'pausado', 'completado', 'retirado')),
  ministerio text,
  dones text,
  observaciones text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. TABLA DE ENCUENTROS
create table if not exists encuentros (
  id uuid primary key default uuid_generate_v4(),
  discipulo_id uuid not null references discipulos(id) on delete cascade,
  lider_id uuid not null references profiles(id),
  fecha date not null,
  hora time,
  lugar text,
  tema_tratado text not null,
  material_utilizado text,
  compromisos text,
  notas text,
  proximo_encuentro timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. TABLA DE ORACIÓN
create table if not exists oraciones (
  id uuid primary key default uuid_generate_v4(),
  discipulo_id uuid not null references discipulos(id) on delete cascade,
  lider_id uuid not null references profiles(id),
  fecha date not null default current_date,
  pedido text not null,
  respuesta text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'respondida', 'en_oracion')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. TABLA DE MATERIALES
create table if not exists materiales (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  tipo text not null check (tipo in ('libro', 'pdf', 'video', 'audio', 'link', 'nota')),
  descripcion text,
  url text,
  etapa_id integer references etapas(id),
  creado_por uuid not null references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. TABLA DE TAREAS
create table if not exists tareas (
  id uuid primary key default uuid_generate_v4(),
  discipulo_id uuid not null references discipulos(id) on delete cascade,
  lider_id uuid not null references profiles(id),
  titulo text not null,
  descripcion text,
  tipo text not null check (tipo in ('lectura', 'memorizacion', 'preguntas', 'practica')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'completada', 'vencida')),
  fecha_limite date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. TABLA DE LÍNEA DE TIEMPO
create table if not exists timeline (
  id uuid primary key default uuid_generate_v4(),
  discipulo_id uuid not null references discipulos(id) on delete cascade,
  tipo text not null,
  descripcion text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- 10. TABLA DE CONFIRMACIÓN DE ASISTENCIA
create table if not exists asistencia (
  id uuid primary key default uuid_generate_v4(),
  encuentro_id uuid not null references encuentros(id) on delete cascade,
  discipulo_id uuid not null references discipulos(id) on delete cascade,
  confirmado boolean default false,
  created_at timestamptz default now(),
  unique(encuentro_id, discipulo_id)
);

-- 11. TRIGGER: actualizar updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles for each row execute function update_updated_at();

create trigger update_discipulos_updated_at
  before update on discipulos for each row execute function update_updated_at();

create trigger update_encuentros_updated_at
  before update on encuentros for each row execute function update_updated_at();

create trigger update_oraciones_updated_at
  before update on oraciones for each row execute function update_updated_at();

create trigger update_materiales_updated_at
  before update on materiales for each row execute function update_updated_at();

create trigger update_tareas_updated_at
  before update on tareas for each row execute function update_updated_at();

-- 12. SEED: Etapas iniciales
insert into etapas (id, nombre, descripcion, orden, objetivos, material_recomendado) values
  (1, 'Nueva Vida en Cristo', 'Fundamentos de la fe cristiana para nuevos creyentes', 1,
   '["Entender la salvación por gracia", "Establecer una vida de oración", "Comenzar a leer la Biblia", "Entender el bautismo"]'::jsonb,
   'Nueva Vida en Cristo - Material de discipulado'),
  (2, 'Consolidación', 'Afirmando las bases de la fe y la vida cristiana', 2,
   '["Desarrollar una vida de devocional consistente", "Entender la importancia de la iglesia local", "Aprender sobre los dones espirituales", "Comenzar a servir"]'::jsonb,
   'Consolidación - Material de discipulado'),
  (3, 'Carácter', 'Desarrollando el carácter de Cristo', 3,
   '["Estudio del fruto del Espíritu", "Vida de integridad", "Relaciones saludables", "Mayordomía"]'::jsonb,
   'Carácter - Material de discipulado'),
  (4, 'Servicio', 'Preparándose para servir y hacer discípulos', 4,
   '["Identificar el llamado", "Desarrollar liderazgo", "Aprender a discipular a otros", "Multiplicación"]'::jsonb,
   'Servicio - Material de discipulado')
on conflict (id) do nothing;

-- 13. ROW LEVEL SECURITY

-- Profiles
alter table profiles enable row level security;

create policy "Usuarios pueden ver su propio perfil"
  on profiles for select using (auth.uid() = id);

create policy "Admins pueden ver todos los perfiles"
  on profiles for select using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
  );

create policy "Usuarios pueden actualizar su propio perfil"
  on profiles for update using (auth.uid() = id);

-- Discípulos
alter table discipulos enable row level security;

create policy "Admins/líderes pueden ver todos los discípulos"
  on discipulos for select using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
    or lider_id = auth.uid()
  );

create policy "Discípulos pueden ver su propio registro"
  on discipulos for select using (id::text = auth.uid()::text);

create policy "Admins/líderes pueden insertar discípulos"
  on discipulos for insert with check (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
  );

create policy "Admins/líderes pueden actualizar discípulos"
  on discipulos for update using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
    or lider_id = auth.uid()
  );

create policy "Admins pueden eliminar discípulos"
  on discipulos for delete using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
  );

-- Encuentros
alter table encuentros enable row level security;

create policy "Admins/líderes pueden gestionar encuentros"
  on encuentros for all using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
    or lider_id = auth.uid()
  );

create policy "Discípulos pueden ver sus encuentros"
  on encuentros for select using (
    exists (select 1 from discipulos where id = encuentros.discipulo_id and id::text = auth.uid()::text)
  );

-- Oraciones
alter table oraciones enable row level security;

create policy "Admins/líderes pueden gestionar oraciones"
  on oraciones for all using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
    or lider_id = auth.uid()
  );

create policy "Discípulos pueden ver sus oraciones"
  on oraciones for select using (
    exists (select 1 from discipulos where id = oraciones.discipulo_id and id::text = auth.uid()::text)
  );

-- Materiales
alter table materiales enable row level security;

create policy "Todos pueden ver materiales"
  on materiales for select using (true);

create policy "Admins pueden gestionar materiales"
  on materiales for all using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
  );

-- Tareas
alter table tareas enable row level security;

create policy "Admins/líderes pueden gestionar tareas"
  on tareas for all using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
    or lider_id = auth.uid()
  );

create policy "Discípulos pueden ver sus tareas"
  on tareas for select using (
    exists (select 1 from discipulos where id = tareas.discipulo_id and id::text = auth.uid()::text)
  );

-- Timeline
alter table timeline enable row level security;

create policy "Admins/líderes pueden gestionar timeline"
  on timeline for all using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
    or exists (select 1 from discipulos where discipulos.id = timeline.discipulo_id and discipulos.lider_id = auth.uid())
  );

create policy "Discípulos pueden ver su timeline"
  on timeline for select using (
    exists (select 1 from discipulos where discipulos.id = timeline.discipulo_id and discipulos.id::text = auth.uid()::text)
  );

-- Asistencia
alter table asistencia enable row level security;

create policy "Admins/líderes pueden gestionar asistencia"
  on asistencia for all using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
    or exists (select 1 from encuentros where encuentros.id = asistencia.encuentro_id and encuentros.lider_id = auth.uid())
  );

create policy "Discípulos pueden gestionar su asistencia"
  on asistencia for all using (
    exists (select 1 from discipulos where discipulos.id = asistencia.discipulo_id and discipulos.id::text = auth.uid()::text)
  );
