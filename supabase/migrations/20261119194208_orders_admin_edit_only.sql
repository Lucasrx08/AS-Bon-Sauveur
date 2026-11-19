-- Detailed order edits and deletion are admin-only. EPS staff keep status tracking.
create or replace function public.v3412_guard_order_edits()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if current_user in ('postgres','supabase_admin','service_role') or coalesce(public.is_admin(),false) then
  return new;
 end if;
 if coalesce(public.is_teacher_or_admin(),false)
  and (to_jsonb(new) - array['paid','distributed']) = (to_jsonb(old) - array['paid','distributed']) then
  return new;
 end if;
 raise exception using errcode='42501', message='ORDER_EDIT_ADMIN_ONLY';
end;
$$;
revoke all on function public.v3412_guard_order_edits() from public,anon;
grant execute on function public.v3412_guard_order_edits() to authenticated,service_role;
-- Runs before product snapshot maintenance, so staff cannot inject a different snapshot.
create trigger a_v3412_order_edit_guard before update on public.v20_orders
for each row execute function public.v3412_guard_order_edits();
alter policy v20_orders_staff_delete on public.v20_orders using (public.is_admin());
