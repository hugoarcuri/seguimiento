-- Eliminar el bloque "Relación con Dios" (área 2) y sus indicadores
update indicadores set activo = false where id in (7, 9, 10, 11);
update areas set activo = false where id = 2;
