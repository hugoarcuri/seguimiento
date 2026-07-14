-- =====================================================
-- MIGRACIÓN 007: Rediseño completo del módulo Seguimiento
-- =====================================================

-- 1. ELIMINAR TABLAS VIEJAS
drop table if exists seguimiento_historial cascade;
drop table if exists seguimiento_evaluaciones cascade;
drop table if exists seguimiento_indicadores_def cascade;

-- 2. ÁREAS FIJAS DE EVALUACIÓN
create table if not exists areas (
  id serial primary key,
  nombre text not null,
  descripcion text,
  icono text,
  orden integer not null default 0,
  activo boolean default true,
  created_at timestamptz default now()
);

-- 3. INDICADORES (independientes del nivel)
create table if not exists indicadores (
  id serial primary key,
  area_id integer not null references areas(id) on delete cascade,
  nombre text not null,
  descripcion text,
  orden integer not null default 0,
  activo boolean default true,
  created_at timestamptz default now()
);

-- 4. OBJETIVOS POR NIVEL (expectativa para cada indicador según la etapa)
create table if not exists indicador_nivel (
  id serial primary key,
  indicador_id integer not null references indicadores(id) on delete cascade,
  nivel_id integer not null references etapas(id),
  objetivo text not null,
  unique (indicador_id, nivel_id)
);

-- 5. REUNIONES DE DISCIPULADO
create table if not exists reuniones (
  id uuid primary key default gen_random_uuid(),
  discipulo_id uuid not null references discipulos(id) on delete cascade,
  lider_id uuid not null references profiles(id),
  fecha date not null default current_date,
  lugar text,
  duracion_minutos integer,
  tema_tratado text,
  observaciones_generales text,
  compromisos text,
  pedidos_oracion text,
  respuestas_oracion text,
  proxima_reunion date,
  created_at timestamptz default now()
);

-- 6. EVALUACIONES POR REUNIÓN
-- Cada evaluación vincula un indicador con un valor en una reunión específica.
-- Si no fue evaluado, valor = null y no_evaluado = true.
create table if not exists evaluaciones (
  id uuid primary key default gen_random_uuid(),
  reunion_id uuid not null references reuniones(id) on delete cascade,
  indicador_id integer not null references indicadores(id),
  valor integer check (valor >= 0 and valor <= 5),
  no_evaluado boolean default false,
  observaciones text,
  unique (reunion_id, indicador_id)
);

-- 7. OBSERVACIONES PASTORALES (percepción cualitativa por reunión)
create table if not exists observaciones_pastorales (
  id uuid primary key default gen_random_uuid(),
  reunion_id uuid not null references reuniones(id) on delete cascade,
  animo_espiritual text,
  evidencias_crecimiento text,
  luchas_desafios text,
  fortalezas text,
  enfoque_proximo text,
  unique (reunion_id)
);

-- 8. DESAFÍOS
create table if not exists desafios (
  id uuid primary key default gen_random_uuid(),
  discipulo_id uuid not null references discipulos(id) on delete cascade,
  lider_id uuid not null references profiles(id),
  reunion_id uuid references reuniones(id) on delete set null,
  descripcion text not null,
  fecha_asignado date not null default current_date,
  fecha_vencimiento date,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_proceso', 'completado', 'no_realizado')),
  created_at timestamptz default now()
);

-- 9. ALERTAS INTELIGENTES
create table if not exists alertas (
  id uuid primary key default gen_random_uuid(),
  discipulo_id uuid not null references discipulos(id) on delete cascade,
  tipo text not null,
  mensaje text not null,
  activa boolean default true,
  created_at timestamptz default now()
);

-- 10. RLS
alter table areas enable row level security;
alter table indicadores enable row level security;
alter table indicador_nivel enable row level security;
alter table reuniones enable row level security;
alter table evaluaciones enable row level security;
alter table observaciones_pastorales enable row level security;
alter table desafios enable row level security;
alter table alertas enable row level security;

-- Todos pueden ver áreas, indicadores y objetivos
create policy "Todos pueden ver áreas" on areas for select using (true);
create policy "Todos pueden ver indicadores" on indicadores for select using (true);
create policy "Todos pueden ver indicador_nivel" on indicador_nivel for select using (true);
create policy "Admins pueden gestionar áreas" on areas for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins pueden gestionar indicadores" on indicadores for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins pueden gestionar indicador_nivel" on indicador_nivel for all using (public.is_admin()) with check (public.is_admin());

-- Reuniones: admins y líderes pueden gestionar; discípulos ven las suyas
create policy "Admins/líderes pueden gestionar reuniones"
  on reuniones for all
  using (
    public.is_admin()
    or exists (select 1 from discipulos where id = reuniones.discipulo_id and lider_id = auth.uid())
  )
  with check (
    public.is_admin()
    or exists (select 1 from discipulos where id = reuniones.discipulo_id and lider_id = auth.uid())
  );

create policy "Discípulos ven sus reuniones"
  on reuniones for select
  using (discipulo_id = auth.uid());

-- Evaluaciones: mismas reglas que reuniones
create policy "Admins/líderes gestionan evaluaciones"
  on evaluaciones for all
  using (
    exists (select 1 from reuniones where id = evaluaciones.reunion_id and (
      public.is_admin()
      or exists (select 1 from discipulos where id = reuniones.discipulo_id and lider_id = auth.uid())
    ))
  )
  with check (
    exists (select 1 from reuniones where id = evaluaciones.reunion_id and (
      public.is_admin()
      or exists (select 1 from discipulos where id = reuniones.discipulo_id and lider_id = auth.uid())
    ))
  );

create policy "Discípulos ven evaluaciones de sus reuniones"
  on evaluaciones for select
  using (exists (select 1 from reuniones where id = evaluaciones.reunion_id and discipulo_id = auth.uid()));

-- Observaciones pastorales
create policy "Admins/líderes gestionan observaciones"
  on observaciones_pastorales for all
  using (
    exists (select 1 from reuniones where id = observaciones_pastorales.reunion_id and (
      public.is_admin()
      or exists (select 1 from discipulos where id = reuniones.discipulo_id and lider_id = auth.uid())
    ))
  )
  with check (
    exists (select 1 from reuniones where id = observaciones_pastorales.reunion_id and (
      public.is_admin()
      or exists (select 1 from discipulos where id = reuniones.discipulo_id and lider_id = auth.uid())
    ))
  );

create policy "Discípulos ven observaciones de sus reuniones"
  on observaciones_pastorales for select
  using (exists (select 1 from reuniones where id = observaciones_pastorales.reunion_id and discipulo_id = auth.uid()));

-- Desafíos
create policy "Admins/líderes gestionan desafíos"
  on desafios for all
  using (public.is_admin() or lider_id = auth.uid())
  with check (public.is_admin() or lider_id = auth.uid());

create policy "Discípulos ven sus desafíos"
  on desafios for select
  using (discipulo_id = auth.uid());

-- Alertas
create policy "Admins/líderes ven alertas de sus discípulos"
  on alertas for select
  using (
    public.is_admin()
    or exists (select 1 from discipulos where id = alertas.discipulo_id and lider_id = auth.uid())
  );

create policy "Discípulos ven sus alertas"
  on alertas for select
  using (discipulo_id = auth.uid());

-- 11. SEED: ÁREAS
insert into areas (id, nombre, descripcion, icono, orden) values
  (1, 'Vida Devocional', 'Disciplinas espirituales personales', 'Book', 1),
  (2, 'Relación con Dios', 'Intimidad y dependencia de Dios', 'Heart', 2),
  (3, 'Carácter Cristiano', 'Fruto del Espíritu y virtudes cristianas', 'Sparkles', 3),
  (4, 'Comunión', 'Vida en comunidad y pertenencia a la iglesia', 'Users', 4),
  (5, 'Servicio', 'Disposición y compromiso en el servicio', 'Hand', 5),
  (6, 'Evangelismo', 'Compartir el evangelio y testimonio', 'Target', 6),
  (7, 'Discipulado', 'Formación y multiplicación espiritual', 'GraduationCap', 7),
  (8, 'Liderazgo', 'Capacidad de influir y guiar a otros', 'Crown', 8);

-- 12. SEED: INDICADORES POR ÁREA

-- Área 1: Vida Devocional
insert into indicadores (id, area_id, nombre, descripcion, orden) values
  (1, 1, 'Oración', 'Comunión diaria con Dios mediante la oración', 1),
  (2, 1, 'Lectura bíblica', 'Lectura sistemática de la Biblia', 2),
  (3, 1, 'Tiempo devocional', 'Tiempo dedicado a buscar a Dios', 3),
  (4, 1, 'Memorización bíblica', 'Memorizar versículos y pasajes', 4),
  (5, 1, 'Meditación', 'Meditar en la Palabra de Dios', 5),
  (6, 1, 'Ayuno', 'Práctica del ayuno espiritual', 6);

-- Área 2: Relación con Dios
insert into indicadores (id, area_id, nombre, descripcion, orden) values
  (7, 2, 'Seguridad de salvación', 'Confianza en su salvación por gracia', 1),
  (8, 2, 'Dependencia de Dios', 'Reconoce su necesidad de Dios en todo', 2),
  (9, 2, 'Confesión de pecados', 'Practica la confesión y arrepentimiento', 3),
  (10, 2, 'Gratitud', 'Vive con un corazón agradecido', 4),
  (11, 2, 'Adoración', 'Adora a Dios en espíritu y verdad', 5),
  (12, 2, 'Fe', 'Confía en las promesas de Dios', 6);

-- Área 3: Carácter Cristiano
insert into indicadores (id, area_id, nombre, descripcion, orden) values
  (13, 3, 'Humildad', 'Reconoce sus limitaciones y depende de Dios', 1),
  (14, 3, 'Perdón', 'Perdona a quienes le ofenden', 2),
  (15, 3, 'Amor', 'Ama a Dios y al prójimo', 3),
  (16, 3, 'Dominio propio', 'Controla sus impulsos y emociones', 4),
  (17, 3, 'Honestidad', 'Vive con integridad y verdad', 5),
  (18, 3, 'Pureza', 'Mantiene pureza sexual y moral', 6),
  (19, 3, 'Obediencia', 'Obedecer a Dios y a las autoridades', 7),
  (20, 3, 'Paciencia', 'Espera en Dios y soporta las pruebas', 8),
  (21, 3, 'Mansedumbre', 'Responde con suavidad y control', 9),
  (22, 3, 'Responsabilidad', 'Cumple con sus compromisos', 10);

-- Área 4: Comunión
insert into indicadores (id, area_id, nombre, descripcion, orden) values
  (23, 4, 'Asistencia al culto', 'Asiste regularmente a los cultos', 1),
  (24, 4, 'Asistencia al grupo pequeño', 'Participa en célula o grupo de vida', 2),
  (25, 4, 'Participación', 'Participa activamente en las reuniones', 3),
  (26, 4, 'Relaciones sanas', 'Desarrolla relaciones saludables', 4),
  (27, 4, 'Sujeción pastoral', 'Reconoce y respeta la autoridad espiritual', 5),
  (28, 4, 'Integración con la iglesia', 'Se identifica y pertenece a la iglesia', 6);

-- Área 5: Servicio
insert into indicadores (id, area_id, nombre, descripcion, orden) values
  (29, 5, 'Participa en un ministerio', 'Sirve activamente en un área', 1),
  (30, 5, 'Puntualidad', 'Es puntual en sus compromisos', 2),
  (31, 5, 'Responsabilidad', 'Es responsable en sus tareas', 3),
  (32, 5, 'Disponibilidad', 'Está dispuesto a servir cuando se le necesita', 4),
  (33, 5, 'Fidelidad', 'Es fiel en las tareas asignadas', 5),
  (34, 5, 'Iniciativa', 'Toma iniciativa para servir', 6);

-- Área 6: Evangelismo
insert into indicadores (id, area_id, nombre, descripcion, orden) values
  (35, 6, 'Comparte el evangelio', 'Comparte el mensaje de salvación', 1),
  (36, 6, 'Comparte su testimonio', 'Cuenta su experiencia con Dios', 2),
  (37, 6, 'Invita personas', 'Invita personas a la iglesia', 3),
  (38, 6, 'Ora por inconversos', 'Intercede por quienes no conocen a Cristo', 4),
  (39, 6, 'Seguimiento de nuevos', 'Da seguimiento a nuevos creyentes', 5);

-- Área 7: Discipulado
insert into indicadores (id, area_id, nombre, descripcion, orden) values
  (40, 7, 'Recibe discipulado', 'Está dispuesto a ser discipulado', 1),
  (41, 7, 'Cumple tareas', 'Realiza las tareas asignadas en el discipulado', 2),
  (42, 7, 'Aplica enseñanzas', 'Pone en práctica lo aprendido', 3),
  (43, 7, 'Discipula a otros', 'Discipula a nuevos creyentes', 4),
  (44, 7, 'Acompaña nuevos', 'Acompaña el proceso de otros', 5);

-- Área 8: Liderazgo
insert into indicadores (id, area_id, nombre, descripcion, orden) values
  (45, 8, 'Influencia positiva', 'Influye positivamente en otros', 1),
  (46, 8, 'Forma equipos', 'Forma y desarrolla equipos', 2),
  (47, 8, 'Capacita personas', 'Entrena y prepara a otros', 3),
  (48, 8, 'Delega', 'Delega responsabilidades adecuadamente', 4),
  (49, 8, 'Resuelve conflictos', 'Resuelve conflictos bíblicamente', 5),
  (50, 8, 'Multiplica líderes', 'Forma nuevos líderes', 6);

-- 13. SEED: OBJETIVOS POR NIVEL PARA CADA INDICADOR
-- Nivel 1: Nueva Vida en Cristo
insert into indicador_nivel (indicador_id, nivel_id, objetivo) values
  (1, 1, 'Aprender a desarrollar una vida de oración.'),
  (2, 1, 'Comenzar a leer la Biblia diariamente.'),
  (3, 1, 'Establecer un tiempo diario con Dios.'),
  (4, 1, 'Memorizar los primeros versículos clave.'),
  (5, 1, 'Aprender a meditar en la Palabra.'),
  (6, 1, 'Conocer el propósito del ayuno.'),
  (7, 1, 'Tener seguridad de su salvación por gracia.'),
  (8, 1, 'Aprender a depender de Dios en todo.'),
  (9, 1, 'Confesar los pecados a Dios.'),
  (10, 1, 'Desarrollar un corazón agradecido.'),
  (11, 1, 'Aprender a adorar a Dios.'),
  (12, 1, 'Confiar en las promesas básicas de Dios.'),
  (13, 1, 'Reconocer que necesita a Dios.'),
  (14, 1, 'Aprender a perdonar.'),
  (15, 1, 'Amar a Dios y al prójimo.'),
  (16, 1, 'Comenzar a controlar sus impulsos.'),
  (17, 1, 'Ser honesto en palabra y acción.'),
  (18, 1, 'Mantener pureza en su nueva vida.'),
  (19, 1, 'Obedecer a Dios en lo básico.'),
  (20, 1, 'Aprender a esperar en Dios.'),
  (21, 1, 'Responder con mansedumbre.'),
  (22, 1, 'Asumir pequeñas responsabilidades.'),
  (23, 1, 'Asistir regularmente a los cultos.'),
  (24, 1, 'Unirse a un grupo pequeño.'),
  (25, 1, 'Participar en las reuniones.'),
  (26, 1, 'Comenzar a relacionarse con hermanos.'),
  (27, 1, 'Reconocer la autoridad pastoral.'),
  (28, 1, 'Identificarse con la iglesia local.'),
  (29, 1, 'Conocer los ministerios de la iglesia.'),
  (30, 1, 'Ser puntual en las reuniones.'),
  (31, 1, 'Cumplir con pequeñas tareas.'),
  (32, 1, 'Estar disponible para servir.'),
  (33, 1, 'Ser fiel en lo poco.'),
  (34, 1, 'Tomar iniciativa para servir.'),
  (35, 1, 'Compartir su testimonio de conversión.'),
  (36, 1, 'Aprender a compartir su testimonio.'),
  (37, 1, 'Invitar familiares y amigos.'),
  (38, 1, 'Comenzar a orar por inconversos.'),
  (39, 1, 'Acompañar a nuevos creyentes.'),
  (40, 1, 'Recibir discipulado con humildad.'),
  (41, 1, 'Cumplir las tareas del discipulado.'),
  (42, 1, 'Aplicar las enseñanzas básicas.'),
  (43, 1, 'Observar cómo se discipula a otros.'),
  (44, 1, 'Acompañar a otros nuevos creyentes.'),
  (45, 1, 'Ser ejemplo en su caminar inicial.'),
  (46, 1, 'Participar en equipos existentes.'),
  (47, 1, 'Recibir capacitación básica.'),
  (48, 1, 'Permitir que otros lideren.'),
  (49, 1, 'Aprender a resolver conflictos básicos.'),
  (50, 1, 'Observar el proceso de multiplicación.');
;

-- Nivel 2: Consolidación
insert into indicador_nivel (indicador_id, nivel_id, objetivo) values
  (1, 2, 'Mantener una vida constante de oración.'),
  (2, 2, 'Leer la Biblia 5 o más días por semana.'),
  (3, 2, 'Tener un devocional consistente.'),
  (4, 2, 'Memorizar versículos semanalmente.'),
  (5, 2, 'Meditar regularmente en la Palabra.'),
  (6, 2, 'Practicar el ayuno ocasionalmente.'),
  (7, 2, 'Afirmar su seguridad en Cristo.'),
  (8, 2, 'Depender de Dios en las decisiones.'),
  (9, 2, 'Confesar pecados y buscar restauración.'),
  (10, 2, 'Vivir con gratitud constante.'),
  (11, 2, 'Adorar a Dios con regularidad.'),
  (12, 2, 'Confiar en Dios en las pruebas.'),
  (13, 2, 'Practicar la humildad en relaciones.'),
  (14, 2, 'Perdonar a quienes le ofenden.'),
  (15, 2, 'Amar activamente a los hermanos.'),
  (16, 2, 'Ejercer dominio propio en tentaciones.'),
  (17, 2, 'Ser honesto en toda situación.'),
  (18, 2, 'Mantener pureza moral y sexual.'),
  (19, 2, 'Obedecer consistentemente.'),
  (20, 2, 'Tener paciencia en las dificultades.'),
  (21, 2, 'Responder con mansedumbre.'),
  (22, 2, 'Ser responsable en sus compromisos.'),
  (23, 2, 'Asistir fielmente a los cultos.'),
  (24, 2, 'Participar activamente en el grupo pequeño.'),
  (25, 2, 'Contribuir en las reuniones.'),
  (26, 2, 'Desarrollar relaciones saludables.'),
  (27, 2, 'Sujetarse a la autoridad pastoral.'),
  (28, 2, 'Integrarse plenamente a la iglesia.'),
  (29, 2, 'Servir en un ministerio establecido.'),
  (30, 2, 'Ser puntual en sus responsabilidades.'),
  (31, 2, 'Asumir responsabilidades mayores.'),
  (32, 2, 'Estar disponible para servir.'),
  (33, 2, 'Ser fiel en las tareas asignadas.'),
  (34, 2, 'Tomar iniciativa en el servicio.'),
  (35, 2, 'Compartir el evangelio con otros.'),
  (36, 2, 'Compartir su testimonio efectivamente.'),
  (37, 2, 'Invitar personas regularmente.'),
  (38, 2, 'Ora sistemáticamente por inconversos.'),
  (39, 2, 'Dar seguimiento a nuevos creyentes.'),
  (40, 2, 'Ser consistente en el discipulado.'),
  (41, 2, 'Cumplir con las tareas asignadas.'),
  (42, 2, 'Aplicar las enseñanzas recibidas.'),
  (43, 2, 'Comenzar a discipular a alguien.'),
  (44, 2, 'Acompañar a nuevos creyentes.'),
  (45, 2, 'Ser ejemplo en su caminar.'),
  (46, 2, 'Colaborar en equipos de trabajo.'),
  (47, 2, 'Capacitarse para servir mejor.'),
  (48, 2, 'Delegar tareas simples.'),
  (49, 2, 'Resolver conflictos con ayuda.'),
  (50, 2, 'Participar en la multiplicación.');
;

-- Nivel 3: Carácter
insert into indicador_nivel (indicador_id, nivel_id, objetivo) values
  (1, 3, 'Tomar decisiones guiadas por la oración e interceder por otros.'),
  (2, 3, 'Estudiar la Biblia con profundidad.'),
  (3, 3, 'Tener un devocional transformador.'),
  (4, 3, 'Memorizar pasajes completos.'),
  (5, 3, 'Meditar y aplicar la Palabra.'),
  (6, 3, 'Ayunar con propósito y regularidad.'),
  (7, 3, 'Vivir con seguridad y confianza en Dios.'),
  (8, 3, 'Depender de Dios en todo momento.'),
  (9, 3, 'Confesar y restaurar relaciones.'),
  (10, 3, 'Vivir en gratitud permanente.'),
  (11, 3, 'Adorar a Dios en espíritu y verdad.'),
  (12, 3, 'Confiar en Dios sin vacilar.'),
  (13, 3, 'Ser humilde en todo tiempo.'),
  (14, 3, 'Perdonar y buscar reconciliación.'),
  (15, 3, 'Amar sacrificialmente.'),
  (16, 3, 'Dominio propio en toda área.'),
  (17, 3, 'Ser íntegro en público y privado.'),
  (18, 3, 'Pureza en pensamiento y acción.'),
  (19, 3, 'Obedecer aunque cueste.'),
  (20, 3, 'Paciencia en la espera y prueba.'),
  (21, 3, 'Mansedumbre ante la adversidad.'),
  (22, 3, 'Responsabilidad ejemplar.'),
  (23, 3, 'Asistir y contribuir activamente.'),
  (24, 3, 'Liderar o facilitar el grupo pequeño.'),
  (25, 3, 'Participar con madurez.'),
  (26, 3, 'Relaciones que edifican.'),
  (27, 3, 'Sujeción y lealtad pastoral.'),
  (28, 3, 'Integración con propósito.'),
  (29, 3, 'Liderar un ministerio.'),
  (30, 3, 'Puntualidad ejemplar.'),
  (31, 3, 'Responsabilidad en todo nivel.'),
  (32, 3, 'Disponibilidad total.'),
  (33, 3, 'Fidelidad comprobada.'),
  (34, 3, 'Iniciativa proactiva.'),
  (35, 3, 'Evangelizar intencionalmente.'),
  (36, 3, 'Testimonio coherente y efectivo.'),
  (37, 3, 'Invitar con propósito evangelístico.'),
  (38, 3, 'Interceder por inconversos constantemente.'),
  (39, 3, 'Discipular a nuevos creyentes.'),
  (40, 3, 'Ser ejemplo en el discipulado.'),
  (41, 3, 'Cumplir tareas avanzadas.'),
  (42, 3, 'Enseñar lo aprendido.'),
  (43, 3, 'Discipular consistentemente.'),
  (44, 3, 'Acompañar con excelencia.'),
  (45, 3, 'Influir positivamente en otros.'),
  (46, 3, 'Formar y desarrollar equipos.'),
  (47, 3, 'Capacitar a otros.'),
  (48, 3, 'Delegar con sabiduría.'),
  (49, 3, 'Resolver conflictos bíblicamente.'),
  (50, 3, 'Multiplicar su liderazgo.');
;

-- Nivel 4: Servicio (Compromiso)
insert into indicador_nivel (indicador_id, nivel_id, objetivo) values
  (1, 4, 'Guiar y enseñar a otros a orar.'),
  (2, 4, 'Enseñar la Biblia a otros.'),
  (3, 4, 'Modelar una vida devocional madura.'),
  (4, 4, 'Enseñar a otros a memorizar.'),
  (5, 4, 'Guiar a otros en la meditación.'),
  (6, 4, 'Enseñar y modelar el ayuno.'),
  (7, 4, 'Ayudar a otros a tener seguridad.'),
  (8, 4, 'Enseñar dependencia de Dios.'),
  (9, 4, 'Guiar a otros en la confesión.'),
  (10, 4, 'Modelar una vida de gratitud.'),
  (11, 4, 'Liderar en adoración.'),
  (12, 4, 'Ser ejemplo de fe para otros.'),
  (13, 4, 'Ser modelo de humildad.'),
  (14, 4, 'Enseñar a perdonar.'),
  (15, 4, 'Modelar el amor sacrificial.'),
  (16, 4, 'Enseñar dominio propio.'),
  (17, 4, 'Ser referente de integridad.'),
  (18, 4, 'Guiar a otros en pureza.'),
  (19, 4, 'Enseñar obediencia radical.'),
  (20, 4, 'Modelar paciencia en todo.'),
  (21, 4, 'Ser ejemplo de mansedumbre.'),
  (22, 4, 'Modelar responsabilidad máxima.'),
  (23, 4, 'Ser ejemplo de asistencia.'),
  (24, 4, 'Multiplicar grupos pequeños.'),
  (25, 4, 'Capacitar a otros a participar.'),
  (26, 4, 'Ser ejemplo de relaciones sanas.'),
  (27, 4, 'Enseñar sujeción pastoral.'),
  (28, 4, 'Liderar la integración de nuevos.'),
  (29, 4, 'Multiplicar ministerios.'),
  (30, 4, 'Enseñar puntualidad.'),
  (31, 4, 'Ser modelo de responsabilidad.'),
  (32, 4, 'Disponibilidad para multiplicarse.'),
  (33, 4, 'Fidelidad inquebrantable.'),
  (34, 4, 'Iniciativa para multiplicar.'),
  (35, 4, 'Capacitar a otros a evangelizar.'),
  (36, 4, 'Enseñar a compartir testimonio.'),
  (37, 4, 'Motivar a invitar.'),
  (38, 4, 'Liderar intercesión por almas.'),
  (39, 4, 'Liderar el seguimiento.'),
  (40, 4, 'Ser modelo de discipulado.'),
  (41, 4, 'Diseñar tareas para otros.'),
  (42, 4, 'Enseñar a aplicar la Palabra.'),
  (43, 4, 'Multiplicar discipuladores.'),
  (44, 4, 'Liderar el acompañamiento.'),
  (45, 4, 'Ser referencia de liderazgo.'),
  (46, 4, 'Multiplicar equipos de liderazgo.'),
  (47, 4, 'Formar capacitadores.'),
  (48, 4, 'Delegar con excelencia.'),
  (49, 4, 'Enseñar resolución de conflictos.'),
  (50, 4, 'Multiplicar multiplicadores.');
;
