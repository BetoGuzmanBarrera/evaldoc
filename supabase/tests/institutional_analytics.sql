-- Block 10 institutional analytics. All fictional users and academic rows roll back.
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

-- Institutional roles and an additional unanswered obligation in institution A.
insert into fixture_users (label,id,institution_id,full_name,email,identifier)
select labels.label, gen_random_uuid(), i.id, labels.label || ' fixture',
  labels.label || '@block9.example.test', 'BLOCK9-' || labels.label
from (values ('coordinator_a','ipn'),('coordinator_b','unam'),
  ('hr_a','ipn'),('hr_b','unam'),('admin_a','ipn'),('admin_b','unam'),
  ('coordinator_pending','ipn'),('institution_no_role','ipn'),
  ('teacher_excellent','ipn'),('student_a_6','ipn')) labels(label,slug)
join public.institutions i on i.slug=labels.slug;
insert into auth.users (id,email,raw_user_meta_data)
select u.id,u.email,jsonb_build_object('institution_id',u.institution_id::text,
  'full_name',u.full_name,'institutional_identifier',u.identifier)
from fixture_users u where u.email like '%@block9.example.test';
update public.profiles set status='active'
where id in (select id from fixture_users
  where email like '%@block9.example.test' and label <> 'coordinator_pending');
delete from public.user_roles where profile_id in
  (select id from fixture_users where email like '%@block9.example.test'
    and label <> 'student_a_6');
insert into public.user_roles (profile_id,role_id,institution_id)
select u.id,r.id,u.institution_id
from fixture_users u join public.roles r on r.code = case
  when u.label like 'coordinator_%' then 'coordinator'
  when u.label like 'hr_%' then 'hr'
  when u.label like 'admin_%' then 'admin'
  else 'teacher' end
where u.label in ('coordinator_a','coordinator_b','hr_a','hr_b',
  'admin_a','admin_b','coordinator_pending','teacher_excellent');
insert into public.student_enrollments (institution_id,student_id,group_id,academic_period_id)
select u.institution_id,u.id,g.id,ap.id from fixture_users u
cross join lateral (select id from fixture_ids where label='group_a_current') g
cross join lateral (select id from fixture_ids where label='period_a_current') ap
where u.label='student_a_6';
insert into fixture_ids (label,id) values ('assignment_excellent',gen_random_uuid());
insert into public.teaching_assignments
  (id,institution_id,teacher_id,group_id,academic_period_id)
select a.id,u.institution_id,u.id,g.id,ap.id from fixture_users u
cross join lateral (select id from fixture_ids where label='assignment_excellent') a
cross join lateral (select id from fixture_ids where label='group_a_current') g
cross join lateral (select id from fixture_ids where label='period_a_current') ap
where u.label='teacher_excellent';
insert into fixture_evaluations (id,assignment_label,student_label,score)
select gen_random_uuid(),'assignment_excellent',u.label,10
from fixture_users u where u.label like 'student_a_%' and u.label <> 'student_a_6';
insert into public.evaluations
  (id,institution_id,academic_period_id,evaluation_window_id,
   teaching_assignment_id,student_id,status,started_at,submitted_at)
select f.id,u.institution_id,ta.academic_period_id,w.id,ta.id,u.id,
  'completed'::public.evaluation_status,now()-interval '1 hour',now()-interval '1 hour'
from fixture_evaluations f join fixture_users u on u.label=f.student_label
join fixture_ids a on a.label=f.assignment_label
join public.teaching_assignments ta on ta.id=a.id
cross join lateral (select id from fixture_ids where label='window_a_current') w
where f.assignment_label='assignment_excellent';
insert into public.evaluation_answers (evaluation_id,question_id,numeric_value)
select f.id,q.id,f.score from fixture_evaluations f
cross join public.survey_questions q
join public.survey_templates t on t.id=q.survey_template_id
where f.assignment_label='assignment_excellent'
  and t.name='Evaluación docente oficial' and t.version=1 and t.institution_id is null;

-- A third historical period verifies chronology without overwriting data.
insert into fixture_ids (label,id)
select label,gen_random_uuid() from (values
  ('period_a_older'),('group_a_older'),('assignment_a_older'),('window_a_older')
) labels(label);
insert into public.academic_periods (id,institution_id,name,starts_at,ends_at)
select f.id,i.id,'Periodo antiguo A',now()-interval '730 days',now()-interval '665 days'
from fixture_ids f cross join public.institutions i
where f.label='period_a_older' and i.slug='ipn';
insert into public.groups (id,institution_id,subject_id,academic_period_id,code)
select g.id,i.id,s.id,ap.id,'A-O'
from public.institutions i
join fixture_ids g on g.label='group_a_older'
join fixture_ids s on s.label='subject_a'
join fixture_ids ap on ap.label='period_a_older'
where i.slug='ipn';
insert into public.teaching_assignments
  (id,institution_id,teacher_id,group_id,academic_period_id)
select a.id,u.institution_id,u.id,g.id,ap.id
from fixture_users u
join fixture_ids a on a.label='assignment_a_older'
join fixture_ids g on g.label='group_a_older'
join fixture_ids ap on ap.label='period_a_older'
where u.label='teacher_a';
insert into public.student_enrollments
  (institution_id,student_id,group_id,academic_period_id)
select u.institution_id,u.id,g.id,ap.id
from fixture_users u
join fixture_ids g on g.label='group_a_older'
join fixture_ids ap on ap.label='period_a_older'
where u.label like 'student_a_%' and u.label <> 'student_a_6';
insert into public.evaluation_windows
  (id,institution_id,academic_period_id,survey_template_id,name,starts_at,ends_at)
select w.id,i.id,ap.id,t.id,'Block 10 older A',
  now()-interval '725 days',now()-interval '670 days'
from public.institutions i
join fixture_ids w on w.label='window_a_older'
join fixture_ids ap on ap.label='period_a_older'
join public.survey_templates t on t.name='Evaluación docente oficial'
  and t.version=1 and t.institution_id is null
where i.slug='ipn';
insert into fixture_evaluations (id,assignment_label,student_label,score)
select gen_random_uuid(),'assignment_a_older',u.label,6
from fixture_users u
where u.label like 'student_a_%' and u.label <> 'student_a_6';
insert into public.evaluations
  (id,institution_id,academic_period_id,evaluation_window_id,
   teaching_assignment_id,student_id,status,started_at,submitted_at)
select f.id,u.institution_id,ta.academic_period_id,w.id,ta.id,u.id,
  'completed'::public.evaluation_status,
  now()-interval '700 days',now()-interval '700 days'
from fixture_evaluations f
join fixture_users u on u.label=f.student_label
join fixture_ids a on a.label=f.assignment_label
join public.teaching_assignments ta on ta.id=a.id
join fixture_ids w on w.label='window_a_older'
where f.assignment_label='assignment_a_older';
insert into public.evaluation_answers (evaluation_id,question_id,numeric_value)
select f.id,q.id,f.score from fixture_evaluations f
cross join public.survey_questions q
join public.survey_templates t on t.id=q.survey_template_id
where f.assignment_label='assignment_a_older'
  and t.name='Evaluación docente oficial' and t.version=1 and t.institution_id is null;

set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='coordinator_a'),true);
insert into audit_results values
 ('overview A score uses publishable assignments',
   (select average_score=6.60 and response_count=25 and teacher_count=3
    from public.institution_analytics_overview())),
 ('overview A participation includes three periods',
   (select expected=29 and completed=26 and pending=3 and participation=89.66
    from public.institution_analytics_overview())),
 ('current period has only its own obligations',
   (select expected=19 and completed=16 and pending=3
    from public.institution_analytics_overview(
      (select id from fixture_ids where label='period_a_current')))),
 ('trend retains three actual periods',
   (select pg_catalog.count(*) from public.institution_analytics_trend())=3),
 ('trend oldest score',
   (select average_score from public.institution_analytics_trend()
    where period_id=(select id from fixture_ids where label='period_a_older'))=6),
 ('trend previous score',
   (select average_score from public.institution_analytics_trend()
    where period_id=(select id from fixture_ids where label='period_a_previous'))=7),
 ('trend current score',
   (select average_score from public.institution_analytics_trend()
    where period_id=(select id from fixture_ids where label='period_a_current'))=6.67),
 ('current versus previous comparison',
   (select current_score=6.67 and previous_score=7
      and absolute_change=-0.33 and percentage_change=-4.71
    from public.institution_analytics_comparison())),
 ('selected previous period compares to older',
   (select current_score=7 and previous_score=6
      and absolute_change=1 and percentage_change=16.67
    from public.institution_analytics_comparison(
      (select id from fixture_ids where label='period_a_previous')))),
 ('oldest period has no invented predecessor',
   (select previous_period_id is null and absolute_change is null
    from public.institution_analytics_comparison(
      (select id from fixture_ids where label='period_a_older')))),
 ('campus A current score',
   (select average_score=6.67 and response_count=15
    from public.institution_analytics_breakdown(
      (select id from fixture_ids where label='period_a_current'))
    where scope='campus' and scope_id=(select id from fixture_ids where label='campus_a'))),
 ('program A current score',
   (select average_score=6.67 and response_count=15
    from public.institution_analytics_breakdown(
      (select id from fixture_ids where label='period_a_current'))
    where scope='program' and scope_id=(select id from fixture_ids where label='program_a'))),
 ('group A current score is publishable',
   (select average_score=6.67 and assignment_count=3
    from public.institution_analytics_breakdown(
      (select id from fixture_ids where label='period_a_current'))
    where scope='group' and scope_id=(select id from fixture_ids where label='group_a_current'))),
 ('small group score is hidden',
   (select pg_catalog.count(*) from public.institution_analytics_breakdown(
      null,null,null,(select id from fixture_ids where label='group_a_small')))=0),
 ('small group overview has no average',
   (select average_score is null and response_count=0
    from public.institution_analytics_overview(
      null,null,null,(select id from fixture_ids where label='group_a_small')))),
 ('small group questions are hidden',
   (select pg_catalog.count(*) from public.institution_question_analytics(
      null,null,null,(select id from fixture_ids where label='group_a_small')))=0),
 ('official fifteen questions are returned when publishable',
   (select pg_catalog.count(*) from public.institution_question_analytics(
      (select id from fixture_ids where label='period_a_current')))=15),
 ('first official question has correct mean and count',
   (select question_text='Dominio de la materia'
      and average_score=6.67 and response_count=15
    from public.institution_question_analytics(
      (select id from fixture_ids where label='period_a_current'))
    where question_order=1)),
 ('fifteenth official question is present',
   (select question_text='Satisfacción general'
    from public.institution_question_analytics(
      (select id from fixture_ids where label='period_a_current'))
    where question_order=15)),
 ('question extrema retain all ties',
   (select pg_catalog.count(*) from public.institution_question_analytics(
      (select id from fixture_ids where label='period_a_current'))
    where average_score=(select pg_catalog.max(average_score)
      from public.institution_question_analytics(
        (select id from fixture_ids where label='period_a_current'))))=15),
 ('teacher A trend preserves three periods',
   (select pg_catalog.count(*) from public.institution_teacher_trends(
      (select id from fixture_users where label='teacher_a')))=3),
 ('ranking still excludes unpublishable assignment',
   (select response_count=5 from public.institution_teacher_trends(
      (select id from fixture_users where label='teacher_a'))
    where period_id=(select id from fixture_ids where label='period_a_current')));

-- Empty and foreign UUID filters never reveal another tenant's analytics.
insert into audit_results values
 ('foreign period overview has zero and no score',
   (select expected=0 and completed=0 and average_score is null
    from public.institution_analytics_overview(
      (select id from fixture_ids where label='period_b_current')))),
 ('foreign campus breakdown is empty',
   (select pg_catalog.count(*) from public.institution_analytics_breakdown(
      null,(select id from fixture_ids where label='campus_b')))=0),
 ('foreign program questions are empty',
   (select pg_catalog.count(*) from public.institution_question_analytics(
      null,null,(select id from fixture_ids where label='program_b')))=0),
 ('foreign group teacher trends are empty',
   (select pg_catalog.count(*) from public.institution_teacher_trends(
      null,null,null,(select id from fixture_ids where label='group_b_current')))=0),
 ('foreign period comparison is absent',
   (select pg_catalog.count(*) from public.institution_analytics_comparison(
      (select id from fixture_ids where label='period_b_current')))=0),
 ('foreign campus trend has no score or participation',
   (select pg_catalog.bool_and(average_score is null and expected=0)
    from public.institution_analytics_trend(
      (select id from fixture_ids where label='campus_b'))));

-- A real future period without enrollment or answers must remain explicitly empty.
reset role;
insert into fixture_ids (label,id) values ('period_a_empty',gen_random_uuid());
insert into public.academic_periods (id,institution_id,name,starts_at,ends_at)
select f.id,i.id,'Periodo sin evaluaciones A',
  now()+interval '90 days',now()+interval '150 days'
from fixture_ids f cross join public.institutions i
where f.label='period_a_empty' and i.slug='ipn';
set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='coordinator_a'),true);
insert into audit_results values
 ('empty period has no division by zero',
   (select expected=0 and completed=0 and pending=0
      and participation=0 and average_score is null
    from public.institution_analytics_overview(
      (select id from fixture_ids where label='period_a_empty')))),
 ('empty period appears in trend without invented score',
   (select average_score is null and expected=0 and participation=0
    from public.institution_analytics_trend()
    where period_id=(select id from fixture_ids where label='period_a_empty'))),
 ('empty current period has no fake comparison',
   (select current_score is null and previous_score=6.67
      and absolute_change is null and percentage_change is null
    from public.institution_analytics_comparison())),
 ('empty period has no question scores',
   (select pg_catalog.count(*) from public.institution_question_analytics(
      (select id from fixture_ids where label='period_a_empty')))=0);
reset role;
delete from public.academic_periods
where id=(select id from fixture_ids where label='period_a_empty');
set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='coordinator_a'),true);

insert into audit_results
select 'all analytics RPC payloads omit student identity and individual answers',
  position('student_id' in payload)=0
  and position('evaluation_id' in payload)=0
  and position('institutional_email' in payload)=0
  and position('institutional_identifier' in payload)=0
  and position('Private Student' in payload)=0
  and position('private-student' in payload)=0
  and position('numeric_value' in payload)=0
from (select
  coalesce((select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x))::text
    from public.institution_analytics_overview() x),'') ||
  coalesce((select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x))::text
    from public.institution_analytics_trend() x),'') ||
  coalesce((select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x))::text
    from public.institution_analytics_comparison() x),'') ||
  coalesce((select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x))::text
    from public.institution_analytics_breakdown() x),'') ||
  coalesce((select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x))::text
    from public.institution_question_analytics() x),'') ||
  coalesce((select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x))::text
    from public.institution_teacher_trends() x),'') as payload) p;

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='coordinator_b'),true);
insert into audit_results values
 ('coordinator B sees only B overview',
   (select average_score=10 and expected=5 and completed=5
    from public.institution_analytics_overview())),
 ('coordinator B trend contains only B period',
   (select pg_catalog.count(*) from public.institution_analytics_trend())=1),
 ('coordinator B has no false comparison',
   (select previous_period_id is null and absolute_change is null
    from public.institution_analytics_comparison())),
 ('coordinator B cannot see A question aggregate',
   (select pg_catalog.count(*) from public.institution_question_analytics(
      (select id from fixture_ids where label='period_a_current')))=0);

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='hr_a'),true);
insert into audit_results values
 ('HR A has own trend only',
   (select pg_catalog.count(*) from public.institution_analytics_trend())=3),
 ('HR A question filter excludes B',
   (select pg_catalog.count(*) from public.institution_question_analytics(
      null,(select id from fixture_ids where label='campus_b')))=0),
 ('HR A teacher trends exclude B',
   (select pg_catalog.count(*) from public.institution_teacher_trends(
      (select id from fixture_users where label='teacher_b')))=0),
 ('HR classification from previous block remains derived',
   (select category='Excelente' and maximum_subjects=4
    from public.hr_teacher_metrics(
      (select id from fixture_ids where label='period_a_current'))
    where teacher_id=(select id from fixture_users where label='teacher_excellent')));

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='admin_a'),true);
insert into audit_results values
 ('admin A overview is own institution',
   (select average_score=6.60 and expected=29
    from public.institution_analytics_overview())),
 ('admin A trend excludes B periods',
   (select pg_catalog.count(*) from public.institution_analytics_trend())=3);
do $admin_denied$
begin
  begin
    perform * from public.institution_question_analytics();
    insert into audit_results values ('admin cannot see question analytics',false);
  exception when raise_exception then
    insert into audit_results values ('admin cannot see question analytics',true);
  end;
end $admin_denied$;

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='admin_b'),true);
insert into audit_results values
 ('admin B sees only B overview',
   (select average_score=10 and expected=5
    from public.institution_analytics_overview()));

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='student_a_1'),true);
do $student_denied$
begin
  begin
    perform * from public.institution_analytics_overview();
    insert into audit_results values ('student cannot execute analytics',false);
  exception when raise_exception then
    insert into audit_results values ('student cannot execute analytics',true);
  end;
end $student_denied$;

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='teacher_a'),true);
do $teacher_denied$
begin
  begin
    perform * from public.institution_analytics_trend();
    insert into audit_results values ('teacher cannot execute analytics',false);
  exception when raise_exception then
    insert into audit_results values ('teacher cannot execute analytics',true);
  end;
end $teacher_denied$;

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='coordinator_pending'),true);
do $pending_denied$
begin
  begin
    perform * from public.institution_analytics_comparison();
    insert into audit_results values ('pending cannot execute analytics',false);
  exception when raise_exception then
    insert into audit_results values ('pending cannot execute analytics',true);
  end;
end $pending_denied$;

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='institution_no_role'),true);
do $no_role_denied$
begin
  begin
    perform * from public.institution_analytics_overview();
    insert into audit_results values ('no-role cannot execute analytics',false);
  exception when raise_exception then
    insert into audit_results values ('no-role cannot execute analytics',true);
  end;
end $no_role_denied$;

reset role;
select pg_catalog.count(*) as tests,
  pg_catalog.count(*) filter (where passed) as passed,
  pg_catalog.count(*) filter (where not passed) as failed
from audit_results;
select test_name from audit_results where not passed order by test_name;
do $assert$ begin
  if exists (select 1 from audit_results where not passed) then
    raise exception 'institutional_analytics_tests_failed';
  end if;
end $assert$;
rollback;

