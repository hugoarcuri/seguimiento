-- Fix FK: acompanamiento_evangelistico.discipulo_id debe referenciar discipulos(id), no profiles(id)
alter table acompanamiento_evangelistico
  drop constraint if exists acompanamiento_evangelistico_discipulo_id_fkey;

alter table acompanamiento_evangelistico
  alter column discipulo_id drop not null;

alter table acompanamiento_evangelistico
  add constraint acompanamiento_evangelistico_discipulo_id_fkey
  foreign key (discipulo_id) references discipulos(id) on delete cascade;
