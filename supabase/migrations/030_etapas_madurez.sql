-- =====================================================
-- MIGRACIÓN 030: Etapas de madurez para discípulos
-- Reemplaza las 4 etapas antiguas (Nueva Vida, Consolidación,
-- Carácter, Servicio) por las 5 etapas de madurez espiritual.
-- Se conservan los mismos id (1-4) y se agrega el 5.
-- =====================================================

update etapas set
  nombre = 'No Creyente',
  descripcion = 'Persona que aún no ha entregado su vida a Cristo',
  objetivos = '["Compartir el evangelio", "Invitarlo a la iglesia", "Establecer una relación de amistad", "Orar por su salvación"]'::jsonb,
  material_recomendado = 'Evangelismo - Material de acompañamiento'
where id = 1;

update etapas set
  nombre = 'Bebé Espiritual',
  descripcion = 'Nuevo creyente que necesita fundamentos de la fe',
  objetivos = '["Entender la salvación por gracia", "Establecer una vida de oración", "Comenzar a leer la Biblia", "Entender el bautismo"]'::jsonb,
  material_recomendado = 'Bebé Espiritual - Material de discipulado'
where id = 2;

update etapas set
  nombre = 'Niño Espiritual',
  descripcion = 'Creyente en crecimiento que afirma las bases de su fe',
  objetivos = '["Desarrollar una vida devocional consistente", "Entender la importancia de la iglesia local", "Aprender sobre los dones espirituales", "Comenzar a servir"]'::jsonb,
  material_recomendado = 'Niño Espiritual - Material de discipulado'
where id = 3;

update etapas set
  nombre = 'Joven Espiritual',
  descripcion = 'Creyente que desarrolla el carácter de Cristo',
  objetivos = '["Estudio del fruto del Espíritu", "Vida de integridad", "Relaciones saludables", "Mayordomía"]'::jsonb,
  material_recomendado = 'Joven Espiritual - Material de discipulado'
where id = 4;

insert into etapas (id, nombre, descripcion, orden, objetivos, material_recomendado) values
  (5, 'Padre/Madre Espiritual', 'Creyente maduro que discipula y multiplica', 5,
   '["Identificar el llamado", "Desarrollar liderazgo", "Aprender a discipular a otros", "Multiplicación"]'::jsonb,
   'Padre/Madre Espiritual - Material de discipulado')
on conflict (id) do nothing;