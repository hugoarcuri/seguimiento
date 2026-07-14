-- Replace old estado values with new 3-state model
alter table acompanamiento_evangelistico
  drop constraint if exists acompanamiento_evangelistico_estado_check;

alter table acompanamiento_evangelistico
  add constraint acompanamiento_evangelistico_estado_check
  check (estado in ('oracion_salvacion', 'actos_servicio', 'predicacion_evangelio'));

-- Update existing records (oracion -> oracion_salvacion, servicio -> actos_servicio, evangelismo -> predicacion_evangelio)
update acompanamiento_evangelistico set estado = 'oracion_salvacion' where estado = 'oracion';
update acompanamiento_evangelistico set estado = 'actos_servicio' where estado = 'servicio';
update acompanamiento_evangelistico set estado = 'predicacion_evangelio' where estado = 'evangelismo';
update acompanamiento_evangelistico set estado = 'predicacion_evangelio' where estado = 'completado';
