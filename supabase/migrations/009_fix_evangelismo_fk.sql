-- Fix foreign key: discipulo_id should reference profiles, not discipulos
-- Allow null when no specific discipulo is assigned

alter table acompanamiento_evangelistico
  drop constraint if exists acompanamiento_evangelistico_discipulo_id_fkey;

alter table acompanamiento_evangelistico
  alter column discipulo_id drop not null;

alter table acompanamiento_evangelistico
  add constraint acompanamiento_evangelistico_discipulo_id_fkey
  foreign key (discipulo_id) references profiles(id) on delete cascade;
