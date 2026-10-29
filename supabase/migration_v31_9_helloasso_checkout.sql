-- Proposed V31.9 HelloAsso Checkout schema. Apply only after review and secret setup.
-- Existing order RLS, public-order rate limits, and school-year RGPD purge remain unchanged.
alter table public.v20_orders
  add column if not exists amount_cents integer,
  add column if not exists helloasso_checkout_id bigint,
  add column if not exists helloasso_checkout_created_at timestamptz,
  add column if not exists helloasso_redirect_url text,
  add column if not exists helloasso_payment_id bigint,
  add column if not exists helloasso_payment_state text,
  add column if not exists helloasso_paid_at timestamptz;
create unique index if not exists v319_orders_helloasso_checkout_unique
  on public.v20_orders(helloasso_checkout_id) where helloasso_checkout_id is not null;
create unique index if not exists v319_orders_helloasso_payment_unique
  on public.v20_orders(helloasso_payment_id) where helloasso_payment_id is not null;

alter table public.v20_orders
  drop constraint if exists v319_orders_amount_cents_check;
alter table public.v20_orders
  add constraint v319_orders_amount_cents_check
  check (amount_cents is null or amount_cents between 1 and 100000000);

-- Payment authority belongs exclusively to the server's service_role.
create or replace function public.v319_helloasso_order_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if current_user not in ('service_role','postgres') and new.payment_method='HelloAsso' and new.paid
      then raise exception 'Paiement HelloAsso non vérifié.'; end if;
    return new;
  end if;
  if current_user not in ('service_role','postgres') and old.payment_method = 'HelloAsso' then
    if tg_op = 'DELETE' then
      if old.paid then raise exception 'Paiement HelloAsso confirmé : suppression non autorisée.'; end if;
      return old;
    end if;
    if new.paid is distinct from old.paid
       or new.payment_method is distinct from old.payment_method
       or new.amount_cents is distinct from old.amount_cents
       or new.product_id is distinct from old.product_id
       or new.quantity is distinct from old.quantity
       or new.helloasso_checkout_id is distinct from old.helloasso_checkout_id
       or new.helloasso_payment_id is distinct from old.helloasso_payment_id
       or new.helloasso_payment_state is distinct from old.helloasso_payment_state
       or new.helloasso_paid_at is distinct from old.helloasso_paid_at
       or new.helloasso_redirect_url is distinct from old.helloasso_redirect_url
       or new.helloasso_checkout_created_at is distinct from old.helloasso_checkout_created_at
    then raise exception 'État de paiement HelloAsso géré par le serveur.'; end if;
  end if;
  return case when tg_op='DELETE' then old else new end;
end;
$$;
revoke all on function public.v319_helloasso_order_guard() from public,anon,authenticated;
drop trigger if exists v319_helloasso_order_guard on public.v20_orders;
create trigger v319_helloasso_order_guard
before insert or update or delete on public.v20_orders
for each row execute function public.v319_helloasso_order_guard();
