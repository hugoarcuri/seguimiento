-- =====================================================
-- MIGRACIÓN 008: Acompañamiento Evangelístico
-- =====================================================

create table if not exists acompanamiento_evangelistico (
  id uuid primary key default gen_random_uuid(),
  discipulo_id uuid references profiles(id) on delete cascade,
  creado_por uuid not null references profiles(id),
  nombre text not null,
  apellido text not null,
  telefono text,
  edad integer,
  observaciones text,
  estado text not null default 'oracion' check (estado in ('oracion', 'servicio', 'evangelismo', 'completado')),
  fecha_creacion date not null default current_date,
  fecha_inicio_estado date not null default current_date,
  created_at timestamptz default now()
);

create table if not exists eventos_evangelismo (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references acompanamiento_evangelistico(id) on delete cascade,
  tipo text not null check (tipo in ('cambio_estado', 'acto_servicio', 'evento_evangelismo', 'observacion')),
  descripcion text not null,
  fecha date not null default current_date,
  created_at timestamptz default now()
);

alter table acompanamiento_evangelistico enable row level security;
alter table eventos_evangelismo enable row level security;

create policy "Admins/líderes gestionan acompañamiento"
  on acompanamiento_evangelistico for all
  using (public.is_admin() or creado_por = auth.uid())
  with check (public.is_admin() or creado_por = auth.uid());

create policy "Discípulos ven su acompañamiento"
  on acompanamiento_evangelistico for select
  using (discipulo_id = auth.uid());

create policy "Admins/líderes gestionan eventos"
  on eventos_evangelismo for all
  using (
    exists (select 1 from acompanamiento_evangelistico where id = eventos_evangelismo.persona_id and (public.is_admin() or creado_por = auth.uid()))
  )
  with check (
    exists (select 1 from acompanamiento_evangelistico where id = eventos_evangelismo.persona_id and (public.is_admin() or creado_por = auth.uid()))
  );

create policy "Discípulos ven eventos de su acompañamiento"
  on eventos_evangelismo for select
  using (exists (select 1 from acompanamiento_evangelistico where id = eventos_evangelismo.persona_id and discipulo_id = auth.uid()));
