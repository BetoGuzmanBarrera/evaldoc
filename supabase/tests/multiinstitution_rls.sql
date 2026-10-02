-- Fictional cross-tenant fixtures. Run with psql against local EvalDoc only.
-- Every insert and role change is rolled back, leaving the seed untouched.
begin;

create temp table audit_ids (label text primary key, id uuid not null) on commit drop;
create temp table audit_results (
  test_name text primary key,
  passed boolean not null
) on commit drop;
grant select on audit_ids to anon, authenticated;
grant select, insert on audit_results to anon, authenticated;

insert into audit_ids (label, id) values
  ('student_a', '10000000-0000-4000-8000-000000000001'),
  ('student_b', '10000000-0000-4000-8000-000000000002'),
  ('teacher_a', '10000000-0000-4000-8000-000000000003'),
  ('teacher_b', '10000000-0000-4000-8000-000000000004'),
  ('coordinator_a', '10000000-0000-4000-8000-000000000005'),
  ('hr_a', '10000000-0000-4000-8000-000000000006'),
  ('admin_a', '10000000-0000-4000-8000-000000000007'),
  ('pending_a', '10000000-0000-4000-8000-000000000008'),
  ('no_role_a', '10000000-0000-4000-8000-000000000009'),
  ('campus_a', '20000000-0000-4000-8000-000000000001'),
  ('campus_b', '20000000-0000-4000-8000-000000000002'),
  ('period_a', '30000000-0000-4000-8000-000000000001'),
  ('period_b', '30000000-0000-4000-8000-000000000002'),
  ('program_a', '40000000-0000-4000-8000-000000000001'),
  ('program_b', '40000000-0000-4000-8000-000000000002'),
  ('subject_a', '50000000-0000-4000-8000-000000000001'),
  ('subject_b', '50000000-0000-4000-8000-000000000002'),
  ('group_a', '60000000-0000-4000-8000-000000000001'),
  ('group_b', '60000000-0000-4000-8000-000000000002'),
  ('assignment_a', '70000000-0000-4000-8000-000000000001'),
  ('assignment_b', '70000000-0000-4000-8000-000000000002'),
  ('template_a', '90000000-0000-4000-8000-000000000001'),
  ('template_b', '90000000-0000-4000-8000-000000000002'),
  ('template_global', '90000000-0000-4000-8000-000000000003'),
  ('question_a', 'a0000000-0000-4000-8000-000000000001'),
  ('question_b', 'a0000000-0000-4000-8000-000000000002'),
  ('question_global', 'a0000000-0000-4000-8000-000000000003'),
  ('window_a', 'b0000000-0000-4000-8000-000000000001'),
  ('window_b', 'b0000000-0000-4000-8000-000000000002'),
  ('window_global_a', 'b0000000-0000-4000-8000-000000000003'),
  ('evaluation_a', 'c0000000-0000-4000-8000-000000000001'),
  ('evaluation_b', 'c0000000-0000-4000-8000-000000000002');

do $fixture$
declare
  institution_a uuid;
  institution_b uuid;
begin
  select id into strict institution_a from public.institutions where slug = 'ipn';
  select id into strict institution_b from public.institutions where slug = 'unam';

  insert into auth.users (id, email, raw_user_meta_data) values
    ('10000000-0000-4000-8000-000000000001', 'rls-audit-student-a@example.test',
      jsonb_build_object('institution_id', institution_a::text, 'full_name', 'Student A',
        'institutional_identifier', 'RLS-STUDENT-A', 'role', 'admin')),
    ('10000000-0000-4000-8000-000000000002', 'rls-audit-student-b@example.test',
      jsonb_build_object('institution_id', institution_b::text, 'full_name', 'Student B',
        'institutional_identifier', 'RLS-STUDENT-B')),
    ('10000000-0000-4000-8000-000000000003', 'rls-audit-teacher-a@example.test',
      jsonb_build_object('institution_id', institution_a::text, 'full_name', 'Teacher A',
        'institutional_identifier', 'RLS-TEACHER-A')),
    ('10000000-0000-4000-8000-000000000004', 'rls-audit-teacher-b@example.test',
      jsonb_build_object('institution_id', institution_b::text, 'full_name', 'Teacher B',
        'institutional_identifier', 'RLS-TEACHER-B')),
    ('10000000-0000-4000-8000-000000000005', 'rls-audit-coordinator-a@example.test',
      jsonb_build_object('institution_id', institution_a::text, 'full_name', 'Coordinator A',
        'institutional_identifier', 'RLS-COORDINATOR-A')),
    ('10000000-0000-4000-8000-000000000006', 'rls-audit-hr-a@example.test',
      jsonb_build_object('institution_id', institution_a::text, 'full_name', 'HR A',
        'institutional_identifier', 'RLS-HR-A')),
    ('10000000-0000-4000-8000-000000000007', 'rls-audit-admin-a@example.test',
      jsonb_build_object('institution_id', institution_a::text, 'full_name', 'Admin A',
        'institutional_identifier', 'RLS-ADMIN-A')),
    ('10000000-0000-4000-8000-000000000008', 'rls-audit-pending-a@example.test',
      jsonb_build_object('institution_id', institution_a::text, 'full_name', 'Pending A',
        'institutional_identifier', 'RLS-PENDING-A')),
    ('10000000-0000-4000-8000-000000000009', 'rls-audit-no-role-a@example.test',
      jsonb_build_object('institution_id', institution_a::text, 'full_name', 'No Role A',
        'institutional_identifier', 'RLS-NO-ROLE-A'));

  update public.profiles set status = 'active'
    where institutional_email like 'rls-audit-%'
      and id <> '10000000-0000-4000-8000-000000000008';

  delete from public.user_roles
    where profile_id in (
      '10000000-0000-4000-8000-000000000003',
      '10000000-0000-4000-8000-000000000004',
      '10000000-0000-4000-8000-000000000005',
      '10000000-0000-4000-8000-000000000006',
      '10000000-0000-4000-8000-000000000007',
      '10000000-0000-4000-8000-000000000009'
    );

  insert into public.user_roles (profile_id, role_id, institution_id)
  select v.profile_id, r.id, p.institution_id
  from (values
    ('10000000-0000-4000-8000-000000000003'::uuid, 'teacher'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'teacher'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'coordinator'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'hr'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'admin')
  ) v(profile_id, role_code)
  join public.profiles p on p.id = v.profile_id
  join public.roles r on r.code = v.role_code;

  insert into public.campuses (id, institution_id, name, code) values
    ('20000000-0000-4000-8000-000000000001', institution_a, 'Campus A', 'CA'),
    ('20000000-0000-4000-8000-000000000002', institution_b, 'Campus B', 'CB');
  insert into public.academic_periods
    (id, institution_id, name, starts_at, ends_at) values
    ('30000000-0000-4000-8000-000000000001', institution_a, '2026 A',
      '2026-01-01', '2026-12-31'),
    ('30000000-0000-4000-8000-000000000002', institution_b, '2026 B',
      '2026-01-01', '2026-12-31');
  insert into public.programs (id, institution_id, campus_id, name, code) values
    ('40000000-0000-4000-8000-000000000001', institution_a,
      '20000000-0000-4000-8000-000000000001', 'Program A', 'PA'),
    ('40000000-0000-4000-8000-000000000002', institution_b,
      '20000000-0000-4000-8000-000000000002', 'Program B', 'PB');
  insert into public.subjects (id, institution_id, program_id, name, code) values
    ('50000000-0000-4000-8000-000000000001', institution_a,
      '40000000-0000-4000-8000-000000000001', 'Subject A', 'SA'),
    ('50000000-0000-4000-8000-000000000002', institution_b,
      '40000000-0000-4000-8000-000000000002', 'Subject B', 'SB');
  insert into public.groups
    (id, institution_id, subject_id, academic_period_id, code) values
    ('60000000-0000-4000-8000-000000000001', institution_a,
      '50000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001', 'GA'),
    ('60000000-0000-4000-8000-000000000002', institution_b,
      '50000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000002', 'GB');
  insert into public.teaching_assignments
    (id, institution_id, teacher_id, group_id, academic_period_id) values
    ('70000000-0000-4000-8000-000000000001', institution_a,
      '10000000-0000-4000-8000-000000000003',
      '60000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001'),
    ('70000000-0000-4000-8000-000000000002', institution_b,
      '10000000-0000-4000-8000-000000000004',
      '60000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000002');
  insert into public.student_enrollments
    (institution_id, student_id, group_id, academic_period_id) values
    (institution_a, '10000000-0000-4000-8000-000000000001',
      '60000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001'),
    (institution_b, '10000000-0000-4000-8000-000000000002',
      '60000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000002'),
    (institution_a, '10000000-0000-4000-8000-000000000008',
      '60000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001'),
    (institution_a, '10000000-0000-4000-8000-000000000009',
      '60000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001');

  insert into public.survey_templates
    (id, institution_id, name, version) values
    ('90000000-0000-4000-8000-000000000001', institution_a, 'Survey A', 1),
    ('90000000-0000-4000-8000-000000000002', institution_b, 'Survey B', 1),
    ('90000000-0000-4000-8000-000000000003', null, 'Shared Survey', 1);
  insert into public.survey_questions
    (id, survey_template_id, position, dimension, prompt, question_type) values
    ('a0000000-0000-4000-8000-000000000001',
      '90000000-0000-4000-8000-000000000001', 1,
      'Claridad', 'Pregunta A', 'scale'),
    ('a0000000-0000-4000-8000-000000000002',
      '90000000-0000-4000-8000-000000000002', 1,
      'Claridad', 'Pregunta B', 'scale'),
    ('a0000000-0000-4000-8000-000000000003',
      '90000000-0000-4000-8000-000000000003', 1,
      'Claridad', 'Pregunta global', 'scale');
  insert into public.evaluation_windows
    (id, institution_id, academic_period_id, survey_template_id,
      name, starts_at, ends_at) values
    ('b0000000-0000-4000-8000-000000000001', institution_a,
      '30000000-0000-4000-8000-000000000001',
      '90000000-0000-4000-8000-000000000001',
      'Window A', '2026-01-01', '2026-12-31'),
    ('b0000000-0000-4000-8000-000000000002', institution_b,
      '30000000-0000-4000-8000-000000000002',
      '90000000-0000-4000-8000-000000000002',
      'Window B', '2026-01-01', '2026-12-31'),
    ('b0000000-0000-4000-8000-000000000003', institution_a,
      '30000000-0000-4000-8000-000000000001',
      '90000000-0000-4000-8000-000000000003',
      'Shared Window A', '2026-01-01', '2026-12-31');
  insert into public.evaluations
    (id, institution_id, academic_period_id, evaluation_window_id,
      teaching_assignment_id, student_id, status, started_at, submitted_at) values
    ('c0000000-0000-4000-8000-000000000001', institution_a,
      '30000000-0000-4000-8000-000000000001',
      'b0000000-0000-4000-8000-000000000001',
      '70000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'completed', '2026-09-01', '2026-09-02'),
    ('c0000000-0000-4000-8000-000000000002', institution_b,
      '30000000-0000-4000-8000-000000000002',
      'b0000000-0000-4000-8000-000000000002',
      '70000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000002',
      'completed', '2026-09-01', '2026-09-02');
  insert into public.evaluation_answers
    (evaluation_id, question_id, numeric_value) values
    ('c0000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000001', 9.0),
    ('c0000000-0000-4000-8000-000000000002',
      'a0000000-0000-4000-8000-000000000002', 4.0);
end;
$fixture$;

-- A is an active student with one enrollment. Supplying B's UUIDs must not
-- disclose B, and forged signup role metadata must remain ineffective.
set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label = 'student_a'), true);
insert into audit_results values
  ('student A sees own institution', (select count(*) from public.institutions) = 1),
  ('student A cannot see institution B',
    (select count(*) from public.institutions where slug = 'unam') = 0),
  ('student A sees own enrollment',
    (select count(*) from public.student_enrollments) = 1),
  ('student A cannot see B enrollment UUID',
    (select count(*) from public.student_enrollments
     where student_id = (select id from audit_ids where label = 'student_b')) = 0),
  ('student A sees own group', (select count(*) from public.groups) = 1),
  ('student A cannot see B group UUID',
    (select count(*) from public.groups
     where id = (select id from audit_ids where label = 'group_b')) = 0),
  ('student A sees own subject', (select count(*) from public.subjects) = 1),
  ('student A sees own program', (select count(*) from public.programs) = 1),
  ('student A sees own period', (select count(*) from public.academic_periods) = 1),
  ('student A sees own assignment',
    (select count(*) from public.teaching_assignments) = 1),
  ('student A sees eligible windows',
    (select count(*) from public.evaluation_windows) = 2),
  ('student A sees eligible templates',
    (select count(*) from public.survey_templates) = 2),
  ('student A sees eligible questions',
    (select count(*) from public.survey_questions) = 2),
  ('student A sees minimal teacher directory',
    (select count(*) from public.my_evaluation_teachers()
     where teacher_id = (select id from audit_ids where label = 'teacher_a')) = 1),
  ('student A sees only own profile', (select count(*) from public.profiles) = 1),
  ('student A sees only own student role',
    (select count(*) from public.user_roles) = 1
    and (select count(*) from public.user_roles ur
         join public.roles r on r.id = ur.role_id
         where r.code = 'admin') = 0);

do $test$
declare
  affected integer;
begin
  begin
    insert into public.user_roles (profile_id, role_id, institution_id)
    select (select id from audit_ids where label = 'student_a'), r.id, i.id
    from public.roles r cross join public.institutions i
    where r.code = 'admin' and i.slug = 'ipn';
    insert into audit_results values ('student cannot insert admin role', false);
  exception when insufficient_privilege then
    insert into audit_results values ('student cannot insert admin role', true);
  end;

  begin
    update public.profiles set status = 'inactive'
    where id = (select id from audit_ids where label = 'student_a');
    get diagnostics affected = row_count;
    insert into audit_results values ('student cannot change status', affected = 0);
  exception when insufficient_privilege then
    insert into audit_results values ('student cannot change status', true);
  end;

  begin
    update public.profiles
      set institution_id = (select id from public.institutions where slug = 'unam')
    where id = (select id from audit_ids where label = 'student_a');
    get diagnostics affected = row_count;
    insert into audit_results values
      ('student cannot change institution', affected = 0);
  exception when insufficient_privilege then
    insert into audit_results values ('student cannot change institution', true);
  end;

  begin
    perform count(*) from public.evaluations;
    insert into audit_results values ('student cannot read evaluations', false);
  exception when insufficient_privilege then
    insert into audit_results values ('student cannot read evaluations', true);
  end;

  begin
    perform count(*) from public.evaluation_answers;
    insert into audit_results values ('student cannot read answers', false);
  exception when insufficient_privilege then
    insert into audit_results values ('student cannot read answers', true);
  end;
end;
$test$;

-- B has only B's data.
select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label = 'student_b'), true);
insert into audit_results values
  ('student B sees only own institution',
    (select count(*) from public.institutions) = 1
    and (select count(*) from public.institutions where slug = 'ipn') = 0),
  ('student B sees only own group', (select count(*) from public.groups) = 1
    and (select count(*) from public.groups
         where id = (select id from audit_ids where label = 'group_a')) = 0),
  ('student B sees only own template',
    (select count(*) from public.survey_templates) = 1);

-- A teacher sees only assigned academic structure, never individual answers.
select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label = 'teacher_a'), true);
insert into audit_results values
  ('teacher A sees own assignment',
    (select count(*) from public.teaching_assignments) = 1),
  ('teacher A cannot see B assignment UUID',
    (select count(*) from public.teaching_assignments
     where id = (select id from audit_ids where label = 'assignment_b')) = 0),
  ('teacher A sees own group and subject',
    (select count(*) from public.groups) = 1
    and (select count(*) from public.subjects) = 1),
  ('teacher A sees own period',
    (select count(*) from public.academic_periods) = 1),
  ('teacher A cannot read enrollments',
    (select count(*) from public.student_enrollments) = 0),
  ('teacher A cannot use student directory',
    (select count(*) from public.my_evaluation_teachers()) = 0);
do $test$
begin
  begin
    perform count(*) from public.evaluation_answers;
    insert into audit_results values ('teacher cannot read individual answers', false);
  exception when insufficient_privilege then
    insert into audit_results values ('teacher cannot read individual answers', true);
  end;
  begin
    perform count(*) from public.evaluations;
    insert into audit_results values ('teacher cannot read student IDs', false);
  exception when insufficient_privilege then
    insert into audit_results values ('teacher cannot read student IDs', true);
  end;
  begin
    insert into public.user_roles (profile_id, role_id, institution_id)
    select (select id from audit_ids where label = 'teacher_a'), r.id, i.id
    from public.roles r cross join public.institutions i
    where r.code = 'admin' and i.slug = 'ipn';
    insert into audit_results values ('teacher cannot grant self admin', false);
  exception when insufficient_privilege then
    insert into audit_results values ('teacher cannot grant self admin', true);
  end;
end;
$test$;

select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label = 'teacher_b'), true);
insert into audit_results values
  ('teacher B sees only B assignment',
    (select count(*) from public.teaching_assignments) = 1
    and (select count(*) from public.teaching_assignments
         where id = (select id from audit_ids where label = 'assignment_a')) = 0);

-- Institutional staff have no cross-tenant access or individual responses.
select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label = 'coordinator_a'), true);
insert into audit_results values
  ('coordinator A sees own structure',
    (select count(*) from public.campuses) = 1
    and (select count(*) from public.programs) = 1
    and (select count(*) from public.groups) = 1),
  ('coordinator A cannot see B structure',
    (select count(*) from public.campuses
     where id = (select id from audit_ids where label = 'campus_b')) = 0),
  ('coordinator A cannot see enrollments',
    (select count(*) from public.student_enrollments) = 0);
select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label = 'hr_a'), true);
insert into audit_results values
  ('HR A sees own period only',
    (select count(*) from public.academic_periods) = 1
    and (select count(*) from public.academic_periods
         where id = (select id from audit_ids where label = 'period_b')) = 0),
  ('HR A cannot see groups or enrollments',
    (select count(*) from public.groups) = 0
    and (select count(*) from public.student_enrollments) = 0);
select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label = 'admin_a'), true);
insert into audit_results values
  ('admin A sees own structure',
    (select count(*) from public.campuses) = 1
    and (select count(*) from public.groups) = 1),
  ('admin A cannot see B institution',
    (select count(*) from public.institutions where slug = 'unam') = 0),
  ('admin A cannot see enrollments',
    (select count(*) from public.student_enrollments) = 0);

-- Pending and role-less users have own identity, but no academic data even
-- though both have a test enrollment on A's group.
select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label = 'pending_a'), true);
insert into audit_results values
  ('pending A sees own identity',
    (select count(*) from public.profiles) = 1
    and (select count(*) from public.user_roles) = 1),
  ('pending A cannot see academic rows',
    (select count(*) from public.student_enrollments) = 0
    and (select count(*) from public.groups) = 0
    and (select count(*) from public.teaching_assignments) = 0
    and (select count(*) from public.evaluation_windows) = 0
    and (select count(*) from public.survey_questions) = 0),
  ('pending A cannot use teacher directory',
    (select count(*) from public.my_evaluation_teachers()) = 0);
select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label = 'no_role_a'), true);
insert into audit_results values
  ('active user without role sees no academic rows',
    (select count(*) from public.student_enrollments) = 0
    and (select count(*) from public.groups) = 0
    and (select count(*) from public.evaluation_windows) = 0);

-- Every client role is denied individual evaluations and answers at the grant layer.
do $test$
declare
  actor record;
begin
  for actor in
    select label, id from audit_ids
    where label in ('student_a', 'student_b', 'teacher_a', 'teacher_b',
                    'coordinator_a', 'hr_a', 'admin_a', 'pending_a', 'no_role_a')
  loop
    perform set_config('request.jwt.claim.sub', actor.id::text, true);
    begin
      perform count(*) from public.evaluations;
      insert into audit_results values (actor.label || ' cannot read evaluations', false);
    exception when insufficient_privilege then
      insert into audit_results values (actor.label || ' cannot read evaluations', true);
    end;
    begin
      perform count(*) from public.evaluation_answers;
      insert into audit_results values (actor.label || ' cannot read answers', false);
    exception when insufficient_privilege then
      insert into audit_results values (actor.label || ' cannot read answers', true);
    end;
  end loop;
end;
$test$;

-- Anonymous signup catalog remains readable; academic tables are not.
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
insert into audit_results values
  ('anon sees active signup catalog',
    (select count(*) from public.institutions) = 7);
do $test$
begin
  begin
    perform count(*) from public.groups;
    insert into audit_results values ('anon cannot read academic groups', false);
  exception when insufficient_privilege then
    insert into audit_results values ('anon cannot read academic groups', true);
  end;
end;
$test$;

reset role;
select count(*) as tests,
       count(*) filter (where passed) as passed,
       array_agg(test_name order by test_name) filter (where not passed) as failed
from audit_results;
do $test$
begin
  if exists (select 1 from audit_results where not passed) then
    raise exception 'RLS audit failed';
  end if;
end;
$test$;
rollback;