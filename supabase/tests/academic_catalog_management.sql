-- PR #18: all fixture writes are transactional; no QA row is deleted or reset.
begin;
create temp table qa18_ids (name text primary key, id uuid not null) on commit drop;
create temp table qa18_results (name text primary key, passed boolean not null) on commit drop;
grant select, insert on qa18_ids, qa18_results to authenticated;

insert into qa18_results values
('7 active institutions', (select count(*) from public.institutions where active)=7),
('21 active campuses', (select count(*) from public.campuses where active)=21),
('3 campuses per institution', not exists (
  select 1 from public.institutions i where i.active and
    (select count(*) from public.campuses c where c.institution_id=i.id and c.active)<>3)),
('63 active catalog careers', (select count(*) from public.programs
  where active and catalog_visible)=63),
('3 careers per campus', not exists (
  select 1 from public.campuses c where c.active and
    (select count(*) from public.programs p where p.campus_id=c.id
      and p.active and p.catalog_visible)<>3)),
('no repeated career across campuses of one institution', not exists (
  select 1 from public.programs where active and catalog_visible
  group by institution_id,lower(name) having count(*)>1)),
('same career can exist in distinct institutions', (
  select count(distinct institution_id) from public.programs
  where name='Ingeniería Biomédica' and catalog_visible)>=2),
('five QA evaluations remain', (select count(*) from public.evaluations)=5),
('QA program is at Norte but outside public catalog', exists (
  select 1 from public.programs p join public.campuses c on c.id=p.campus_id
  where p.code='QA-ISC' and p.active and not p.catalog_visible
    and c.name='México Campus Norte')),
('QA average remains 8.7', (
  select round(avg(a.numeric_value),1) from public.evaluation_answers a
  join public.evaluations e on e.id=a.evaluation_id
  where e.status='completed')=8.7),
('RLS stays enabled', not exists (
  select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' and not c.relrowsecurity));

do $fixture$
declare
  ipn uuid; unam uuid;
  person_id uuid; actor_role text;
  person_name text;
begin
  select id into strict ipn from public.institutions where slug='ipn';
  select id into strict unam from public.institutions where slug='unam';
  insert into qa18_ids values ('ipn',ipn),('unam',unam);
  insert into qa18_ids
    select 'campus_a',id from public.campuses where institution_id=ipn and code='CAT-1';
  insert into qa18_ids
    select 'program_a',id from public.programs where institution_id=ipn and code='CAT-1-1';
  insert into qa18_ids
    select 'program_b',id from public.programs where institution_id=unam and code='CAT-1-1';
  foreach person_name in array array[
    'coordinator_a','teacher_a','student_a','teacher_b','student_b'
  ] loop
    person_id := gen_random_uuid();
    insert into qa18_ids values (person_name,person_id);
    insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
    values (person_id,'qa18.'||person_name||'@example.test',
      jsonb_build_object(
        'institution_id',case when person_name like '%_b' then unam else ipn end,
        'full_name','QA18 '||person_name,
        'institutional_identifier','QA18-'||person_name),now());
    update public.profiles set status='active' where id=person_id;
    actor_role := case when person_name='coordinator_a' then 'coordinator'
      when person_name like 'teacher%' then 'teacher' else 'student' end;
    insert into public.user_roles (profile_id,institution_id,role_id)
    select person_id,case when person_name like '%_b' then unam else ipn end,id
    from public.roles where code=actor_role;
  end loop;
  begin
    insert into public.programs (institution_id,campus_id,name,code)
    values (ipn,(select id from public.campuses where institution_id=unam and code='CAT-1'),
      'QA18 cross tenant','QA18-CROSS');
    insert into qa18_results values ('cross-institution campus-program FK rejects',false);
  exception when foreign_key_violation then
    insert into qa18_results values ('cross-institution campus-program FK rejects',true);
  end;
end
$fixture$;

set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from qa18_ids where name='coordinator_a'),true);
insert into qa18_results values ('coordinator sees only own catalog',
  (public.coordinator_academic_snapshot()->'campuses')::text is not null
  and jsonb_array_length(public.coordinator_academic_snapshot()->'campuses')=3
  and jsonb_array_length(public.coordinator_academic_snapshot()->'programs')=9);
insert into qa18_results values
  ('client lacks direct subject writes',
    not has_table_privilege('authenticated','public.subjects','INSERT')
    and not has_table_privilege('authenticated','public.groups','INSERT')),
  ('client lacks direct membership writes',
    not has_table_privilege('authenticated','public.teaching_assignments','INSERT')
    and not has_table_privilege('authenticated','public.student_enrollments','INSERT'));
insert into qa18_ids values ('period_a',public.coordinator_create_period(
  'QA18 Periodo temporal',now()-interval '1 day',now()+interval '30 days'));
insert into qa18_ids values ('subject_a',public.coordinator_create_subject(
  (select id from qa18_ids where name='program_a'),'QA18 Materia temporal','QA18-S'));
insert into qa18_results values ('coordinator creates subject in own institution',
  exists (select 1 from public.subjects s where s.id=(select id from qa18_ids where name='subject_a')
    and s.institution_id=(select id from qa18_ids where name='ipn')));
select public.coordinator_update_subject(
  (select id from qa18_ids where name='subject_a'),'QA18 Materia editada','QA18-S',true);
insert into qa18_results values ('coordinator edits subject',
  exists (select 1 from public.subjects where id=(select id from qa18_ids where name='subject_a')
    and name='QA18 Materia editada'));
insert into qa18_ids values ('group_a',public.coordinator_create_group(
  (select id from qa18_ids where name='subject_a'),
  (select id from qa18_ids where name='period_a'),'QA18-G'));
insert into qa18_results values ('coordinator creates compatible group',
  exists (select 1 from public.groups g where g.id=(select id from qa18_ids where name='group_a')
    and g.subject_id=(select id from qa18_ids where name='subject_a')));
reset role;
-- Approval records the initial selection but must not create a real membership.
insert into qa18_ids values ('teacher_request',gen_random_uuid()),('student_request',gen_random_uuid());
insert into public.registration_requests
  (id,profile_id,institution_id,campus_id,requested_role,program_id)
values
  ((select id from qa18_ids where name='teacher_request'),
   (select id from qa18_ids where name='teacher_a'),
   (select id from qa18_ids where name='ipn'),
   (select id from qa18_ids where name='campus_a'),'teacher',null),
  ((select id from qa18_ids where name='student_request'),
   (select id from qa18_ids where name='student_a'),
   (select id from qa18_ids where name='ipn'),
   (select id from qa18_ids where name='campus_a'),'student',
   (select id from qa18_ids where name='program_a'));
insert into public.registration_request_subjects (request_id,institution_id,subject_id)
values
  ((select id from qa18_ids where name='teacher_request'),
   (select id from qa18_ids where name='ipn'),
   (select id from qa18_ids where name='subject_a')),
  ((select id from qa18_ids where name='student_request'),
   (select id from qa18_ids where name='ipn'),
   (select id from qa18_ids where name='subject_a'));
do $approval_guard$
begin
  begin
    update public.campuses set active=false where id=(select id from qa18_ids where name='campus_a');
    update public.registration_requests
      set status='approved',decided_at=now()
      where id=(select id from qa18_ids where name='teacher_request');
    insert into qa18_results values ('inactive campus blocks request approval',false);
  exception when others then
    insert into qa18_results values ('inactive campus blocks request approval',true);
  end;
end
$approval_guard$;
update public.registration_requests set status='approved',decided_at=now()
where id in (select id from qa18_ids where name in ('teacher_request','student_request'));
insert into qa18_results values
  ('approval alone creates no teaching assignment',
    (select count(*) from public.teaching_assignments
      where teacher_id=(select id from qa18_ids where name='teacher_a'))=0),
  ('approval alone creates no student enrollment',
    (select count(*) from public.student_enrollments
      where student_id=(select id from qa18_ids where name='student_a'))=0);
set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from qa18_ids where name='coordinator_a'),true);
insert into qa18_ids values ('assignment_a',public.coordinator_assign_teacher(
  (select id from qa18_ids where name='group_a'),
  (select id from qa18_ids where name='teacher_a')));
insert into qa18_ids values ('enrollment_a',public.coordinator_enroll_student(
  (select id from qa18_ids where name='group_a'),
  (select id from qa18_ids where name='student_a')));
insert into qa18_results values ('teacher assigned in own institution',
  exists (select 1 from public.teaching_assignments where
    id=(select id from qa18_ids where name='assignment_a')));
insert into qa18_results values ('student enrolled in own institution',
  jsonb_array_length(public.coordinator_academic_snapshot()->'enrollments')=1);

do $denials$
begin
  begin
    perform public.coordinator_create_subject(
      (select id from qa18_ids where name='program_b'),'Cross','QA18-X');
    insert into qa18_results values ('coordinator cannot create subject in another institution',false);
  exception when others then
    insert into qa18_results values ('coordinator cannot create subject in another institution',true);
  end;
  begin
    perform public.coordinator_create_group(
      (select id from qa18_ids where name='program_b'),
      (select id from qa18_ids where name='period_a'),'QA18-X');
    insert into qa18_results values ('group rejects incompatible subject',false);
  exception when others then
    insert into qa18_results values ('group rejects incompatible subject',true);
  end;
  begin
    perform public.coordinator_assign_teacher(
      (select id from qa18_ids where name='group_a'),
      (select id from qa18_ids where name='teacher_b'));
    insert into qa18_results values ('external teacher rejected',false);
  exception when others then
    insert into qa18_results values ('external teacher rejected',true);
  end;
  begin
    perform public.coordinator_enroll_student(
      (select id from qa18_ids where name='group_a'),
      (select id from qa18_ids where name='student_b'));
    insert into qa18_results values ('external student rejected',false);
  exception when others then
    insert into qa18_results values ('external student rejected',true);
  end;
  begin
    perform public.coordinator_assign_teacher(
      (select id from qa18_ids where name='group_a'),
      (select id from qa18_ids where name='teacher_a'));
    insert into qa18_results values ('duplicate teaching assignment rejected',false);
  exception when unique_violation then
    insert into qa18_results values ('duplicate teaching assignment rejected',true);
  end;
  begin
    perform public.coordinator_enroll_student(
      (select id from qa18_ids where name='group_a'),
      (select id from qa18_ids where name='student_a'));
    insert into qa18_results values ('duplicate student enrollment rejected',false);
  exception when unique_violation then
    insert into qa18_results values ('duplicate student enrollment rejected',true);
  end;
end
$denials$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from qa18_ids where name='teacher_a'),true);
do $teacher_denial$
begin
  begin
    perform public.coordinator_create_subject(
      (select id from qa18_ids where name='program_a'),'No','QA18-NO');
    insert into qa18_results values ('teacher cannot call coordinator write RPC',false);
  exception when insufficient_privilege then
    insert into qa18_results values ('teacher cannot call coordinator write RPC',true);
  end;
end
$teacher_denial$;
reset role;

-- Approved registration choices remain binding on real group membership.
insert into qa18_ids
select 'program_other',id from public.programs
where institution_id=(select id from qa18_ids where name='ipn') and code='CAT-2-1';
insert into qa18_ids values ('subject_other',gen_random_uuid()),('group_other',gen_random_uuid());
insert into public.subjects (id,institution_id,program_id,name,code)
values ((select id from qa18_ids where name='subject_other'),
  (select id from qa18_ids where name='ipn'),
  (select id from qa18_ids where name='program_other'),
  'QA18 Otra materia','QA18-S2');
insert into public.groups (id,institution_id,subject_id,academic_period_id,code)
values ((select id from qa18_ids where name='group_other'),
  (select id from qa18_ids where name='ipn'),
  (select id from qa18_ids where name='subject_other'),
  (select id from qa18_ids where name='period_a'),'QA18-G2');

-- A newly approved teacher/student may move to a different subject/career
-- within the same institution; the original request stays as onboarding history.
set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from qa18_ids where name='coordinator_a'),true);
insert into qa18_ids values ('assignment_other',public.coordinator_assign_teacher(
  (select id from qa18_ids where name='group_other'),
  (select id from qa18_ids where name='teacher_a')));
insert into qa18_ids values ('enrollment_other',public.coordinator_enroll_student(
  (select id from qa18_ids where name='group_other'),
  (select id from qa18_ids where name='student_a')));
do $new_request_duplicates$
begin
  begin
    perform public.coordinator_assign_teacher(
      (select id from qa18_ids where name='group_other'),
      (select id from qa18_ids where name='teacher_a'));
    insert into qa18_results values ('new-request teacher duplicate rejected',false);
  exception when unique_violation then
    insert into qa18_results values ('new-request teacher duplicate rejected',true);
  end;
  begin
    perform public.coordinator_enroll_student(
      (select id from qa18_ids where name='group_other'),
      (select id from qa18_ids where name='student_a'));
    insert into qa18_results values ('new-request student duplicate rejected',false);
  exception when unique_violation then
    insert into qa18_results values ('new-request student duplicate rejected',true);
  end;
end
$new_request_duplicates$;
reset role;
insert into qa18_results values
  ('new teacher may teach another subject in same institution',
    exists (select 1 from public.teaching_assignments
      where id=(select id from qa18_ids where name='assignment_other')
        and institution_id=(select id from qa18_ids where name='ipn'))),
  ('new student may join another career in same institution',
    exists (select 1 from public.student_enrollments
      where id=(select id from qa18_ids where name='enrollment_other')
        and institution_id=(select id from qa18_ids where name='ipn'))),
  ('teacher onboarding request remains unchanged',
    exists (select 1 from public.registration_requests r
      join public.registration_request_subjects rs on rs.request_id=r.id
      where r.id=(select id from qa18_ids where name='teacher_request')
        and r.status='approved' and r.campus_id=(select id from qa18_ids where name='campus_a')
        and rs.subject_id=(select id from qa18_ids where name='subject_a'))),
  ('student onboarding request remains unchanged',
    exists (select 1 from public.registration_requests r
      join public.registration_request_subjects rs on rs.request_id=r.id
      where r.id=(select id from qa18_ids where name='student_request')
        and r.status='approved' and r.campus_id=(select id from qa18_ids where name='campus_a')
        and r.program_id=(select id from qa18_ids where name='program_a')
        and rs.subject_id=(select id from qa18_ids where name='subject_a'))),
  ('no onboarding restriction trigger on real memberships',
    not exists (select 1 from pg_trigger
      where tgname in ('teaching_assignments_validate_request',
        'student_enrollments_validate_request'))
    and to_regprocedure('app_private.validate_academic_membership_request()') is null);


-- Pre-campus approved QA requests also remain onboarding evidence and cannot
-- permanently pin active people to their original subject/program.
insert into qa18_ids values
  ('legacy_teacher',gen_random_uuid()),
  ('legacy_student',gen_random_uuid()),
  ('legacy_teacher_request',gen_random_uuid()),
  ('legacy_student_request',gen_random_uuid());
insert into auth.users (id,email,raw_user_meta_data,email_confirmed_at)
select id,'qa18.'||name||'@example.test',
  jsonb_build_object('institution_id',(select id from qa18_ids where name='ipn'),
    'full_name','QA18 '||name,'institutional_identifier','QA18-'||name),now()
from qa18_ids where name in ('legacy_teacher','legacy_student');
update public.profiles set status='active'
where id in (select id from qa18_ids where name in ('legacy_teacher','legacy_student'));
-- Historical approved people have roles from approval, not from Auth signup.
insert into public.user_roles (profile_id,institution_id,role_id)
select q.id,(select id from qa18_ids where name='ipn'),r.id
from qa18_ids q join public.roles r on r.code=case
  when q.name='legacy_teacher' then 'teacher' else 'student' end
where q.name in ('legacy_teacher','legacy_student');
insert into public.registration_requests
  (id,profile_id,institution_id,requested_role,program_id,status,decided_at)
values
  ((select id from qa18_ids where name='legacy_teacher_request'),
   (select id from qa18_ids where name='legacy_teacher'),
   (select id from qa18_ids where name='ipn'),'teacher',null,'approved',now()),
  ((select id from qa18_ids where name='legacy_student_request'),
   (select id from qa18_ids where name='legacy_student'),
   (select id from qa18_ids where name='ipn'),'student',
   (select id from qa18_ids where name='program_a'),'approved',now());
insert into public.registration_request_subjects (request_id,institution_id,subject_id)
values
  ((select id from qa18_ids where name='legacy_teacher_request'),
   (select id from qa18_ids where name='ipn'),
   (select id from qa18_ids where name='subject_a')),
  ((select id from qa18_ids where name='legacy_student_request'),
   (select id from qa18_ids where name='ipn'),
   (select id from qa18_ids where name='subject_a'));
set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from qa18_ids where name='coordinator_a'),true);
insert into qa18_ids values ('legacy_assignment',public.coordinator_assign_teacher(
  (select id from qa18_ids where name='group_other'),
  (select id from qa18_ids where name='legacy_teacher')));
insert into qa18_ids values ('legacy_enrollment',public.coordinator_enroll_student(
  (select id from qa18_ids where name='group_other'),
  (select id from qa18_ids where name='legacy_student')));
insert into qa18_results values
  ('legacy teacher can teach a new subject in own institution',
    exists (select 1 from public.teaching_assignments
      where id=(select id from qa18_ids where name='legacy_assignment'))),
  ('legacy student can join a new career in own institution',
    exists (select 1 from jsonb_array_elements(
      public.coordinator_academic_snapshot()->'enrollments') entry
      where entry->>'id'=(select id::text from qa18_ids
        where name='legacy_enrollment')));
do $legacy_duplicates$
begin
  begin
    perform public.coordinator_assign_teacher(
      (select id from qa18_ids where name='group_other'),
      (select id from qa18_ids where name='legacy_teacher'));
    insert into qa18_results values ('legacy teacher duplicate rejected',false);
  exception when unique_violation then
    insert into qa18_results values ('legacy teacher duplicate rejected',true);
  end;
  begin
    perform public.coordinator_enroll_student(
      (select id from qa18_ids where name='group_other'),
      (select id from qa18_ids where name='legacy_student'));
    insert into qa18_results values ('legacy student duplicate rejected',false);
  exception when unique_violation then
    insert into qa18_results values ('legacy student duplicate rejected',true);
  end;
end
$legacy_duplicates$;
reset role;

insert into qa18_results values ('new RPC permissions guarded',
  not has_function_privilege('anon','public.coordinator_create_subject(uuid,text,text)','EXECUTE')
  and not has_function_privilege('public','public.coordinator_create_subject(uuid,text,text)','EXECUTE')
  and has_function_privilege('authenticated','public.coordinator_create_subject(uuid,text,text)','EXECUTE'));
insert into qa18_results values ('QA evaluations still five after operations',
  (select count(*) from public.evaluations)=5);

select name,passed from qa18_results order by name;
do $assert$
begin
  if exists (select 1 from qa18_results where not passed) then
    raise exception 'PR18 academic catalog test failed';
  end if;
end
$assert$;
rollback;
