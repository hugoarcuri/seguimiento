-- =====================================================
-- MIGRACIÓN 057: CRUD de Estudios Bíblicos
-- Tabla estudios_biblicos con contenido JSONB + seed
-- =====================================================

-- 1. TABLA PRINCIPAL
create table if not exists estudios_biblicos (
  id uuid primary key default gen_random_uuid(),
  numero integer not null,
  etapa_id integer not null,
  titulo text not null,
  descripcion text not null,
  contenido jsonb not null default '[]'::jsonb,
  preguntas jsonb not null default '[]'::jsonb,
  guia jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint estudios_biblicos_etapa_numero_unique unique (etapa_id, numero)
);

-- 2. RLS
alter table estudios_biblicos enable row level security;

-- Admin: acceso total
create policy "Admins acceso total a estudios biblicos"
  on estudios_biblicos for all
  using (public.is_admin())
  with check (public.is_admin());

-- Discipuladores y miembros: solo lectura
create policy "Discipuladores leen estudios"
  on estudios_biblicos for select
  using (
    public.get_my_rol() in ('discipulador', 'miembro')
  );

-- 3. Trigger updated_at
create trigger update_estudios_biblicos_updated_at
  before update on estudios_biblicos
  for each row execute function update_updated_at();

-- 4. SEED: Los 7 estudios existentes
insert into estudios_biblicos (numero, etapa_id, titulo, descripcion, contenido, preguntas, guia) values

-- Paso 1: Seguros por siempre
(1, 2, 'Seguros por siempre', 'Comprender la seguridad de la salvación y la permanencia en Cristo.',
'[
  {"tipo":"titulo","valor":"Seguros por siempre"},
  {"tipo":"texto","valor":"Una de las verdades más transformadoras de la fe cristiana es la seguridad de la salvación. Cuando aceptamos a Cristo, no entramos en un estado temporal o condicional, sino que recibimos una seguridad eterna que se fundamenta en la obra terminada de Jesús en la cruz."},
  {"tipo":"subtitulo","valor":"¿Cómo llegamos a la salvación?"},
  {"tipo":"texto","valor":"La salvación es un regalo de Dios que no podemos ganar con nuestras propias obras. Es por gracia, mediante la fe. Esto significa que no depende de cuán buenos seamos, sino de lo que Cristo ya hizo por nosotros."},
  {"tipo":"referencia","valor":"Efesios 2:8-9 — «Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios; no por obras, para que nadie se jacte.»"},
  {"tipo":"subtitulo","valor":"La seguridad eterna"},
  {"tipo":"texto","valor":"Jesús prometió que nadie podría arrebatar a sus ovejas de su mano. Esto nos da una certeza absoluta: nuestra salvación no depende de nosotros mantenerla, sino de Dios que la sostiene. Él es fiel y no puede dejar de cumplir su palabra."},
  {"tipo":"referencia","valor":"Juan 10:28-29 — «Yo les doy vida eterna, y no perecerán jamás; y nadie las arrebatará de mi mano. Mi Padre, que me las dio, es mayor que todos; y nadie puede arrebatarlas de la mano de mi Padre.»"},
  {"tipo":"referencia","valor":"Romanos 8:38-39 — «Porque estoy seguro de que ni la muerte ni la vida, ni ángeles ni principados, ni lo presente ni lo por venir, ni potencias, ni lo alto ni lo profundo, ni otra alguna criatura nos podrá separar del amor de Dios, que es en Cristo Jesús Señor nuestro.»"},
  {"tipo":"subtitulo","valor":"¿Qué pasa si dudo?"},
  {"tipo":"texto","valor":"Es normal tener momentos de duda, especialmente al principio. Las dudas no anulan tu salvación. Lo importante es recordar que tu seguridad no se basa en tus sentimientos, sino en la promesa de Dios. Si Él dijo que serás salvo, así será."},
  {"tipo":"referencia","valor":"2 Timoteo 2:13 — «Si nosotros somos infieles, él permanece fiel; no puede negarse a sí mismo.»"}
]',
'[
  {"enunciado":"¿En qué momento te diste por salvo? ¿Qué sentías antes y después?","tipo":"texto_libre"},
  {"enunciado":"¿Alguna vez dudaste de tu salvación? ¿Qué causó esa duda?","tipo":"texto_libre"},
  {"enunciado":"Ahora que conoces la seguridad eterna, ¿cómo cambia eso tu forma de vivir?","tipo":"texto_libre"}
]',
'{"objetivo":"Que el discípulo entienda que su salvación es un hecho seguro y permanente basado en la obra de Cristo.","puntosClave":["La salvación es por gracia mediante la fe","Nada puede separarnos del amor de Dios","La seguridad eterna se sustenta en las promesas bíblicas"],"consejos":["Lee los pasajes bíblicos en voz alta junto al discípulo","Animarlo a escribir su testimonio personal de salvación","Resolver dudas con paciencia, sin minimizar sus preguntas"],"preguntas":["¿En qué momento exacto te diste por salvo?","¿Qué sentías antes y después de aceptar a Cristo?","¿Alguna vez dudaste de tu salvación? ¿Por qué?"]}'),

-- Paso 2: Hablando con Dios
(2, 2, 'Hablando con Dios', 'Desarrollar una vida de oración personal y consistente.',
'[
  {"tipo":"titulo","valor":"Hablando con Dios"},
  {"tipo":"texto","valor":"La oración es la herramienta más poderosa que tiene un creyente. Es simplemente hablar con Dios como hablarías con un amigo. No necesita ser complicada ni usar palabras religiosas especiales. Dios quiere escuchar tu corazón, tal como eres."},
  {"tipo":"subtitulo","valor":"¿Qué es la oración?"},
  {"tipo":"texto","valor":"La oración es una conversación personal con Dios. Es hablarle, escucharle, adorarle, darle gracias y presentarle tus necesidades. No hay una fórmula mágica, sino una relación viva que se alimenta diariamente."},
  {"tipo":"referencia","valor":"Filipenses 4:6-7 — «No os preocupéis por cosa alguna, sino sean conocidas vuestras peticiones ante Dios en toda oración y ruego, con acción de gracias. Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.»"},
  {"tipo":"subtitulo","valor":"El modelo de Jesús"},
  {"tipo":"texto","valor":"Cuando los discípulos le pidieron a Jesús que les enseñara a orar, Él les dio un modelo sencillo conocido como el Padrenuestro. Este modelo incluye adoración, sumisión a la voluntad de Dios, provisión diaria, perdón y petición de protección."},
  {"tipo":"referencia","valor":"Mateo 6:9-13 — «Vosotros, pues, oraréis así: Padre nuestro que estás en los cielos, santificado sea tu nombre; venga tu reino; hágase tu voluntad, así en la tierra como en el cielo. El pan nuestro de cada día, danos hoy. Y perdona nuestras deudas, como también nosotros perdonamos a nuestros deudores. Y no nos metas en tentación, mas líbranos del mal.»"},
  {"tipo":"subtitulo","valor":"Consejos para una vida de oración"},
  {"tipo":"texto","valor":"1. Elige un momento fijo del día para orar (mañana es ideal, pero no es la única opción).\n2. Comienza con oraciones cortas y crece gradualmente.\n3. No te preocupes por las palabras perfectas. Habla con sinceridad.\n4. Incluye acción de gracias, confesión y peticiones.\n5. Escucha también. La oración es diálogo, no monólogo."},
  {"tipo":"referencia","valor":"1 Tesalonicenses 5:17 — «Orad sin cesar.»"}
]',
'[
  {"enunciado":"¿Cuánto tiempo dedicas actualmente a la oración? ¿En qué momentos del día oras?","tipo":"texto_libre"},
  {"enunciado":"¿Qué dificultades encuentras al orar? ¿Qué sientes que te impide ser constante?","tipo":"texto_libre"},
  {"enunciado":"Escribe una oración personal de agradecimiento basada en lo que has vivido esta semana.","tipo":"texto_libre"}
]',
'{"objetivo":"Que el discípulo establezca un hábito diario de oración y aprenda a comunicarse con Dios de forma natural.","puntosClave":["La oración es conversación, no solo fórmulas","La oración modelada por Jesús (Mateo 6:9-13)","La constancia es más importante que la perfección"],"consejos":["Enseñar con el ejemplo: orar juntos al inicio y cierre","Sugerir un horario fijo para orar (mañana o noche)","Comenzar con oraciones cortas y crecer gradualmente"],"preguntas":["¿Cuánto tiempo dedicas actualmente a la oración?","¿En qué momentos del día se te facilita orar?","¿Qué dificultades encuentras al orar?"]}'),

-- Paso 3: La lectura bíblica
(3, 2, 'La lectura bíblica', 'Aprender a leer, estudiar y aplicar la Biblia en la vida diaria.',
'[
  {"tipo":"titulo","valor":"La lectura bíblica"},
  {"tipo":"texto","valor":"La Biblia no es solo un libro antiguo lleno de historias. Es la Palabra viva de Dios, inspirada por el Espíritu Santo y relevante para cada área de nuestra vida. Aprender a leerla y estudiarla es fundamental para crecer como creyente."},
  {"tipo":"subtitulo","valor":"¿Por qué leer la Biblia?"},
  {"tipo":"texto","valor":"La Biblia es nuestra guía para conocer a Dios, entender su voluntad y vivir de acuerdo con sus designios. Sin ella, estamos a merced de nuestras propias ideas y emociones. La lectura constante nos transforma y nos fortalece espiritualmente."},
  {"tipo":"referencia","valor":"2 Timoteo 3:16-17 — «Toda la Escritura es inspirada por Dios, y útil para enseñar, para redargüir, para corregir, para instruir en justicia, a fin de que el hombre de Dios sea perfecto, enteramente preparado para toda buena obra.»"},
  {"tipo":"subtitulo","valor":"Método de lectura sencillo"},
  {"tipo":"texto","valor":"1. Lee un capítulo al día. Comienza por el Evangelio de Juan.\n2. Subraya o anota los versículos que te llamen la atención.\n3. Pregúntate: ¿Qué me enseña esto sobre Dios? ¿Cómo aplico esto a mi vida?\n4. Ora pidiendo entendimiento antes de leer."},
  {"tipo":"referencia","valor":"Salmo 119:105 — «Lámpara es tu palabra a mis pies, y luz para mi camino.»"},
  {"tipo":"subtitulo","valor":"Aplicación personal"},
  {"tipo":"texto","valor":"Leer la Biblia sin aplicar lo que leemos es como mirar un mapa sin nunca caminar. Cada pasaje tiene un mensaje para ti. Busca la manera de poner en práctica lo que aprendes, aunque sea un pequeño paso cada día."},
  {"tipo":"referencia","valor":"Santiago 1:22 — «Pero sed hacedores de la palabra, y no solamente oidores, engañando vosotros mismos.»"}
]',
'[
  {"enunciado":"¿Lees la Biblia actualmente? ¿Cuántas veces por semana?","tipo":"texto_libre"},
  {"enunciado":"¿Qué libro de la Biblia te gustaría entender mejor? ¿Por qué?","tipo":"texto_libre"},
  {"enunciado":"¿Alguna vez un versículo te habló directamente? ¿Cuál fue y qué impacto tuvo en ti?","tipo":"texto_libre"}
]',
'{"objetivo":"Que el discípulo descubra la Biblia como guía práctica para su vida y desarrolle el hábito de leerla diariamente.","puntosClave":["La Biblia es la Palabra viva de Dios","Cómo leer la Biblia: método sencillo paso a paso","La importancia de la aplicación personal"],"consejos":["Recomendar un plan de lectura sencillo (un capítulo al día)","Enseñar a subrayar y anotar versículos clave","Compartir un versículo que le haya impactado personalmente"],"preguntas":["¿Lees la Biblia actualmente? ¿Cuántas veces por semana?","¿Qué libro de la Biblia te gustaría entender mejor?","¿Alguna vez un versículo te habló directamente? ¿Cuál?"]}'),

-- Paso 4: ¿Quién es usted?
(4, 2, '¿Quién es usted?', 'Descubrir la identidad en Cristo y los roles del creyente.',
'[
  {"tipo":"titulo","valor":"¿Quién es usted?"},
  {"tipo":"texto","valor":"Antes de conocer a Cristo, nuestra identidad estaba definida por el mundo: por nuestro pasado, nuestros errores, nuestras relaciones o nuestra situación económica. Pero cuando nacemos de nuevo, Dios nos da una nueva identidad que nada ni nadie puede borrar."},
  {"tipo":"subtitulo","valor":"Hijos adoptados por Dios"},
  {"tipo":"texto","valor":"Al aceptar a Cristo, no solo somos perdonados; somos adoptados como hijos de Dios. Esto significa que tenemos todos los privilegios e hijos: acceso directo al Padre, una herencia eterna y la protección de Dios sobre nuestras vidas."},
  {"tipo":"referencia","valor":"Gálatas 4:4-7 — «Pero cuando vino el cumplimiento del tiempo, Dios envió a su Hijo, nacido de mujer, nacido bajo la ley, para que redimiese a los que estaban bajo la ley, para que recibiésemos la adopción de hijos. Y por que sois hijos, Dios envió a nuestros corazones el Espíritu de su Hijo, el cual clama: ¡Abba, Padre! Así que ya no es siervo, sino hijo; y si es hijo, es también heredero por Dios.»"},
  {"tipo":"subtitulo","valor":"Nueva creación"},
  {"tipo":"texto","valor":"La Biblia dice que si alguno está en Cristo, es nueva creación. Las cosas viejas pasaron; todo es hecho nuevo. Tu pasado no te define. Tu identidad ahora está en Cristo y en lo que Él dice de ti."},
  {"tipo":"referencia","valor":"2 Corintios 5:17 — «De modo que si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas.»"},
  {"tipo":"subtitulo","valor":"Lo que la Biblia dice de ti"},
  {"tipo":"texto","valor":"• Eres amado incondicionalmente (Romanos 8:38-39)\n• Eres elegido y santo (Colosenses 3:12)\n• Eres luz en el mundo (Mateo 5:14)\n• Eres más que vencedor (Romanos 8:37)\n• Eres pueblo de Dios (1 Pedro 2:9)\n• Eres libre del pecado (Romanos 6:14)"},
  {"tipo":"referencia","valor":"1 Pedro 2:9 — «Mas vosotros sois linaje escogido, sacerdocio real, nación santa, pueblo adquirido para poseer las virtudes del que os llamó de las tinieblas a su admirable luz.»"}
]',
'[
  {"enunciado":"¿Cómo te definías antes de conocer a Cristo? ¿Qué pensabas de ti mismo?","tipo":"texto_libre"},
  {"enunciado":"De la lista de verdades bíblicas sobre ti, ¿cuál te impacta más? ¿Por qué?","tipo":"texto_libre"},
  {"enunciado":"¿En qué momento sientes que tu identidad está amenazada? ¿Cómo puedes recordar quién eres en Cristo?","tipo":"texto_libre"}
]',
'{"objetivo":"Que el discípulo conozca quién es en Cristo y entienda su nueva identidad como hijo de Dios.","puntosClave":["Somos hijos adoptados por Dios (Gálatas 4:4-7)","Somos nueva creación en Cristo (2 Corintios 5:17)","Nuestra identidad no depende de circunstancias"],"consejos":["Pedir al discípulo que escriba 5 cosas que diga la Biblia sobre él","Comparar su identidad antes y después de Cristo","Usar ejemplos cotidianos para explicar la adopción"],"preguntas":["¿Cómo te definías antes de conocer a Cristo?","¿Qué dice la Biblia sobre quién eres?","¿En qué momento sientes que tu identidad está amenazada?"]}'),

-- Paso 5: Más que vencedores
(5, 2, 'Más que vencedores', 'Vivir en victoria sobre el pecado, las pruebas y las dificultades.',
'[
  {"tipo":"titulo","valor":"Más que vencedores"},
  {"tipo":"texto","valor":"Como creyentes, no estamos destinados a vivir derrotados por el pecado, las dificultades o el miedo. Dios nos ha dado todo lo que necesitamos para vivir en victoria. No significa que no tengamos problemas, sino que los problemas no nos definen ni nos vencen."},
  {"tipo":"subtitulo","valor":"Nuestra posición en Cristo"},
  {"tipo":"texto","valor":"La victoria cristiana no se basa en nuestros esfuerzos, sino en lo que Cristo ya logró en la cruz. Él venció al pecado, a la muerte y al diablo. Y nosotros estamos en Él, compartimos Su victoria. Por eso la Biblia dice que somos más que vencedores."},
  {"tipo":"referencia","valor":"Romanos 8:37 — «Pero en todo esto somos más que vencedores, por amor de aquel que nos amó.»"},
  {"tipo":"subtitulo","valor":"El arma contra la tentación"},
  {"tipo":"texto","valor":"La Palabra de Dios es nuestra arma más poderosa contra la tentación. Cuando Jesús fue tentado en el desierto, respondió con la Escritura. Nosotros podemos hacer lo mismo. Conocer la Biblia nos da autoridad espiritual."},
  {"tipo":"referencia","valor":"Hebreos 4:12 — «Porque la palabra de Dios es viva y eficaz, y más cortante que cualquier espada de dos filos, que penetra hasta partir alma y espíritu, jointuras y médulas, y es juzgadora de los pensamientos y propósitos del corazón.»"},
  {"tipo":"subtitulo","valor":"Armadura de Dios"},
  {"tipo":"texto","valor":"Pablo nos describe una armadura completa para enfrentar las batallas espirituales: el cinto de la verdad, el coraza de justicia, el escudo de fe, el yelmo de salvación y la espada del Espíritu. Cada pieza es esencial para la victoria diaria."},
  {"tipo":"referencia","valor":"Efesios 6:10-18 — «Finalmente, hermanos mios, fortaleceos en el Señor y en la fuerza de su poder. Vestíos de toda la armadura de Dios, para que podáis estar firmes contra las asechanzas del diablo.»"}
]',
'[
  {"enunciado":"¿Cuál ha sido la mayor dificultad que has enfrentado? ¿Qué papel jugó tu fe?","tipo":"texto_libre"},
  {"enunciado":"¿Cuál es tu mayor tentación actual? ¿Cómo puedes aplicar la Palabra contra ella?","tipo":"texto_libre"},
  {"enunciado":"De la armadura de Dios (Efesios 6), ¿cuál sientes que necesitas usar más? ¿Por qué?","tipo":"texto_libre"}
]',
'{"objetivo":"Que el discípulo entienda que en Cristo tiene poder para vencer toda adversidad y tentación.","puntosClave":["En Cristo somos más que vencedores (Romanos 8:37)","Las pruebas producen fortaleza y carácter","El arma contra la tentación es la Palabra de Dios"],"consejos":["Compartir una victoria personal sobre una dificultad","Enseñar a identificar las armas espirituales (Efesios 6)","No minimizar sus luchas; validar y acompañar"],"preguntas":["¿Cuál ha sido la mayor dificultad que has enfrentado?","¿Cómo la superaste? ¿Qué papel jugó la fe?","¿Cuál es tu mayor tentación actual?"]}'),

-- Paso 6: Ganando almas
(6, 2, 'Ganando almas', 'Aprender a compartir el evangelio con otros de forma efectiva.',
'[
  {"tipo":"titulo","valor":"Ganando almas"},
  {"tipo":"texto","valor":"Cada creyente tiene la responsabilidad y el privilegio de compartir lo que Cristo ha hecho en su vida. No se requiere ser teólogo ni orador experto; el testimonio personal y la Palabra de Dios tienen un poder que transforma vidas."},
  {"tipo":"subtitulo","valor":"La Gran Comisión"},
  {"tipo":"texto","valor":"Antes de ascender al cielo, Jesús dio una instrucción clara a sus discípulos: ir, hacer discípulos, bautizar y enseñar. Esta misión no era solo para los primeros discípulos, sino para todos los creyentes de todos los tiempos."},
  {"tipo":"referencia","valor":"Mateo 28:19-20 — «Id, y haced discípulos a todas las naciones, bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo, enseñándoles que guarden todas las cosas que os he mandado; y he aquí yo soy con vosotros todos los días, hasta el fin del mundo. Amén.»"},
  {"tipo":"subtitulo","valor":"Compartir tu testimonio"},
  {"tipo":"texto","valor":"Tu historia personal es una herramienta poderosa. Nadie puede discutir con lo que Dios ha hecho en tu vida. Un testimonio sencillo incluye tres partes: cómo era tu vida antes de Cristo, cómo conociste a Cristo, y cómo ha cambiado tu vida desde entonces."},
  {"tipo":"subtitulo","valor":"El mensaje del evangelio"},
  {"tipo":"texto","valor":"El evangelio se resume en estas verdades:\n1. Dios creó al ser humano a su imagen, pero el pecado nos separó de Él.\n2. Dios envió a su Hijo Jesús para morir por nuestros pecados y resucitar.\n3. Quien cree en Jesús recibe perdón y vida eterna.\n4. La fe en Jesús transforma nuestra vida hoy y para siempre."},
  {"tipo":"referencia","valor":"Romanos 1:16 — «Porque no me avergüenzo del evangelio, porque es poder de Dios para salvación a todo aquel que cree; al judío primeramente, y también al griego.»"}
]',
'[
  {"enunciado":"¿Cuántas personas has compartido el evangelio este mes? ¿Qué te impide compartir con más frecuencia?","tipo":"texto_libre"},
  {"enunciado":"Escribe un resumen de tu testimonio personal en 3-4 oraciones.","tipo":"texto_libre"},
  {"enunciado":"¿Quién en tu vida necesita conocer a Cristo? ¿Qué pasos concretos puedes dar esta semana?","tipo":"texto_libre"}
]',
'{"objetivo":"Que el discípulo se sienta preparado para compartir su fe y ganar almas para Cristo.","puntosClave":["La Gran Comisión es para todo creyente (Mateo 28:19-20)","Cómo compartir el evangelio de forma sencilla","La importancia del testimonio personal"],"consejos":["Practicar juntos cómo compartir el evangelio en 2 minutos","Hacer una lista de 3 personas para orar y compartir","Acompañarlo en su primera experiencia de evangelismo"],"preguntas":["¿Cuántas personas has compartido el evangelio este mes?","¿Qué te impide compartir tu fe con más frecuencia?","¿Quién en tu vida necesita conocer a Cristo?"]}'),

-- Paso 7: Creciendo solo o en familia
(7, 2, 'Creciendo solo o en familia', 'Aprender a crecer espiritualmente de forma individual y en comunidad.',
'[
  {"tipo":"titulo","valor":"Creciendo solo o en familia"},
  {"tipo":"texto","valor":"El crecimiento espiritual no ocurre de la noche a la mañana. Es un proceso que requiere disciplina personal y también vida en comunidad. Necesitamos tanto el tiempo a solas con Dios como la compañía de otros creyentes que nos apoyen y desafíen."},
  {"tipo":"subtitulo","valor":"Disciplinas espirituales"},
  {"tipo":"texto","valor":"Las disciplinas espirituales son prácticas que nos ayudan a crecer en nuestra relación con Dios. No son requisitos para ser salvos, sino herramientas para madurar en la fe. Algunas de las más importantes son:\n\n• Oración: hablar con Dios diariamente\n• Lectura bíblica: conocer su Palabra\n• Ayuno: fortalecer el espíritu\n• Adoración: expresar nuestro amor a Dios\n• Servicio: usar nuestros dones para otros\n• Comunión: compartir con otros creyentes"},
  {"tipo":"referencia","valor":"1 Timoteo 4:7-8 — «Pero rechaza las fábulas profanas y de viejas, y ejércitate para la piedad. Porque el ejercicio corporal para poco es útil, pero la piedad para todo es útil, teniendo promesa de la vida presente y de la venidera.»"},
  {"tipo":"subtitulo","valor":"La importancia de la comunidad"},
  {"tipo":"texto","valor":"Nadie puede crecer espiritualmente aislado. La Biblia compara a la iglesia con un cuerpo donde cada miembro tiene una función. Necesitamos de otros creyentes para ser enseñados, animados, corregidos y fortalecidos."},
  {"tipo":"referencia","valor":"Hebreos 10:24-25 — «Consideremos cómo excitarnos unos a otros al amor y a las buenas obras, no dejando de congregarnos, como algunos tienen por costumbre, sino exhortándonos, y tanto más cuando veis que el día se acerca.»"},
  {"tipo":"subtitulo","valor":"Un plan de crecimiento"},
  {"tipo":"texto","valor":"Cada creyente necesita un plan personal de crecimiento:\n1. Establece un momento fijo para orar y leer la Biblia cada día.\n2. Busca un grupo pequeño o ministerio en tu iglesia.\n3. Encuentra a un mentor o compañeros de fe.\n4. Sirve a otros con tus dones y talentos.\n5. Mantén la constancia, aunque los resultados no sean inmediatos."},
  {"tipo":"referencia","valor":"2 Pedro 3:18 — «Antes, creced en la gracia y en el conocimiento de nuestro Señor y Salvador Jesucristo. A él sea la gloria, ahora y hasta el día de la eternidad. Amén.»"}
]',
'[
  {"enunciado":"¿Qué disciplina espiritual te cuesta más mantener? ¿Qué puedes hacer para ser más constante?","tipo":"texto_libre"},
  {"enunciado":"¿Participas de un grupo pequeño o ministerio en tu iglesia? Si no, ¿qué te lo impide?","tipo":"texto_libre"},
  {"enunciado":"Escribe 3 metas concretas de crecimiento espiritual para los próximos 3 meses.","tipo":"texto_libre"}
]',
'{"objetivo":"Que el discípulo entienda que el crecimiento espiritual requiere disciplina personal y vida en comunidad.","puntosClave":["El crecimiento espiritual es un proceso, no un evento","La importancia de la comunidad y la iglesia local","Disciplinas espirituales: oración, ayuno, comunión, servicio"],"consejos":["Ayudar al discípulo a crear un plan de crecimiento personal","Invitarlo a un grupo pequeño o ministerio de la iglesia","Seguir reunión regularmente incluso después del nivel 1"],"preguntas":["¿Qué disciplina espiritual te cuesta más mantener?","¿Participas de un grupo pequeño o ministerio?","¿Qué meta de crecimiento te gustaría alcanzar este año?"]}');
