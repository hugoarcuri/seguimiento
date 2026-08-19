-- Renombrar etapas existentes y agregar etapa 5
-- Etapas de discipulado alineadas con el modelo de la iglesia

UPDATE etapas SET
  nombre = 'No creyente',
  descripcion = 'Personas que aún no conocen a Cristo o están explorando la fe',
  objetivos = '["Comprender el mensaje del evangelio", "Entender la necesidad de salvación", "Recibir amor y acompañamiento sin juicio"]'::jsonb,
  material_recomendado = 'Material de evangelismo y acompañamiento'
WHERE id = 1;

UPDATE etapas SET
  nombre = 'Nuevo creyente',
  descripcion = 'Fundamentos de la fe para quienes recién aceptaron a Cristo',
  objetivos = '["Entender la salvación por gracia", "Establecer una vida de oración", "Comenzar a leer la Biblia", "Entender el bautismo"]'::jsonb,
  material_recomendado = 'Estudios Bíblicos - Nivel 1: Fundamentos de la fe'
WHERE id = 2;

UPDATE etapas SET
  nombre = 'Discípulo',
  descripcion = 'Crecimiento en carácter y conocimiento bíblico',
  objetivos = '["Desarrollar el fruto del Espíritu", "Vida de integridad", "Relaciones saludables", "Mayordomía"]'::jsonb,
  material_recomendado = 'Material de formación en carácter'
WHERE id = 3;

UPDATE etapas SET
  nombre = 'Siervo',
  descripcion = 'Preparación para servir y liderar en la iglesia',
  objetivos = '["Identificar el llamado y los dones", "Desarrollar liderazgo cristiano", "Aprender a enseñar y acompañar"]'::jsonb,
  material_recomendado = 'Material de liderazgo y servicio'
WHERE id = 4;

INSERT INTO etapas (id, nombre, descripcion, orden, objetivos, material_recomendado)
VALUES (5, 'Multiplicador', 'Formación para hacer discípulos y multiplicar el reino', 5,
  '["Hacer discípulos que hagan discípulos", "Multiplicar ministerios y grupos", "Enviar y equipar nuevos líderes"]'::jsonb,
  'Material de multiplicación y envío')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  orden = EXCLUDED.orden,
  objetivos = EXCLUDED.objetivos,
  material_recomendado = EXCLUDED.material_recomendado;
