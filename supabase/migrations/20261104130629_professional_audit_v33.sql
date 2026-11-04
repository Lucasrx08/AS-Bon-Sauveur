-- Keep the public projection limited to published, current convocations and pseudonyms.
create or replace function public.v3184_public_convocation_roster()
returns table(convocation_id text,display_name text)
language sql stable security definer set search_path='' as $$
 select c.id,
 case
 when parsed.parts is not null then btrim(parsed.parts[2]) || ' ' || upper(left(btrim(parsed.parts[1]),1)) || '.'
 when position(' ' in names.full_name)>0 then initcap(lower(regexp_replace(names.full_name,'^.*[[:space:]]',''))) || ' ' || upper(left(names.full_name,1)) || '.'
 else upper(left(names.full_name,1)) || '.' end as display_name
 from public.v20_convocations c
 join public.v20_convocation_students link on link.convocation_id=c.id
 left join public.v20_licenses lic on lic.student_id=link.student_id
 left join public.v20_students student on student.id=link.student_id
 cross join lateral(select regexp_replace(btrim(coalesce(nullif(btrim(lic.full_name),''),nullif(btrim(student.full_name),''),'')),'[[:space:]]+',' ','g') as full_name) names
 cross join lateral(select regexp_match(names.full_name,'^(.+?)[[:space:]]+([[:upper:]][[:lower:]].*)$') as parts) parsed
 where c.public_visible is true and c.status='published'
 and c.date>=(now() at time zone 'Europe/Paris')::date and names.full_name<>''
 order by c.date,c.id,display_name;
$$;
-- Do not expand the existing function permissions or underlying table grants.
