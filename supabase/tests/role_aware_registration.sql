-- Every fixture and decision is rolled back; the presentation data remains intact.
begin;
create temp table qa_ids (name text primary key, id uuid not null) on commit drop;
create temp table qa_results (name text primary key, passed boolean not null) on commit drop;
grant select on qa_ids to authenticated;
grant select, insert on qa_results to authenticated;

do $fixture$
declare
  ipn uuid;
  unam uuid;
  program_a uuid := 'a1000000-0000-4000-8000-000000000001';
  program_b uuid := 'a1000000-0000-4000-8000-000000000002';
  subject_a1 uuid := 'a2000000-0000-4000-8000-000000000001';
  subject_a2 uuid := 'a2000000-0000-4000-8000-000000000002';
  subject_b uuid := 'a2000000-0000-4000-8000-000000000003';
  student_a uuid := 'a3000000-0000-4000-8000-000000000001';
  teacher_a uuid := 'a3000000-0000-4000-8000-000000000002';
  reject_a uuid := 'a3000000-0000-4000-8000-000000000003';
  student_b uuid := 'a3000000-0000-4000-8000-000000000004';
  coordinator_a uuid := 'a3000000-0000-4000-8000-000000000005';
  legacy_a uuid := 'a3000000-0000-4000-8000-000000000006';
  base jsonb;
  requested jsonb;
  role_code text;
begin
  select id into strict ipn from public.institutions where slug = 'ipn';
  select id into strict unam from public.institutions where slug = 'unam';
  insert into qa_ids values
    ('ipn',ipn),('unam',unam),('program_a',program_a),('program_b',program_b),
    ('subject_a1',subject_a1),('subject_a2',subject_a2),('subject_b',subject_b),
    ('student_a',student_a),('teacher_a',teacher_a),('reject_a',reject_a),
    ('student_b',student_b),('coordinator_a',coordinator_a),('legacy_a',legacy_a);

  insert into public.programs (id,institution_id,name,code)
    values (program_a,ipn,'QA Programa A','QA16-A'),
           (program_b,unam,'QA Programa B','QA16-B');
  insert into public.subjects (id,institution_id,program_id,name,code)
    values (subject_a1,ipn,program_a,'QA Materia A1','QA16-A1'),
           (subject_a2,ipn,program_a,'QA Materia A2','QA16-A2'),
           (subject_b,unam,program_b,'QA Materia B','QA16-B');

  base := pg_catalog.jsonb_build_object(
    'institution_id',ipn::text,'full_name','QA Solicitante',
    'institutional_identifier','QA16-S');
  requested := base || pg_catalog.jsonb_build_object(
    'requested_role','student','requested_program_id',program_a::text,
    'requested_subject_ids',pg_catalog.jsonb_build_array(subject_a1::text,subject_a2::text));
  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (student_a,'qa16.student@example.test',requested,now());
  insert into qa_results values ('student request created', exists (
    select 1 from public.registration_requests r join public.profiles p on p.id=r.profile_id
    where r.profile_id=student_a and r.requested_role='student'
      and r.program_id=program_a and r.status='pending' and p.status='pending'));
  insert into qa_results values ('multiple subjects normalized', (
    select count(*) from public.registration_request_subjects rs
    join public.registration_requests r on r.id=rs.request_id
    where r.profile_id=student_a)=2);
  insert into qa_results values ('request metadata removed after normalization', not exists (
    select 1 from auth.users u where u.id=student_a and (
      u.raw_user_meta_data ? 'requested_role' or
      u.raw_user_meta_data ? 'requested_program_id' or
      u.raw_user_meta_data ? 'requested_subject_ids')));
  insert into qa_results values ('student pending has no role', not exists (
    select 1 from public.user_roles where profile_id=student_a));

  requested := base || pg_catalog.jsonb_build_object(
    'institutional_identifier','QA16-T',
    'requested_role','teacher',
    'requested_subject_ids',pg_catalog.jsonb_build_array(subject_a1::text,subject_a2::text));
  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (teacher_a,'qa16.teacher@example.test',requested,now());
  insert into qa_results values ('teacher request created', exists (
    select 1 from public.registration_requests r where r.profile_id=teacher_a
      and r.requested_role='teacher' and r.program_id is null and r.status='pending'));
  insert into qa_results values ('teacher pending has no teacher role', not exists (
    select 1 from public.user_roles where profile_id=teacher_a));

  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (reject_a,'qa16.reject@example.test',
      (base || pg_catalog.jsonb_build_object(
        'institutional_identifier','QA16-R',
        'requested_role','student','requested_program_id',program_a::text,
        'requested_subject_ids',pg_catalog.jsonb_build_array(subject_a1::text))),now());

  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (student_b,'qa16.other@example.test',
      pg_catalog.jsonb_build_object(
        'institution_id',unam::text,'full_name','QA Otra Institución',
        'institutional_identifier','QA16-B',
        'requested_role','student','requested_program_id',program_b::text,
        'requested_subject_ids',pg_catalog.jsonb_build_array(subject_b::text)),now());

  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (coordinator_a,'qa16.admin@example.test',
      (base || pg_catalog.jsonb_build_object('institutional_identifier','QA16-ADMIN')),now());
  update public.profiles set status='active' where id=coordinator_a;
  insert into public.user_roles (profile_id,institution_id,role_id)
    select coordinator_a,ipn,id from public.roles where code='coordinator';

  insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (legacy_a,'qa16.legacy@example.test',
      base || pg_catalog.jsonb_build_object(
        'institutional_identifier','QA16-LEGACY','role','admin'),now());
  insert into qa_results values ('legacy account still pending student', exists (
    select 1 from public.profiles p
    join public.user_roles ur on ur.profile_id=p.id
    join public.roles role on role.id=ur.role_id
    where p.id=legacy_a and p.status='pending' and role.code='student'
  ) and not exists (
    select 1 from public.registration_requests where profile_id=legacy_a
  ));

  foreach role_code in array array['admin','hr'] loop
    begin
      insert into auth.users (id,email,raw_user_meta_data)
        values (gen_random_uuid(),'qa16.invalid.'||role_code||'@example.test',
          base || pg_catalog.jsonb_build_object(
            'institutional_identifier','QA16-'||role_code,
            'requested_role',role_code,
            'requested_subject_ids',pg_catalog.jsonb_build_array(subject_a1::text)));
      insert into qa_results values ('reject '||role_code,false);
    exception when others then
      insert into qa_results values ('reject '||role_code,true);
    end;
  end loop;

  begin
    insert into auth.users (id,email,raw_user_meta_data)
      values (gen_random_uuid(),'qa16.crossprogram@example.test',
        base || pg_catalog.jsonb_build_object(
          'institutional_identifier','QA16-CP','requested_role','student',
          'requested_program_id',program_b::text,
          'requested_subject_ids',pg_catalog.jsonb_build_array(subject_a1::text)));
    insert into qa_results values ('cross institution program rejected',false);
  exception when others then
    insert into qa_results values ('cross institution program rejected',true);
  end;
  begin
    insert into auth.users (id,email,raw_user_meta_data)
      values (gen_random_uuid(),'qa16.crosssubject@example.test',
        base || pg_catalog.jsonb_build_object(
          'institutional_identifier','QA16-CS','requested_role','student',
          'requested_program_id',program_a::text,
          'requested_subject_ids',pg_catalog.jsonb_build_array(subject_b::text)));
    insert into qa_results values ('cross institution subject rejected',false);
  exception when others then
    insert into qa_results values ('cross institution subject rejected',true);
  end;
  begin
    insert into auth.users (id,email,raw_user_meta_data)
      values (gen_random_uuid(),'qa16.missing@example.test',
        base || pg_catalog.jsonb_build_object(
          'institutional_identifier','QA16-MISS','requested_role','teacher',
          'requested_subject_ids',pg_catalog.jsonb_build_array()));
    insert into qa_results values ('empty subject request rejected',false);
  exception when others then
    insert into qa_results values ('empty subject request rejected',true);
  end;

  update auth.users set raw_user_meta_data =
    raw_user_meta_data || '{"requested_role":"admin","role":"admin"}'::jsonb
    where id=teacher_a;
  insert into qa_results values ('metadata edit cannot grant role', not exists (
    select 1 from public.user_roles where profile_id=teacher_a));
  insert into qa_ids (name,id)
    select 'request_'||q.name,r.id from public.registration_requests r
    join qa_ids q on q.id=r.profile_id
    where q.name in ('student_a','teacher_a','reject_a','student_b');
end
$fixture$;

set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from qa_ids where name='teacher_a'),true);
insert into qa_results values ('pending user sees own request', (
  select count(*) from public.registration_requests)=1);
insert into qa_results values ('nonadmin list is empty', not exists (
  select 1 from public.institutional_pending_registration_requests()));
do $unauthorized$
begin
  begin
    perform public.institutional_decide_registration_request(
      (select id from qa_ids where name='request_student_a'),true);
    insert into qa_results values ('nonadmin cannot approve',false);
  exception when insufficient_privilege then
    insert into qa_results values ('nonadmin cannot approve',true);
  end;
end
$unauthorized$;
reset role;

insert into qa_results values ('request table has no client writes',
  not has_table_privilege('authenticated','public.registration_requests','INSERT')
  and not has_table_privilege('authenticated','public.registration_requests','UPDATE')
  and not has_table_privilege('authenticated','public.registration_request_subjects','INSERT'));

set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from qa_ids where name='coordinator_a'),true);
insert into qa_results values ('coordinator list tenant scoped', (
  select count(*) from public.institutional_pending_registration_requests())=3);
do $cross$
begin
  begin
    perform public.institutional_decide_registration_request(
      (select id from qa_ids where name='request_student_b'),true);
    insert into qa_results values ('cross tenant approval rejected',false);
  exception when insufficient_privilege then
    insert into qa_results values ('cross tenant approval rejected',true);
  end;
end
$cross$;
select public.institutional_decide_registration_request(
  (select id from qa_ids where name='request_teacher_a'),true);
select public.institutional_decide_registration_request(
  (select id from qa_ids where name='request_student_a'),true);
select public.institutional_decide_registration_request(
  (select id from qa_ids where name='request_reject_a'),false);
reset role;

insert into qa_results values ('teacher approval grants teacher', exists (
  select 1 from public.profiles p
  join public.user_roles ur on ur.profile_id=p.id
  join public.roles role on role.id=ur.role_id
  where p.id=(select id from qa_ids where name='teacher_a')
    and p.status='active' and role.code='teacher'
) and not exists (
  select 1 from public.user_roles ur join public.roles role on role.id=ur.role_id
  where ur.profile_id=(select id from qa_ids where name='teacher_a') and role.code='student'));
insert into qa_results values ('student approval grants student', exists (
  select 1 from public.profiles p
  join public.user_roles ur on ur.profile_id=p.id
  join public.roles role on role.id=ur.role_id
  where p.id=(select id from qa_ids where name='student_a')
    and p.status='active' and role.code='student'));
insert into qa_results values ('rejection never activates profile', exists (
  select 1 from public.registration_requests r
  join public.profiles p on p.id=r.profile_id
  where r.profile_id=(select id from qa_ids where name='reject_a')
    and r.status='rejected' and p.status='inactive')
  and not exists (
    select 1 from public.user_roles where profile_id=(select id from qa_ids where name='reject_a')));
insert into qa_results values ('requests never create groups', not exists (
  select 1 from public.student_enrollments
  where student_id in (select id from qa_ids where name in ('student_a','reject_a'))
) and not exists (
  select 1 from public.teaching_assignments
  where teacher_id=(select id from qa_ids where name='teacher_a')));
insert into qa_results values ('RLS stays enabled on request tables', (
  select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in
    ('registration_requests','registration_request_subjects') and c.relrowsecurity)=2);

select name,passed from qa_results order by name;
do $assert$
begin
  if exists (select 1 from qa_results where not passed) then
    raise exception 'Role-aware registration assertions failed';
  end if;
end
$assert$;
rollback;