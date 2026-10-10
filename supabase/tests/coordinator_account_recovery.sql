-- All fixtures and decisions stay inside this transaction; QA data is unchanged.
begin;
create temp table qa17_ids (name text primary key, id uuid not null) on commit drop;
create temp table qa17_results (name text primary key, passed boolean not null) on commit drop;
grant select on qa17_ids to authenticated;
grant select, insert on qa17_results to authenticated;

do $fixture$
declare
  ipn uuid;
  unam uuid;
  program_a uuid := 'b7100000-0000-4000-8000-000000000001';
  program_b uuid := 'b7100000-0000-4000-8000-000000000002';
  subject_a uuid := 'b7200000-0000-4000-8000-000000000001';
  subject_b uuid := 'b7200000-0000-4000-8000-000000000002';
  admin_a uuid := 'b7300000-0000-4000-8000-000000000001';
  coordinator_a uuid := 'b7300000-0000-4000-8000-000000000002';
  self_actor uuid := 'b7300000-0000-4000-8000-000000000003';
  student_a uuid := 'b7300000-0000-4000-8000-000000000004';
  teacher_a uuid := 'b7300000-0000-4000-8000-000000000005';
  reject_a uuid := 'b7300000-0000-4000-8000-000000000006';
  student_b uuid := 'b7300000-0000-4000-8000-000000000007';
  coordinator_b uuid := 'b7300000-0000-4000-8000-000000000008';
  coordinator_peer uuid := 'b7300000-0000-4000-8000-000000000009';
  base jsonb;
  role_code text;
begin
  select id into strict ipn from public.institutions where slug='ipn';
  select id into strict unam from public.institutions where slug='unam';
  insert into qa17_ids values
    ('ipn',ipn),('unam',unam),('admin_a',admin_a),
    ('coordinator_a',coordinator_a),('self_actor',self_actor),
    ('student_a',student_a),('teacher_a',teacher_a),('reject_a',reject_a),
    ('student_b',student_b),('coordinator_b',coordinator_b),
    ('coordinator_peer',coordinator_peer);
  insert into qa17_ids (name,id)
    select 'role_'||code,id from public.roles where code in ('admin','hr');

  insert into public.programs (id,institution_id,name,code) values
    (program_a,ipn,'QA17 Programa A','QA17-A'),
    (program_b,unam,'QA17 Programa B','QA17-B');
  insert into public.subjects (id,institution_id,program_id,name,code) values
    (subject_a,ipn,program_a,'QA17 Materia A','QA17-A'),
    (subject_b,unam,program_b,'QA17 Materia B','QA17-B');
  base := pg_catalog.jsonb_build_object(
    'institution_id',ipn::text,'full_name','QA17 Persona',
    'institutional_identifier','QA17-BASE');

  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (admin_a,'qa17.admin@example.test',
      base || '{"institutional_identifier":"QA17-ADMIN"}'::jsonb,now());
  update public.profiles set status='active' where id=admin_a;
  insert into public.user_roles (profile_id,institution_id,role_id)
    select admin_a,ipn,id from public.roles where code='admin';

  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (coordinator_a,'qa17.coordinator@example.test',
      base || '{"institutional_identifier":"QA17-COORD","requested_role":"coordinator","role":"admin","roles":["hr"]}'::jsonb,now());
  insert into qa17_results values ('coordinator signup stays pending without any role',
    exists (select 1 from public.registration_requests r
      join public.profiles p on p.id=r.profile_id
      where r.profile_id=coordinator_a and r.requested_role='coordinator'
        and r.program_id is null and r.status='pending' and p.status='pending')
    and not exists (select 1 from public.user_roles where profile_id=coordinator_a));
  insert into qa17_results values ('untrusted metadata cannot grant admin or hr',
    not exists (select 1 from public.user_roles where profile_id=coordinator_a));

  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (coordinator_peer,'qa17.peer@example.test',
      base || '{"institutional_identifier":"QA17-PEER","requested_role":"coordinator"}'::jsonb,now());

  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (self_actor,'qa17.self@example.test',
      base || '{"institutional_identifier":"QA17-SELF"}'::jsonb,now());
  update public.profiles set status='active' where id=self_actor;
  insert into public.user_roles (profile_id,institution_id,role_id)
    select self_actor,ipn,id from public.roles where code='coordinator';
  insert into public.registration_requests (profile_id,institution_id,requested_role)
    values (self_actor,ipn,'coordinator');

  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (student_a,'qa17.student@example.test',
      base || pg_catalog.jsonb_build_object(
        'institutional_identifier','QA17-STUDENT','requested_role','student',
        'requested_program_id',program_a::text,
        'requested_subject_ids',pg_catalog.jsonb_build_array(subject_a::text)),now());
  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (teacher_a,'qa17.teacher@example.test',
      base || pg_catalog.jsonb_build_object(
        'institutional_identifier','QA17-TEACHER','requested_role','teacher',
        'requested_subject_ids',pg_catalog.jsonb_build_array(subject_a::text)),now());
  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (reject_a,'qa17.reject@example.test',
      base || pg_catalog.jsonb_build_object(
        'institutional_identifier','QA17-REJECT','requested_role','student',
        'requested_program_id',program_a::text,
        'requested_subject_ids',pg_catalog.jsonb_build_array(subject_a::text)),now());
  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (student_b,'qa17.other-student@example.test',
      pg_catalog.jsonb_build_object(
        'institution_id',unam::text,'full_name','QA17 Otra Institución',
        'institutional_identifier','QA17-OTHER-STUDENT','requested_role','student',
        'requested_program_id',program_b::text,
        'requested_subject_ids',pg_catalog.jsonb_build_array(subject_b::text)),now());
  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (coordinator_b,'qa17.other-coordinator@example.test',
      pg_catalog.jsonb_build_object(
        'institution_id',unam::text,'full_name','QA17 Otra Coordinación',
        'institutional_identifier','QA17-OTHER-COORD','requested_role','coordinator'),now());

  foreach role_code in array array['admin','hr'] loop
    begin
      insert into auth.users (id,email,raw_user_meta_data)
        values (gen_random_uuid(),'qa17.invalid.'||role_code||'@example.test',
          base || pg_catalog.jsonb_build_object(
            'institutional_identifier','QA17-'||role_code,'requested_role',role_code));
      insert into qa17_results values ('public signup rejects '||role_code,false);
    exception when others then
      insert into qa17_results values ('public signup rejects '||role_code,true);
    end;
  end loop;
  begin
    insert into auth.users (id,email,raw_user_meta_data)
      values (gen_random_uuid(),'qa17.coordinator-subject@example.test',
        base || pg_catalog.jsonb_build_object(
          'institutional_identifier','QA17-INVALID-COORD',
          'requested_role','coordinator',
          'requested_subject_ids',pg_catalog.jsonb_build_array(subject_a::text)));
    insert into qa17_results values ('coordinator academic selections rejected',false);
  exception when others then
    insert into qa17_results values ('coordinator academic selections rejected',true);
  end;

  insert into qa17_ids (name,id)
    select 'request_'||q.name,r.id from public.registration_requests r
    join qa17_ids q on q.id=r.profile_id
    where q.name in ('coordinator_a','self_actor','student_a','teacher_a',
      'reject_a','student_b','coordinator_b','coordinator_peer');
end
$fixture$;

set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from qa17_ids where name='self_actor'),true);
do $self$
begin
  begin
    perform public.institutional_decide_registration_request(
      (select id from qa17_ids where name='request_self_actor'),true);
    insert into qa17_results values ('coordinator cannot approve own request',false);
  exception when insufficient_privilege then
    insert into qa17_results values ('coordinator cannot approve own request',true);
  end;
end
$self$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from qa17_ids where name='admin_a'),true);
insert into qa17_results values ('admin sees only same-institution coordinator requests',
  (select count(*) from public.institutional_pending_registration_requests())=2);
do $admin_denials$
begin
  begin
    perform public.institutional_decide_registration_request(
      (select id from qa17_ids where name='request_student_a'),true);
    insert into qa17_results values ('admin does not resolve academic requests',false);
  exception when insufficient_privilege then
    insert into qa17_results values ('admin does not resolve academic requests',true);
  end;
  begin
    perform public.institutional_decide_registration_request(
      (select id from qa17_ids where name='request_coordinator_b'),true);
    insert into qa17_results values ('admin cannot approve cross-institution coordinator',false);
  exception when insufficient_privilege then
    insert into qa17_results values ('admin cannot approve cross-institution coordinator',true);
  end;
end
$admin_denials$;
select public.institutional_decide_registration_request(
  (select id from qa17_ids where name='request_coordinator_a'),true);
reset role;

insert into qa17_results values ('admin approval grants only coordinator',
  exists (select 1 from public.user_roles ur join public.roles role on role.id=ur.role_id
    join public.profiles p on p.id=ur.profile_id
    where p.id=(select id from qa17_ids where name='coordinator_a')
      and p.status='active' and role.code='coordinator')
  and (select count(*) from public.user_roles
    where profile_id=(select id from qa17_ids where name='coordinator_a'))=1);

set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from qa17_ids where name='coordinator_a'),true);
insert into qa17_results values ('coordinator sees only own student and teacher requests',
  (select count(*) from public.institutional_pending_registration_requests())=3);
do $coordinator_denials$
begin
  begin
    perform public.institutional_decide_registration_request(
      (select id from qa17_ids where name='request_coordinator_peer'),true);
    insert into qa17_results values ('coordinator cannot approve coordinator',false);
  exception when insufficient_privilege then
    insert into qa17_results values ('coordinator cannot approve coordinator',true);
  end;
  begin
    perform public.institutional_decide_registration_request(
      (select id from qa17_ids where name='request_student_b'),true);
    insert into qa17_results values ('coordinator cannot approve other institution',false);
  exception when insufficient_privilege then
    insert into qa17_results values ('coordinator cannot approve other institution',true);
  end;
end
$coordinator_denials$;
do $role_grants$
declare
  v_role text;
begin
  foreach v_role in array array['admin','hr'] loop
    begin
      insert into public.user_roles (profile_id,institution_id,role_id)
        values ((select id from qa17_ids where name='coordinator_a'),
          (select id from qa17_ids where name='ipn'),
          (select id from qa17_ids where name='role_'||v_role));
      insert into qa17_results values ('coordinator cannot grant '||v_role,false);
    exception when insufficient_privilege then
      insert into qa17_results values ('coordinator cannot grant '||v_role,true);
    end;
  end loop;
end
$role_grants$;
insert into qa17_results values ('coordinator has no role write privileges',
  not has_table_privilege('authenticated','public.user_roles','INSERT')
  and not has_table_privilege('authenticated','public.user_roles','UPDATE')
  and not has_table_privilege('authenticated','public.roles','INSERT'));
select public.institutional_decide_registration_request(
  (select id from qa17_ids where name='request_student_a'),true);
select public.institutional_decide_registration_request(
  (select id from qa17_ids where name='request_teacher_a'),true);
select public.institutional_decide_registration_request(
  (select id from qa17_ids where name='request_reject_a'),false);
reset role;

insert into qa17_results values ('student approval grants student',
  exists (select 1 from public.profiles p
    join public.user_roles ur on ur.profile_id=p.id
    join public.roles role on role.id=ur.role_id
    where p.id=(select id from qa17_ids where name='student_a')
      and p.status='active' and role.code='student'));
insert into qa17_results values ('teacher approval grants teacher',
  exists (select 1 from public.profiles p
    join public.user_roles ur on ur.profile_id=p.id
    join public.roles role on role.id=ur.role_id
    where p.id=(select id from qa17_ids where name='teacher_a')
      and p.status='active' and role.code='teacher'));
insert into qa17_results values ('rejection grants no role',
  exists (select 1 from public.registration_requests r
    join public.profiles p on p.id=r.profile_id
    where r.profile_id=(select id from qa17_ids where name='reject_a')
      and r.status='rejected' and p.status='inactive')
  and not exists (select 1 from public.user_roles
    where profile_id=(select id from qa17_ids where name='reject_a')));
insert into qa17_results values ('no group assignment from approval',
  not exists (select 1 from public.student_enrollments
    where student_id=(select id from qa17_ids where name='student_a'))
  and not exists (select 1 from public.teaching_assignments
    where teacher_id=(select id from qa17_ids where name='teacher_a')));
insert into qa17_results values ('new functions have guarded execution',
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in ('institutional_pending_registration_requests',
        'institutional_decide_registration_request')
      and pg_get_userbyid(p.proowner)='postgres'
      and p.prosecdef
      and p.proconfig @> array['search_path=""']::text[]
      and not has_function_privilege('anon',p.oid,'EXECUTE')
      and has_function_privilege('authenticated',p.oid,'EXECUTE'))=2);
insert into qa17_results values ('RLS remains enabled',
  (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in
      ('registration_requests','registration_request_subjects')
      and c.relrowsecurity)=2);
insert into qa17_results values ('no institutional password access',
  not has_table_privilege('authenticated','auth.users','SELECT')
  and not has_table_privilege('authenticated','auth.users','UPDATE')
  and not exists (select 1 from information_schema.columns
    where table_schema='public' and column_name ilike '%password%'));

select name, passed from qa17_results order by name;
do $assert$
begin
  if exists (select 1 from qa17_results where not passed) then
    raise exception 'Coordinator registration assertions failed';
  end if;
end
$assert$;
rollback;