-- 009: Fix FK in acompanamiento_evangelistico
alter table acompanamiento_evangelistico
  drop constraint if exists acompanamiento_evangelistico_discipulo_id_fkey;

alter table acompanamiento_evangelistico
  alter column discipulo_id drop not null;

alter table acompanamiento_evangelistico
  add constraint acompanamiento_evangelistico_discipulo_id_fkey
  foreign key (discipulo_id) references profiles(id) on delete cascade;

-- 010: Table for personas por las que ora
create table if not exists personas_oracion (
  id uuid primary key default gen_random_uuid(),
  discipulo_id uuid not null references discipulos(id) on delete cascade,
  nombre text not null,
  apellido text not null,
  estado text not null default 'Oración' check (estado in ('Oración', 'Oración y servicio', 'Oración y predicación')),
  activo boolean default true,
  created_at timestamptz default now()
);

alter table personas_oracion enable row level security;

create policy "Admins gestionan personas_oracion"
  on personas_oracion for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Discípulos ven sus personas_oracion"
  on personas_oracion for select
  using (discipulo_id = auth.uid());
