-- =====================================================
-- MIGRACIÓN: Sistema de Seguimiento Espiritual
-- =====================================================

-- 1. DEFINICIÓN DE INDICADORES
create table if not exists seguimiento_indicadores_def (
  id serial primary key,
  etapa_id integer not null references etapas(id),
  area text not null check (area in ('comunion_dios', 'comunion_iglesia', 'caracter', 'mision')),
  indicador text not null,
  orden integer not null default 0
);

-- 2. EVALUACIONES (resultados por indicador)
create table if not exists seguimiento_evaluaciones (
  id uuid primary key default gen_random_uuid(),
  discipulo_id uuid not null references discipulos(id) on delete cascade,
  lider_id uuid not null references profiles(id),
  indicador_def_id integer not null references seguimiento_indicadores_def(id),
  valor integer not null check (valor >= 0 and valor <= 4),
  fecha date not null default current_date,
  created_at timestamptz default now(),
  unique (discipulo_id, indicador_def_id, fecha)
);

-- 3. HISTORIAL PASTORAL
create table if not exists seguimiento_historial (
  id uuid primary key default gen_random_uuid(),
  discipulo_id uuid not null references discipulos(id) on delete cascade,
  lider_id uuid not null references profiles(id),
  contenido text not null,
  fecha date not null default current_date,
  created_at timestamptz default now()
);

-- 4. RLS
alter table seguimiento_indicadores_def enable row level security;
alter table seguimiento_evaluaciones enable row level security;
alter table seguimiento_historial enable row level security;

-- Todos pueden ver definiciones
create policy "Todos pueden ver definiciones"
  on seguimiento_indicadores_def for select
  using (true);

-- Admins/lideres pueden gestionar definiciones
create policy "Admins pueden gestionar definiciones"
  on seguimiento_indicadores_def for all
  using (public.is_admin())
  with check (public.is_admin());

-- Evaluaciones: admins/lideres ven todas, discipulos ven las suyas
create policy "Admins/lideres pueden gestionar evaluaciones"
  on seguimiento_evaluaciones for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and rol = 'admin'
    )
    or exists (
      select 1 from discipulos
      where id = seguimiento_evaluaciones.discipulo_id and lider_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and rol = 'admin'
    )
    or exists (
      select 1 from discipulos
      where id = seguimiento_evaluaciones.discipulo_id and lider_id = auth.uid()
    )
  );

create policy "Discipulos pueden ver sus evaluaciones"
  on seguimiento_evaluaciones for select
  using (discipulo_id = auth.uid());

-- Historial: mismas reglas
create policy "Admins/lideres pueden gestionar historial"
  on seguimiento_historial for all
  using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
    or exists (select 1 from discipulos where id = seguimiento_historial.discipulo_id and lider_id = auth.uid())
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
    or exists (select 1 from discipulos where id = seguimiento_historial.discipulo_id and lider_id = auth.uid())
  );

create policy "Discipulos pueden ver su historial"
  on seguimiento_historial for select
  using (discipulo_id = auth.uid());

-- 5. SEED DATA: INDICADORES POR ETAPA
-- Nivel 1: Nuevos Comienzos
insert into seguimiento_indicadores_def (etapa_id, area, indicador, orden) values
  (1, 'comunion_dios', 'Está seguro de su salvación', 1),
  (1, 'comunion_dios', 'Tiene Biblia', 2),
  (1, 'comunion_dios', 'Lee la Biblia', 3),
  (1, 'comunion_dios', 'Ora diariamente', 4),
  (1, 'comunion_dios', 'Comprende el evangelio', 5),
  (1, 'comunion_dios', 'Tiene tiempo devocional', 6),
  (1, 'comunion_iglesia', 'Asiste a la iglesia', 7),
  (1, 'comunion_iglesia', 'Asiste al grupo pequeño', 8),
  (1, 'comunion_iglesia', 'Conoce personas de la iglesia', 9),
  (1, 'comunion_iglesia', 'Tiene un líder', 10),
  (1, 'caracter', 'Abandonó prácticas incompatibles con la fe', 11),
  (1, 'caracter', 'Desea obedecer a Cristo', 12),
  (1, 'caracter', 'Habla de su conversión', 13),
  (1, 'mision', 'Tiene deseo de servir', 14),
  (1, 'mision', 'Participó en alguna actividad', 15);

-- Nivel 2: Crecimiento
insert into seguimiento_indicadores_def (etapa_id, area, indicador, orden) values
  (2, 'comunion_dios', 'Lee la Biblia 5 o más días por semana', 16),
  (2, 'comunion_dios', 'Tiene plan de lectura', 17),
  (2, 'comunion_dios', 'Memoriza versículos', 18),
  (2, 'comunion_dios', 'Mantiene oración constante', 19),
  (2, 'comunion_iglesia', 'Perdona a quienes le ofenden', 20),
  (2, 'comunion_iglesia', 'Busca reconciliación', 21),
  (2, 'comunion_iglesia', 'Confiesa sus pecados', 22),
  (2, 'comunion_iglesia', 'Aprende doctrina', 23),
  (2, 'caracter', 'Es puntual', 24),
  (2, 'caracter', 'Es constante', 25),
  (2, 'caracter', 'Participa en reuniones', 26),
  (2, 'caracter', 'Tiene amistades cristianas', 27),
  (2, 'mision', 'Evangelizó', 28),
  (2, 'mision', 'Visitó a alguien', 29),
  (2, 'mision', 'Sirvió en un ministerio', 30),
  (2, 'mision', 'Ayudó a otro creyente', 31);

-- Nivel 3: Carácter
insert into seguimiento_indicadores_def (etapa_id, area, indicador, orden) values
  (3, 'caracter', 'Acepta corrección', 32),
  (3, 'caracter', 'Reconoce sus errores', 33),
  (3, 'caracter', 'Pide perdón', 34),
  (3, 'caracter', 'Lucha contra el pecado', 35),
  (3, 'caracter', 'Tiene pureza sexual', 36),
  (3, 'caracter', 'Controla su lengua', 37),
  (3, 'caracter', 'Es íntegro', 38),
  (3, 'caracter', 'Manifiesta amor', 39),
  (3, 'caracter', 'Manifiesta gozo', 40),
  (3, 'caracter', 'Manifiesta paz', 41),
  (3, 'caracter', 'Manifiesta paciencia', 42),
  (3, 'caracter', 'Manifiesta bondad', 43),
  (3, 'caracter', 'Manifiesta fe', 44),
  (3, 'caracter', 'Manifiesta mansedumbre', 45),
  (3, 'caracter', 'Manifiesta dominio propio', 46);

-- Nivel 4: Compromiso
insert into seguimiento_indicadores_def (etapa_id, area, indicador, orden) values
  (4, 'mision', 'Tiene un ministerio', 47),
  (4, 'mision', 'Sirve regularmente', 48),
  (4, 'mision', 'Es responsable', 49),
  (4, 'mision', 'Cumple compromisos', 50),
  (4, 'mision', 'Comparte el evangelio', 51),
  (4, 'mision', 'Ora por inconversos', 52),
  (4, 'mision', 'Tiene lista de personas para evangelizar', 53),
  (4, 'mision', 'Invita personas a la iglesia', 54),
  (4, 'mision', 'Discipula a alguien', 55),
  (4, 'mision', 'Da seguimiento', 56),
  (4, 'mision', 'Enseña la Biblia', 57),
  (4, 'mision', 'Forma nuevos discípulos', 58),
  (4, 'caracter', 'Da ejemplo', 59),
  (4, 'caracter', 'Es confiable', 60),
  (4, 'caracter', 'Resuelve conflictos bíblicamente', 61),
  (4, 'caracter', 'Forma otros líderes', 62);
