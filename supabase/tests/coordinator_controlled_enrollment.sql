-- PR #25: all fixture users, empty catalog rows, groups and memberships roll back.
begin;
create temp table qa25_ids (name text primary key, id uuid not null) on commit drop;
create temp table qa25_results (name text primary key, passed boolean not null) on commit drop;
grant select, insert on qa25_ids, qa25_results to authenticated;

insert into qa25_ids values
  ('ipn', (select id from public.institutions where slug='ipn')),
  ('unam', (select id from public.institutions where slug='unam')),
  ('campus_real', (select c.id from public.campuses c
    join public.institutions i on i.id=c.institution_id
    where i.slug='ipn' and c.code='CAT-1')),
  ('subject_real', (select s.id from public.subjects s
    join public.institutions i on i.id=s.institution_id
    where i.slug='ipn' and s.code='IPN-C1-P1-M1')),
  ('campus_empty',gen_random_uuid()),
  ('program_empty',gen_random_uuid()),
  ('student',gen_random_uuid()),
  ('teacher',gen_random_uuid()),
  ('coordinator',gen_random_uuid()),
  ('other_student',gen_random_uuid()),
  ('other_teacher',gen_random_uuid());

insert into public.campuses (id,institution_id,name,code)
select (select id from qa25_ids where name='campus_empty'),
  (select id from qa25_ids where name='ipn'), 'QA25 Campus sin oferta','QA25-C'
;
insert into public.programs (id,institution_id,campus_id,name,code)
select (select id from qa25_ids where name='program_empty'),
  (select id from qa25_ids where name='ipn'),
  (select id from qa25_ids where name='campus_real'),
  'QA25 Carrera sin materias','QA25-P'
;
insert into qa25_results values
  ('empty program has zero subjects',
    not exists (select 1 from public.subjects
      where program_id=(select id from qa25_ids where name='program_empty'))),
  ('empty campus has zero programs',
    not exists (select 1 from public.programs
      where campus_id=(select id from qa25_ids where name='campus_empty')));

insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
values
  ((select id from qa25_ids where name='student'),'qa25.student@example.test',
    jsonb_build_object('institution_id',(select id::text from qa25_ids where name='ipn'),
      'full_name','QA25 Estudiante','institutional_identifier','QA25-S',
      'requested_role','student',
      'requested_campus_id',(select id::text from qa25_ids where name='campus_real'),
      'requested_program_id',(select id::text from qa25_ids where name='program_empty'),
      'role','admin'),now()),
  ((select id from qa25_ids where name='teacher'),'qa25.teacher@example.test',
    jsonb_build_object('institution_id',(select id::text from qa25_ids where name='ipn'),
      'full_name','QA25 Docente','institutional_identifier','QA25-T',
      'requested_role','teacher',
      'requested_campus_id',(select id::text from qa25_ids where name='campus_empty'),
      'requested_subject_ids','[]'::jsonb,
      'role','admin'),now());

insert into qa25_results values
  ('student and teacher requests pending without subjects',
    (select count(*) from public.registration_requests
      where profile_id in (select id from qa25_ids where name in ('student','teacher'))
        and status='pending')=2
    and not exists (select 1 from public.registration_request_subjects rs
      join public.registration_requests r on r.id=rs.request_id
      where r.profile_id in (select id from qa25_ids where name in ('student','teacher')))),
  ('pending profiles have no academic roles or memberships',
    (select count(*) from public.profiles
      where id in (select id from qa25_ids where name in ('student','teacher'))
        and status='pending')=2
    and not exists (select 1 from public.user_roles
      where profile_id in (select id from qa25_ids where name in ('student','teacher')))
    and not exists (select 1 from public.student_enrollments
      where student_id=(select id from qa25_ids where name='student'))
    and not exists (select 1 from public.teaching_assignments
      where teacher_id=(select id from qa25_ids where name='teacher'))),
  ('privileged metadata did not grant admin',
    not exists (select 1 from public.user_roles ur
      join public.roles r on r.id=ur.role_id and r.code='admin'
      where ur.profile_id in (select id from qa25_ids where name in ('student','teacher'))));

-- Transaction-only coordinator and cross-tenant actors; no public account creation.
insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
values
  ((select id from qa25_ids where name='coordinator'),'qa25.coordinator@example.test',
    jsonb_build_object('institution_id',(select id::text from qa25_ids where name='ipn'),
      'full_name','QA25 Coordinador','institutional_identifier','QA25-C'),now()),
  ((select id from qa25_ids where name='other_student'),'qa25.other.student@example.test',
    jsonb_build_object('institution_id',(select id::text from qa25_ids where name='unam'),
      'full_name','QA25 Otro estudiante','institutional_identifier','QA25-OS'),now()),
  ((select id from qa25_ids where name='other_teacher'),'qa25.other.teacher@example.test',
    jsonb_build_object('institution_id',(select id::text from qa25_ids where name='unam'),
      'full_name','QA25 Otro docente','institutional_identifier','QA25-OT'),now());
update public.profiles set status='active'
where id in (select id from qa25_ids
  where name in ('coordinator','other_student','other_teacher'));
insert into public.user_roles (profile_id,institution_id,role_id)
select q.id,p.institution_id,r.id
from qa25_ids q
join public.profiles p on p.id=q.id
join public.roles r on r.code=case q.name
  when 'coordinator' then 'coordinator'
  when 'other_student' then 'student'
  when 'other_teacher' then 'teacher' end
where q.name in ('coordinator','other_student','other_teacher');

insert into qa25_ids (name,id)
select case r.requested_role when 'student' then 'student_request' else 'teacher_request' end, r.id
from public.registration_requests r
where r.profile_id in (select id from qa25_ids where name in ('student','teacher'));

set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from qa25_ids where name='student'),true);
insert into qa25_results values ('pending student sees no enrollments',
  (select count(*) from public.my_student_enrollments())=0);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from qa25_ids where name='coordinator'),true);
select public.institutional_decide_registration_request(
  (select id from qa25_ids where name='student_request'),true);
select public.institutional_decide_registration_request(
  (select id from qa25_ids where name='teacher_request'),true);
reset role;

insert into qa25_results values
  ('approval grants only student and teacher roles',
    (select count(*) from public.profiles
      where id in (select id from qa25_ids where name in ('student','teacher'))
        and status='active')=2
    and (select count(*) from public.user_roles ur
      join public.roles r on r.id=ur.role_id
      where ur.profile_id in (select id from qa25_ids where name in ('student','teacher'))
        and r.code in ('student','teacher'))=2),
  ('approval alone creates no assignment or enrollment',
    not exists (select 1 from public.student_enrollments
      where student_id=(select id from qa25_ids where name='student'))
    and not exists (select 1 from public.teaching_assignments
      where teacher_id=(select id from qa25_ids where name='teacher'))),
  ('onboarding evidence remains unchanged',
    exists (select 1 from public.registration_requests
      where profile_id=(select id from qa25_ids where name='student')
        and program_id=(select id from qa25_ids where name='program_empty')
        and status='approved')
    and exists (select 1 from public.registration_requests
      where profile_id=(select id from qa25_ids where name='teacher')
        and campus_id=(select id from qa25_ids where name='campus_empty')
        and status='approved')
    and not exists (select 1 from public.registration_request_subjects rs
      join public.registration_requests r on r.id=rs.request_id
      where r.profile_id in (select id from qa25_ids where name in ('student','teacher'))));

set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from qa25_ids where name='student'),true);
insert into qa25_results values ('approved student without groups sees empty enrollment catalog',
  (select count(*) from public.my_student_enrollments())=0);
do $student_denied$
begin
  begin
    perform public.coordinator_enroll_student(
      (select id from qa25_ids where name='subject_real'),
      (select id from qa25_ids where name='student'));
    insert into qa25_results values ('student cannot self enroll',false);
  exception when insufficient_privilege then
    insert into qa25_results values ('student cannot self enroll',true);
  end;
end $student_denied$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from qa25_ids where name='teacher'),true);
do $teacher_denied$
begin
  begin
    perform public.coordinator_assign_teacher(
      (select id from qa25_ids where name='subject_real'),
      (select id from qa25_ids where name='teacher'));
    insert into qa25_results values ('teacher cannot self assign',false);
  exception when insufficient_privilege then
    insert into qa25_results values ('teacher cannot self assign',true);
  end;
end $teacher_denied$;
reset role;

insert into qa25_results values
  ('clients lack direct membership inserts',
    not has_table_privilege('authenticated','public.student_enrollments','INSERT')
    and not has_table_privilege('authenticated','public.teaching_assignments','INSERT'));

set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from qa25_ids where name='coordinator'),true);
insert into qa25_ids values ('period',public.coordinator_create_period(
  'QA25 Periodo temporal',now()-interval '1 day',now()+interval '30 days'));
insert into qa25_ids values ('group',public.coordinator_create_group(
  (select id from qa25_ids where name='subject_real'),
  (select id from qa25_ids where name='period'),'QA25-GROUP'));
insert into qa25_ids values ('enrollment',public.coordinator_enroll_student(
  (select id from qa25_ids where name='group'),
  (select id from qa25_ids where name='student')));
insert into qa25_ids values ('assignment',public.coordinator_assign_teacher(
  (select id from qa25_ids where name='group'),
  (select id from qa25_ids where name='teacher')));
reset role;
insert into qa25_results values
  ('coordinator enrolls student despite different requested program',
    exists (select 1 from public.student_enrollments e
      join public.groups g on g.id=e.group_id
      join public.subjects s on s.id=g.subject_id
      where e.id=(select id from qa25_ids where name='enrollment')
        and e.student_id=(select id from qa25_ids where name='student')
        and s.program_id<>(select id from qa25_ids where name='program_empty'))),
  ('coordinator assigns teacher despite different requested campus',
    exists (select 1 from public.teaching_assignments ta
      join public.groups g on g.id=ta.group_id
      join public.subjects s on s.id=g.subject_id
      join public.programs p on p.id=s.program_id
      where ta.id=(select id from qa25_ids where name='assignment')
        and ta.teacher_id=(select id from qa25_ids where name='teacher')
        and p.campus_id<>(select id from qa25_ids where name='campus_empty')));

set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from qa25_ids where name='coordinator'),true);
do $boundary$
begin
  begin
    perform public.coordinator_enroll_student(
      (select id from qa25_ids where name='group'),
      (select id from qa25_ids where name='other_student'));
    insert into qa25_results values ('cross-institution student rejected',false);
  exception when sqlstate '22023' then
    insert into qa25_results values ('cross-institution student rejected',true);
  end;
  begin
    perform public.coordinator_assign_teacher(
      (select id from qa25_ids where name='group'),
      (select id from qa25_ids where name='other_teacher'));
    insert into qa25_results values ('cross-institution teacher rejected',false);
  exception when sqlstate '22023' then
    insert into qa25_results values ('cross-institution teacher rejected',true);
  end;
  begin
    perform public.coordinator_enroll_student(
      (select id from qa25_ids where name='group'),
      (select id from qa25_ids where name='student'));
    insert into qa25_results values ('duplicate enrollment rejected',false);
  exception when unique_violation then
    insert into qa25_results values ('duplicate enrollment rejected',true);
  end;
  begin
    perform public.coordinator_assign_teacher(
      (select id from qa25_ids where name='group'),
      (select id from qa25_ids where name='teacher'));
    insert into qa25_results values ('duplicate assignment rejected',false);
  exception when unique_violation then
    insert into qa25_results values ('duplicate assignment rejected',true);
  end;
end $boundary$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from qa25_ids where name='student'),true);
insert into qa25_results values ('student reads only own real enrollment without evaluation window',
  (select count(*) from public.my_student_enrollments()
    where enrollment_id=(select id from qa25_ids where name='enrollment')
      and subject_code='IPN-C1-P1-M1' and group_code='QA25-GROUP')=1
  and (select count(*) from public.my_student_evaluations())=0);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from qa25_ids where name='other_student'),true);
insert into qa25_results values ('other institution cannot read enrollment',
  (select count(*) from public.my_student_enrollments())=0);
reset role;

insert into qa25_results values ('membership tables retain RLS',
  (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in
      ('student_enrollments','teaching_assignments') and c.relrowsecurity)=2);

select name,passed from qa25_results order by name;
do $assert$
begin
  if exists (select 1 from qa25_results where not passed) then
    raise exception 'PR25 controlled enrollment regression failed';
  end if;
end $assert$;
rollback;

