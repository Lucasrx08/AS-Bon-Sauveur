-- Freeze the existing supplier submission; future inserts belong to the second batch.
alter table public.v20_orders add column batch_number integer;
update public.v20_orders set batch_number=1 where batch_number is null;
alter table public.v20_orders alter column batch_number set default 2;
alter table public.v20_orders alter column batch_number set not null;
alter table public.v20_orders add constraint v342_batch_positive check(batch_number>=1);
