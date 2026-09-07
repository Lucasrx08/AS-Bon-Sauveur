-- Association Sportive du Bon Sauveur — migration V5
-- À exécuter après migration_v4.sql lorsque Supabase sera activé.

-- Boutique : couleur commandée et catalogue visuel.
alter table public.orders add column if not exists color text;
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists colors jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists payment_methods jsonb not null default '["Espèces","Virement","Chèque"]'::jsonb;

-- Le statut "ready" de V4 est conservé pour compatibilité historique,
-- mais il n'est plus utilisé dans l'interface : seulement payé / distribué.
