-- Block 8 regression. All fictional users and academic rows roll back.
begin;
create temp table fixture_users (
  label text primary key, id uuid not null, institution_id uuid not null,
  full_name text not null, email text not null, identifier text not null
) on commit drop;
create temp table fixture_ids (label text primary key, id uuid not null) on commit drop;
create temp table fixture_evaluations (
  id uuid primary key, assignment_label text not null,
  student_label text not null, score numeric not null
) on commit drop;
create temp table audit_results (test_name text primary key, passed boolean not null) on commit drop;
grant select on fixture_users, fixture_ids to authenticated;
grant select, insert on audit_results to authenticated;

insert into fixture_users (label,id,institution_id,full_name,email,identifier)
select 'student_a_' || n::text, gen_random_uuid(), i.id,
  'Private Student A ' || n::text,
  'private-student-a-' || n::text || '@block8.example.test',
  'SECRET-A-' || n::text
from generate_series(1,5) n cross join public.institutions i where i.slug='ipn';
insert into fixture_users (label,id,institution_id,full_name,email,identifier)
select 'student_b_' || n::text, gen_random_uuid(), i.id,
  'Private Student B ' || n::text,
  'private-student-b-' || n::text || '@block8.example.test',
  'SECRET-B-' || n::text
from generate_series(1,5) n cross join public.institutions i where i.slug='unam';
insert into fixture_users (label,id,institution_id,full_name,email,identifier)
select labels.label, gen_random_uuid(), i.id,
  labels.label || ' fixture', labels.label || '@block8.example.test',
  'TEACHER-' || labels.label
from (values ('teacher_a','ipn'),('teacher_a_other','ipn'),
  ('teacher_b','unam'),('teacher_pending','ipn'),('teacher_no_role','ipn')) labels(label,slug)
join public.institutions i on i.slug=labels.slug;

insert into auth.users (id,email,raw_user_meta_data)
select u.id,u.email,jsonb_build_object(
  'institution_id',u.institution_id::text,'full_name',u.full_name,
  'institutional_identifier',u.identifier
) from fixture_users u;
update public.profiles set status='active'
where id in (select id from fixture_users where label <> 'teacher_pending');
delete from public.user_roles
where profile_id in (select id from fixture_users where label like 'teacher_%');
insert into public.user_roles (profile_id,role_id,institution_id)
select u.id,r.id,u.institution_id
from fixture_users u join public.roles r on r.code='teacher'
where u.label in ('teacher_a','teacher_a_other','teacher_b','teacher_pending');

insert into fixture_ids (label,id)
select label,gen_random_uuid() from (values
  ('campus_a'),('campus_b'),('program_a'),('program_b'),
  ('subject_a'),('subject_small'),('subject_b'),
  ('period_a_current'),('period_a_previous'),('period_b_current'),
  ('group_a_current'),('group_a_small'),('group_a_previous'),('group_b_current'),
  ('assignment_a_current'),('assignment_a_small'),('assignment_a_previous'),
  ('assignment_a_other'),('assignment_b_current'),
  ('window_a_current'),('window_a_previous'),('window_b_current')
) labels(label);

do $fixture$
declare
  institution_a uuid;
  institution_b uuid;
  template uuid;
begin
  select id into strict institution_a from public.institutions where slug='ipn';
  select id into strict institution_b from public.institutions where slug='unam';
  select id into strict template from public.survey_templates
    where name='Evaluación docente oficial' and version=1 and institution_id is null;

  insert into public.campuses (id,institution_id,name,code) values
    ((select id from fixture_ids where label='campus_a'),institution_a,'Block 8 Campus A','B8A'),
    ((select id from fixture_ids where label='campus_b'),institution_b,'Block 8 Campus B','B8B');
  insert into public.programs (id,institution_id,campus_id,name,code) values
    ((select id from fixture_ids where label='program_a'),institution_a,
      (select id from fixture_ids where label='campus_a'),'Block 8 Program A','B8A'),
    ((select id from fixture_ids where label='program_b'),institution_b,
      (select id from fixture_ids where label='campus_b'),'Block 8 Program B','B8B');
  insert into public.subjects (id,institution_id,program_id,name,code) values
    ((select id from fixture_ids where label='subject_a'),institution_a,
      (select id from fixture_ids where label='program_a'),'Matemáticas Aplicadas','B8-A'),
    ((select id from fixture_ids where label='subject_small'),institution_a,
      (select id from fixture_ids where label='program_a'),'Bases de Datos','B8-S'),
    ((select id from fixture_ids where label='subject_b'),institution_b,
      (select id from fixture_ids where label='program_b'),'Institución B','B8-B');
  insert into public.academic_periods (id,institution_id,name,starts_at,ends_at) values
    ((select id from fixture_ids where label='period_a_current'),institution_a,
      'Periodo actual A',now()-interval '30 days',now()+interval '30 days'),
    ((select id from fixture_ids where label='period_a_previous'),institution_a,
      'Periodo anterior A',now()-interval '365 days',now()-interval '300 days'),
    ((select id from fixture_ids where label='period_b_current'),institution_b,
      'Periodo actual B',now()-interval '30 days',now()+interval '30 days');
  insert into public.groups (id,institution_id,subject_id,academic_period_id,code) values
    ((select id from fixture_ids where label='group_a_current'),institution_a,
      (select id from fixture_ids where label='subject_a'),
      (select id from fixture_ids where label='period_a_current'),'A-C'),
    ((select id from fixture_ids where label='group_a_small'),institution_a,
      (select id from fixture_ids where label='subject_small'),
      (select id from fixture_ids where label='period_a_current'),'A-S'),
    ((select id from fixture_ids where label='group_a_previous'),institution_a,
      (select id from fixture_ids where label='subject_a'),
      (select id from fixture_ids where label='period_a_previous'),'A-P'),
    ((select id from fixture_ids where label='group_b_current'),institution_b,
      (select id from fixture_ids where label='subject_b'),
      (select id from fixture_ids where label='period_b_current'),'B-C');
  insert into public.teaching_assignments
    (id,institution_id,teacher_id,group_id,academic_period_id) values
    ((select id from fixture_ids where label='assignment_a_current'),institution_a,
      (select id from fixture_users where label='teacher_a'),
      (select id from fixture_ids where label='group_a_current'),
      (select id from fixture_ids where label='period_a_current')),
    ((select id from fixture_ids where label='assignment_a_small'),institution_a,
      (select id from fixture_users where label='teacher_a'),
      (select id from fixture_ids where label='group_a_small'),
      (select id from fixture_ids where label='period_a_current')),
    ((select id from fixture_ids where label='assignment_a_previous'),institution_a,
      (select id from fixture_users where label='teacher_a'),
      (select id from fixture_ids where label='group_a_previous'),
      (select id from fixture_ids where label='period_a_previous')),
    ((select id from fixture_ids where label='assignment_a_other'),institution_a,
      (select id from fixture_users where label='teacher_a_other'),
      (select id from fixture_ids where label='group_a_current'),
      (select id from fixture_ids where label='period_a_current')),
    ((select id from fixture_ids where label='assignment_b_current'),institution_b,
      (select id from fixture_users where label='teacher_b'),
      (select id from fixture_ids where label='group_b_current'),
      (select id from fixture_ids where label='period_b_current'));
  insert into public.student_enrollments
    (institution_id,student_id,group_id,academic_period_id)
  select institution_a,u.id,g.id,p.id from fixture_users u
  cross join lateral (select id from fixture_ids where label='group_a_current') g
  cross join lateral (select id from fixture_ids where label='period_a_current') p
  where u.label like 'student_a_%';
  insert into public.student_enrollments
    (institution_id,student_id,group_id,academic_period_id)
  select institution_a,u.id,g.id,p.id from fixture_users u
  cross join lateral (select id from fixture_ids where label='group_a_previous') g
  cross join lateral (select id from fixture_ids where label='period_a_previous') p
  where u.label like 'student_a_%';
  insert into public.student_enrollments
    (institution_id,student_id,group_id,academic_period_id)
  values (institution_a,(select id from fixture_users where label='student_a_1'),
    (select id from fixture_ids where label='group_a_small'),
    (select id from fixture_ids where label='period_a_current'));
  insert into public.student_enrollments
    (institution_id,student_id,group_id,academic_period_id)
  select institution_b,u.id,g.id,p.id from fixture_users u
  cross join lateral (select id from fixture_ids where label='group_b_current') g
  cross join lateral (select id from fixture_ids where label='period_b_current') p
  where u.label like 'student_b_%';
  insert into public.evaluation_windows
    (id,institution_id,academic_period_id,survey_template_id,name,starts_at,ends_at) values
    ((select id from fixture_ids where label='window_a_current'),institution_a,
      (select id from fixture_ids where label='period_a_current'),template,
      'Block 8 current A',now()-interval '1 day',now()+interval '1 day'),
    ((select id from fixture_ids where label='window_a_previous'),institution_a,
      (select id from fixture_ids where label='period_a_previous'),template,
      'Block 8 previous A',now()-interval '350 days',now()-interval '310 days'),
    ((select id from fixture_ids where label='window_b_current'),institution_b,
      (select id from fixture_ids where label='period_b_current'),template,
      'Block 8 current B',now()-interval '1 day',now()+interval '1 day');
end;
$fixture$;

insert into fixture_evaluations (id,assignment_label,student_label,score)
select gen_random_uuid(),'assignment_a_current',u.label,
  (5 + right(u.label,1)::integer)::numeric
from fixture_users u where u.label like 'student_a_%';
insert into fixture_evaluations (id,assignment_label,student_label,score)
select gen_random_uuid(),'assignment_a_previous',u.label,7
from fixture_users u where u.label like 'student_a_%';
insert into fixture_evaluations (id,assignment_label,student_label,score)
values (gen_random_uuid(),'assignment_a_small','student_a_1',0);
insert into fixture_evaluations (id,assignment_label,student_label,score)
select gen_random_uuid(),'assignment_a_other',u.label,2
from fixture_users u where u.label like 'student_a_%';
insert into fixture_evaluations (id,assignment_label,student_label,score)
select gen_random_uuid(),'assignment_b_current',u.label,10
from fixture_users u where u.label like 'student_b_%';

insert into public.evaluations
  (id,institution_id,academic_period_id,evaluation_window_id,
   teaching_assignment_id,student_id,status,started_at,submitted_at)
select f.id,student.institution_id,ta.academic_period_id,
  window_id.id,ta.id,student.id,'completed'::public.evaluation_status,
  case when f.assignment_label='assignment_a_previous'
    then now()-interval '330 days' else now()-interval '1 hour' end,
  case when f.assignment_label='assignment_a_previous'
    then now()-interval '330 days' else now()-interval '1 hour' end
from fixture_evaluations f
join fixture_users student on student.label=f.student_label
join fixture_ids assignment on assignment.label=f.assignment_label
join public.teaching_assignments ta on ta.id=assignment.id
join fixture_ids window_id on window_id.label=case
  when f.assignment_label='assignment_a_previous' then 'window_a_previous'
  when f.assignment_label='assignment_b_current' then 'window_b_current'
  else 'window_a_current' end;
insert into public.evaluation_answers (evaluation_id,question_id,numeric_value)
select f.id,q.id,f.score
from fixture_evaluations f
cross join public.survey_questions q
join public.survey_templates t on t.id=q.survey_template_id
where t.name='Evaluación docente oficial' and t.version=1 and t.institution_id is null;

-- Teacher A: current average 8.0 from five full responses; one 0-score
-- assignment is counted but suppressed. Previous average 7.0 remains intact.
set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='teacher_a'),true);
insert into audit_results values
 ('teacher A sees exactly three own assignments',
   (select count(*) from public.teacher_assignment_results(null::uuid))=3),
 ('teacher A sees its current assignment',
   (select count(*) from public.teacher_assignment_results(
     (select id from fixture_ids where label='assignment_a_current')))=1),
 ('teacher A cannot see same-institution colleague assignment',
   (select count(*) from public.teacher_assignment_results(
     (select id from fixture_ids where label='assignment_a_other')))=0),
 ('teacher A cannot see institution B assignment',
   (select count(*) from public.teacher_assignment_results(
     (select id from fixture_ids where label='assignment_b_current')))=0),
 ('manipulated UUID returns no row',
   (select count(*) from public.teacher_assignment_results(
     'ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid))=0),
 ('current assignment mean is eight of ten',
   (select average_score from public.teacher_assignment_results(
     (select id from fixture_ids where label='assignment_a_current')))=8),
 ('current assignment has five valid evaluations',
   (select response_count from public.teacher_assignment_results(
     (select id from fixture_ids where label='assignment_a_current')))=5),
 ('current assignment has 15 official reactivos',
   (select jsonb_array_length(question_scores) from public.teacher_assignment_results(
     (select id from fixture_ids where label='assignment_a_current')))=15),
 ('first question mean is eight',
   (select (question_scores->0->>'score')::numeric
    from public.teacher_assignment_results(
      (select id from fixture_ids where label='assignment_a_current')))=8),
 ('under-five assignment hides every score',
   (select response_count=1 and average_score is null
      and favorable_percent is null and question_scores='[]'::jsonb and not published
    from public.teacher_assignment_results(
      (select id from fixture_ids where label='assignment_a_small')))),
 ('five-response assignment releases score',
   (select published and average_score=8
    from public.teacher_assignment_results(
      (select id from fixture_ids where label='assignment_a_current')))),
 ('history has current and previous periods',
   (select count(*) from public.teacher_results_history())=2),
 ('current period count includes hidden group',
   (select response_count=6 and published_responses=5 and assignment_count=2
    from public.teacher_results_history()
    where period_id=(select id from fixture_ids where label='period_a_current'))),
 ('current period score excludes hidden group',
   (select average_score=8 from public.teacher_results_history()
    where period_id=(select id from fixture_ids where label='period_a_current'))),
 ('previous period average remains seven',
   (select average_score=7 from public.teacher_results_history()
    where period_id=(select id from fixture_ids where label='period_a_previous'))),
 ('period comparison difference equals one',
   (select current.average_score - previous.average_score = 1
    from public.teacher_results_history() current
    cross join public.teacher_results_history() previous
    where current.period_id=(select id from fixture_ids where label='period_a_current')
      and previous.period_id=(select id from fixture_ids where label='period_a_previous'))),
 ('period breakdown has fifteen rows',
   (select count(*) from public.teacher_period_breakdown(
     (select id from fixture_ids where label='period_a_current')))=15),
 ('period breakdown score excludes hidden group',
   (select score=8 from public.teacher_period_breakdown(
     (select id from fixture_ids where label='period_a_current'))
    where question_position=1)),
 ('teacher A cannot request B period breakdown',
   (select count(*) from public.teacher_period_breakdown(
     (select id from fixture_ids where label='period_b_current')))=0),
 ('teacher A history contains no B period',
   (select count(*) from public.teacher_results_history()
    where period_id=(select id from fixture_ids where label='period_b_current'))=0),
 ('teacher A data never includes B score ten',
   (select count(*) from public.teacher_assignment_results(null::uuid)
    where average_score=10)=0);

-- Scan the complete JSON contract and known fixture values for identity leaks.
insert into audit_results
select 'RPCs expose no student identifiers or PII',
  position('student_id' in payload)=0
  and position('profile_id' in payload)=0
  and position('institutional_identifier' in payload)=0
  and position('private-student' in payload)=0
  and position('Private Student' in payload)=0
  and position('SECRET-A-' in payload)=0
  and position('SECRET-B-' in payload)=0
  and position('email' in payload)=0
from (
  select coalesce((select jsonb_agg(to_jsonb(t))::text
    from public.teacher_assignment_results(null::uuid) t),'') ||
    coalesce((select jsonb_agg(to_jsonb(h))::text
    from public.teacher_results_history() h),'') ||
    coalesce((select jsonb_agg(to_jsonb(q))::text
    from public.teacher_period_breakdown(
      (select id from fixture_ids where label='period_a_current')) q),'') as payload
) responses;

do $tests$
begin
  begin
    perform count(*) from public.evaluation_answers;
    insert into audit_results values ('teacher cannot select answers directly',false);
  exception when insufficient_privilege then
    insert into audit_results values ('teacher cannot select answers directly',true);
  end;
  begin
    perform count(*) from public.evaluations;
    insert into audit_results values ('teacher cannot select evaluations directly',false);
  exception when insufficient_privilege then
    insert into audit_results values ('teacher cannot select evaluations directly',true);
  end;
  begin
    insert into audit_results values ('teacher cannot select enrollments directly',
      (select count(*) from public.student_enrollments)=0);
  exception when insufficient_privilege then
    insert into audit_results values ('teacher cannot select enrollments directly',true);
  end;
end;
$tests$;

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='teacher_b'),true);
insert into audit_results values
 ('teacher B sees only B assignment',
   (select count(*) from public.teacher_assignment_results(null::uuid))=1
   and (select count(*) from public.teacher_assignment_results(
     (select id from fixture_ids where label='assignment_a_current')))=0),
 ('teacher B history excludes institution A',
   (select count(*) from public.teacher_results_history())=1
   and (select count(*) from public.teacher_results_history()
     where period_id=(select id from fixture_ids where label='period_a_current'))=0),
 ('teacher B sees only its own score',
   (select average_score from public.teacher_assignment_results(null::uuid))=10);

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='teacher_a_other'),true);
insert into audit_results values ('other teacher in A sees only own assignment',
  (select count(*) from public.teacher_assignment_results(null::uuid))=1
  and (select count(*) from public.teacher_assignment_results(
    (select id from fixture_ids where label='assignment_a_current')))=0);

do $tests$
declare
  rejected boolean;
begin
  perform set_config('request.jwt.claim.sub',
    (select id::text from fixture_users where label='student_a_1'),true);
  rejected := false;
  begin perform public.teacher_results_history();
  exception when others then rejected := sqlerrm='teacher_access_denied'; end;
  insert into audit_results values ('student cannot invoke teacher results',rejected);

  perform set_config('request.jwt.claim.sub',
    (select id::text from fixture_users where label='teacher_pending'),true);
  rejected := false;
  begin perform public.teacher_assignment_results(null::uuid);
  exception when others then rejected := sqlerrm='teacher_access_denied'; end;
  insert into audit_results values ('pending teacher is denied',rejected);

  perform set_config('request.jwt.claim.sub',
    (select id::text from fixture_users where label='teacher_no_role'),true);
  rejected := false;
  begin perform public.teacher_period_breakdown(
    (select id from fixture_ids where label='period_a_current'));
  exception when others then rejected := sqlerrm='teacher_access_denied'; end;
  insert into audit_results values ('user without teacher role is denied',rejected);
end;
$tests$;

reset role;
select count(*) as tests, count(*) filter (where passed) as passed,
  array_agg(test_name order by test_name) filter (where not passed) as failed
from audit_results;
do $tests$
begin
  if exists (select 1 from audit_results where not passed) then
    raise exception 'Block 8 teacher results regression failed';
  end if;
end;
$tests$;
rollback;
