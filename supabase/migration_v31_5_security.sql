-- Association Sportive du Bon Sauveur — V31.5
-- Fixe le search_path du trigger de synchronisation des spécialités.

alter function public.v20_events_sync_specialties()
  set search_path = '';

comment on function public.v20_events_sync_specialties() is
  'Synchronise specialty et specialties avec un search_path immuable.';
