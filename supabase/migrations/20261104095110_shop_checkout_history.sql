-- Order lines retain their purchased article even when the catalogue changes.
alter table public.v20_orders
 add column product_name text,
 add column unit_price numeric(8,2) check(unit_price is null or unit_price>=0),
 add column checkout_id uuid,
 add column checkout_line smallint,
 add column checkout_signature text;
create unique index v32_checkout_line_unique on public.v20_orders(checkout_id,checkout_line) where checkout_id is not null;
update public.v20_orders o set product_name=p.name,unit_price=p.price from public.v20_products p where p.id=o.product_id;
create function public.v32_snapshot_order_product() returns trigger
language plpgsql security invoker set search_path='' as $$
declare p public.v20_products%rowtype;
begin
 if tg_op='INSERT' or new.product_id is distinct from old.product_id then
  select * into p from public.v20_products where id=new.product_id;
  if not found then raise exception 'PRODUCT_UNAVAILABLE'; end if;
  new.product_name:=p.name;new.unit_price:=p.price;
 else
  -- Status/quantity edits must never reprice an already placed order.
  new.product_name:=old.product_name;new.unit_price:=old.unit_price;
  if new.product_name is null or new.unit_price is null then
   select * into p from public.v20_products where id=new.product_id;
   if found then new.product_name:=coalesce(new.product_name,p.name);new.unit_price:=coalesce(new.unit_price,p.price);end if;
  end if;
 end if;
 return new;
end;$$;
revoke all on function public.v32_snapshot_order_product() from public,anon;
grant execute on function public.v32_snapshot_order_product() to authenticated,service_role;
create trigger v32_snapshot_order_product before insert or update on public.v20_orders for each row execute function public.v32_snapshot_order_product();
-- Existing rows were backfilled above; future rows are captured at insertion.
-- No pupil/order SELECT grants or RLS policies are changed.
