-- Eliminar el bloque "Carácter" (área 3, Carácter Cristiano) y su indicador
update indicadores set activo = false where id = 22;
update areas set activo = false where id = 3;
