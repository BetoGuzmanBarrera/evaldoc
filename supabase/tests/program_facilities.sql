-- Block 14: all fixtures are fictional and rolled back.
begin;
create temp table audit_results (test_name text primary key, passed boolean not null) on commit drop;
grant select, insert on audit_results to authenticated;

insert into audit_results values
  ('seed has no invented facilities', (select count(*) from public.facilities) = 0),
  ('seed has no invented links', (select count(*) from public.program_facilities) = 0);

do $fixture$
declare
  a uuid;
  b uuid;
begin
  select id into strict a from public.institutions where slug = 'ipn';
  select id into strict b from public.institutions where slug = 'unam';

  insert into public.campuses (id, institution_id, name, code) values
    ('f1000000-0000-4000-8000-000000000001', a, 'QA Campus A1', 'QA-A1'),
    ('f1000000-0000-4000-8000-000000000002', a, 'QA Campus A2', 'QA-A2'),
    ('f1000000-0000-4000-8000-000000000003', b, 'QA Campus B', 'QA-B');
  insert into public.programs (id, institution_id, campus_id, name, code) values
    ('f2000000-0000-4000-8000-000000000001', a,
      'f1000000-0000-4000-8000-000000000001', 'QA Program A1', 'QA-A1'),
    ('f2000000-0000-4000-8000-000000000002', a,
      'f1000000-0000-4000-8000-000000000002', 'QA Program A2', 'QA-A2'),
    ('f2000000-0000-4000-8000-000000000003', b,
      'f1000000-0000-4000-8000-000000000003', 'QA Program B', 'QA-B');
  insert into public.facilities
    (id, institution_id, campus_id, name, facility_type) values
    ('f3000000-0000-4000-8000-000000000001', a,
      'f1000000-0000-4000-8000-000000000001', 'Centro de Cómputo', 'computing_center'),
    ('f3000000-0000-4000-8000-000000000002', a,
      'f1000000-0000-4000-8000-000000000002', 'Laboratorio de Materiales', 'laboratory'),
    ('f3000000-0000-4000-8000-000000000003', b,
      'f1000000-0000-4000-8000-000000000003', 'Cocina Experimental', 'workshop'),
    ('f3000000-0000-4000-8000-000000000004', a,
      null, 'Centro de Recursos', 'other');
  insert into public.program_facilities (program_id, facility_id) values
    ('f2000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001'),
    ('f2000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000004'),
    ('f2000000-0000-4000-8000-000000000003', 'f3000000-0000-4000-8000-000000000003');

  insert into auth.users (id, email, raw_user_meta_data)
  select v.id, v.email,
    jsonb_build_object('institution_id', v.institution_id::text,
      'full_name', v.name, 'institutional_identifier', v.identifier)
  from (values
    ('f4000000-0000-4000-8000-000000000001'::uuid, a,
      'qa-fac-coordinator-a@example.test', 'QA Coordinator A', 'QA-FAC-CA'),
    ('f4000000-0000-4000-8000-000000000002'::uuid, b,
      'qa-fac-coordinator-b@example.test', 'QA Coordinator B', 'QA-FAC-CB'),
    ('f4000000-0000-4000-8000-000000000003'::uuid, a,
      'qa-fac-admin-a@example.test', 'QA Admin A', 'QA-FAC-AA'),
    ('f4000000-0000-4000-8000-000000000004'::uuid, a,
      'qa-fac-student-a@example.test', 'QA Student A', 'QA-FAC-SA'),
    ('f4000000-0000-4000-8000-000000000005'::uuid, a,
      'qa-fac-pending-a@example.test', 'QA Pending A', 'QA-FAC-PA')
  ) v(id, institution_id, email, name, identifier);
  update public.profiles set status = 'active'
    where id in (
      'f4000000-0000-4000-8000-000000000001',
      'f4000000-0000-4000-8000-000000000002',
      'f4000000-0000-4000-8000-000000000003',
      'f4000000-0000-4000-8000-000000000004'
    );
  delete from public.user_roles where profile_id in (
    'f4000000-0000-4000-8000-000000000001',
    'f4000000-0000-4000-8000-000000000002',
    'f4000000-0000-4000-8000-000000000003'
  );
  insert into public.user_roles (profile_id, institution_id, role_id)
  select p.id, p.institution_id, r.id from public.profiles p
  join public.roles r on r.code = case
    when p.id = 'f4000000-0000-4000-8000-000000000003' then 'admin'
    else 'coordinator' end
  where p.id in (
    'f4000000-0000-4000-8000-000000000001',
    'f4000000-0000-4000-8000-000000000002',
    'f4000000-0000-4000-8000-000000000003'
  );
end;
$fixture$;

insert into audit_results values
  ('valid same-campus and institution-wide links exist',
    (select count(*) from public.program_facilities) = 3),
  ('both facility tenants remain distinct',
    (select count(distinct institution_id) from public.facilities) = 2),
  ('both new tables have RLS',
    (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname in ('facilities', 'program_facilities')
        and c.relrowsecurity) = 2),
  ('both new policies target authenticated SELECT',
    (select count(*) from pg_policies where schemaname = 'public'
      and tablename in ('facilities', 'program_facilities')
      and cmd = 'SELECT' and 'authenticated'::name = any(roles)) = 2),
  ('anonymous role has no facility SELECT grant',
    not has_table_privilege('anon', 'public.facilities', 'SELECT')),
  ('authenticated role has no facility write grant',
    not has_table_privilege('authenticated', 'public.facilities', 'INSERT')),
  ('authenticated role has no junction write grant',
    not has_table_privilege('authenticated', 'public.program_facilities', 'INSERT')),
  ('scope trigger cannot be executed directly by client',
    not has_function_privilege('authenticated',
      'app_private.validate_program_facility()', 'EXECUTE'));

do $constraints$
declare
  a uuid;
begin
  select id into strict a from public.institutions where slug = 'ipn';
  begin
    insert into public.program_facilities values
      ('f2000000-0000-4000-8000-000000000001',
       'f3000000-0000-4000-8000-000000000003');
    insert into audit_results values ('cross-institution link rejected', false);
  exception when check_violation then
    insert into audit_results values ('cross-institution link rejected', true);
  end;
  begin
    insert into public.program_facilities values
      ('f2000000-0000-4000-8000-000000000001',
       'f3000000-0000-4000-8000-000000000002');
    insert into audit_results values ('cross-campus link rejected', false);
  exception when check_violation then
    insert into audit_results values ('cross-campus link rejected', true);
  end;
  begin
    insert into public.program_facilities values
      ('f2000000-0000-4000-8000-000000000001',
       'f3000000-0000-4000-8000-000000000001');
    insert into audit_results values ('duplicate link rejected', false);
  exception when unique_violation then
    insert into audit_results values ('duplicate link rejected', true);
  end;
  begin
    insert into public.facilities (institution_id, campus_id, name, facility_type)
    values (a, 'f1000000-0000-4000-8000-000000000003', 'Wrong tenant', 'other');
    insert into audit_results values ('facility campus tenant FK enforced', false);
  exception when foreign_key_violation then
    insert into audit_results values ('facility campus tenant FK enforced', true);
  end;
  begin
    insert into public.facilities (institution_id, campus_id, name, facility_type)
    values (a, 'f1000000-0000-4000-8000-000000000001',
      'centro de cómputo', 'computing_center');
    insert into audit_results values ('case-insensitive facility duplicate rejected', false);
  exception when unique_violation then
    insert into audit_results values ('case-insensitive facility duplicate rejected', true);
  end;
  begin
    update public.programs set campus_id = 'f1000000-0000-4000-8000-000000000002'
      where id = 'f2000000-0000-4000-8000-000000000001';
    insert into audit_results values ('program campus move cannot invalidate link', false);
  exception when check_violation then
    insert into audit_results values ('program campus move cannot invalidate link', true);
  end;
  begin
    update public.facilities set campus_id = 'f1000000-0000-4000-8000-000000000002'
      where id = 'f3000000-0000-4000-8000-000000000001';
    insert into audit_results values ('facility campus move cannot invalidate link', false);
  exception when check_violation then
    insert into audit_results values ('facility campus move cannot invalidate link', true);
  end;
end;
$constraints$;

select set_config('request.jwt.claim.sub',
  'f4000000-0000-4000-8000-000000000001', true);
set local role authenticated;
insert into audit_results values
  ('coordinator A sees only own facilities',
    (select count(*) from public.facilities) = 3),
  ('coordinator A sees only own links',
    (select count(*) from public.program_facilities) = 2);
reset role;

select set_config('request.jwt.claim.sub',
  'f4000000-0000-4000-8000-000000000002', true);
set local role authenticated;
insert into audit_results values
  ('coordinator B sees only own facilities',
    (select count(*) from public.facilities) = 1),
  ('coordinator B sees only own links',
    (select count(*) from public.program_facilities) = 1);
reset role;

select set_config('request.jwt.claim.sub',
  'f4000000-0000-4000-8000-000000000003', true);
set local role authenticated;
insert into audit_results values
  ('admin A sees own facilities',
    (select count(*) from public.facilities) = 3),
  ('admin A sees own links',
    (select count(*) from public.program_facilities) = 2);
reset role;

select set_config('request.jwt.claim.sub',
  'f4000000-0000-4000-8000-000000000004', true);
set local role authenticated;
insert into audit_results values
  ('student sees no facilities',
    (select count(*) from public.facilities) = 0),
  ('student sees no links',
    (select count(*) from public.program_facilities) = 0);
reset role;

select set_config('request.jwt.claim.sub',
  'f4000000-0000-4000-8000-000000000005', true);
set local role authenticated;
insert into audit_results values
  ('pending account sees no facilities',
    (select count(*) from public.facilities) = 0),
  ('pending account sees no links',
    (select count(*) from public.program_facilities) = 0);
reset role;

select count(*) as tests, count(*) filter (where passed) as passed,
  array_agg(test_name order by test_name) filter (where not passed) as failed
from audit_results;
do $assert$ begin
  if exists (select 1 from audit_results where not passed) then
    raise exception 'program_facilities_tests_failed';
  end if;
end $assert$;
rollback;
