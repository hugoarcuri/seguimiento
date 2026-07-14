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
  (3, 'comunion_dios', 'Tiene hambre de Dios', 32),
  (3, 'comunion_dios', 'Busca a Dios en oración', 33),
  (3, 'comunion_dios', 'La Palabra transforma su vida', 34),
  (3, 'comunion_dios', 'Ayuna con propósito', 35),
  (3, 'comunion_dios', 'Adora en espíritu y verdad', 36),
  (3, 'comunion_iglesia', 'Se relaciona con madurez', 37),
  (3, 'comunion_iglesia', 'Aporta a la comunidad', 38),
  (3, 'comunion_iglesia', 'Es ejemplo en la congregación', 39),
  (3, 'comunion_iglesia', 'Acepta autoridad espiritual', 40),
  (3, 'caracter', 'Acepta corrección', 41),
  (3, 'caracter', 'Reconoce sus errores', 42),
  (3, 'caracter', 'Pide perdón', 43),
  (3, 'caracter', 'Lucha contra el pecado', 44),
  (3, 'caracter', 'Tiene pureza sexual', 45),
  (3, 'caracter', 'Controla su lengua', 46),
  (3, 'caracter', 'Es íntegro', 47),
  (3, 'caracter', 'Manifiesta amor', 48),
  (3, 'caracter', 'Manifiesta gozo', 49),
  (3, 'caracter', 'Manifiesta paz', 50),
  (3, 'caracter', 'Manifiesta paciencia', 51),
  (3, 'caracter', 'Manifiesta bondad', 52),
  (3, 'caracter', 'Manifiesta fe', 53),
  (3, 'caracter', 'Manifiesta mansedumbre', 54),
  (3, 'caracter', 'Manifiesta dominio propio', 55),
  (3, 'mision', 'Evangeliza regularmente', 56),
  (3, 'mision', 'Sirve en un ministerio', 57),
  (3, 'mision', 'Testifica a otros', 58),
  (3, 'mision', 'Ayuda a nuevos creyentes', 59);

-- Nivel 4: Compromiso
insert into seguimiento_indicadores_def (etapa_id, area, indicador, orden) values
  (4, 'comunion_dios', 'Vive en la presencia de Dios', 60),
  (4, 'comunion_dios', 'Es sensible al Espíritu Santo', 61),
  (4, 'comunion_dios', 'Discierne la voluntad de Dios', 62),
  (4, 'comunion_dios', 'Intercede por otros', 63),
  (4, 'comunion_iglesia', 'Lidera con humildad', 64),
  (4, 'comunion_iglesia', 'Mentorea a otros líderes', 65),
  (4, 'comunion_iglesia', 'Es referente espiritual', 66),
  (4, 'comunion_iglesia', 'Resuelve conflictos bíblicamente', 67),
  (4, 'caracter', 'Da ejemplo', 68),
  (4, 'caracter', 'Es confiable', 69),
  (4, 'caracter', 'Forma otros líderes', 70),
  (4, 'caracter', 'Es íntegro en todo', 71),
  (4, 'mision', 'Tiene un ministerio', 72),
  (4, 'mision', 'Sirve regularmente', 73),
  (4, 'mision', 'Es responsable', 74),
  (4, 'mision', 'Cumple compromisos', 75),
  (4, 'mision', 'Comparte el evangelio', 76),
  (4, 'mision', 'Ora por inconversos', 77),
  (4, 'mision', 'Tiene lista de personas para evangelizar', 78),
  (4, 'mision', 'Invita personas a la iglesia', 79),
  (4, 'mision', 'Discipula a alguien', 80),
  (4, 'mision', 'Da seguimiento', 81),
  (4, 'mision', 'Enseña la Biblia', 82),
  (4, 'mision', 'Forma nuevos discípulos', 83);
