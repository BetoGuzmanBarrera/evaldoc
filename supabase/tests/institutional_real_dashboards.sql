-- Block 9 institutional isolation. All fictional users and academic rows roll back.
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

set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='coordinator_a'),true);
insert into audit_results values
 ('coordinator A sees own institution filter catalog',
   (select count(*) from public.institutional_filter_options() where scope='campus')=1),
 ('coordinator A cannot enumerate B filters',
   (select count(*) from public.institutional_filter_options()
    where id in (select id from fixture_ids where label in ('campus_b','program_b','group_b_current','period_b_current')))=0),
 ('group filter options keep their academic period',
   (select period_id from public.institutional_filter_options()
    where id=(select id from fixture_ids where label='group_a_current'))=
    (select id from fixture_ids where label='period_a_current')),
 ('coordinator A total expected obligations',
   (select expected from public.institution_participation() where scope='total')=24),
 ('coordinator A total completed obligations',
   (select completed from public.institution_participation() where scope='total')=21),
 ('coordinator A total pending obligations',
   (select pending from public.institution_participation() where scope='total')=3),
 ('coordinator A participation percentage',
   (select participation from public.institution_participation() where scope='total')=87.50),
 ('coordinator A current period expected',
   (select expected from public.institution_participation(
     (select id from fixture_ids where label='period_a_current')) where scope='total')=19),
 ('coordinator A previous period preserved',
   (select expected=5 and completed=5 from public.institution_participation(
     (select id from fixture_ids where label='period_a_previous')) where scope='total')),
 ('campus A filter returns only A obligations',
   (select expected from public.institution_participation(null,
     (select id from fixture_ids where label='campus_a')) where scope='total')=24),
 ('program A filter returns only A obligations',
   (select expected from public.institution_participation(null,null,
     (select id from fixture_ids where label='program_a')) where scope='total')=24),
 ('group A filter returns own group obligations',
   (select expected=18 and completed=15 from public.institution_participation(null,null,null,
     (select id from fixture_ids where label='group_a_current')) where scope='total')),
 ('foreign campus filter returns zero',
   (select expected from public.institution_participation(null,
     (select id from fixture_ids where label='campus_b')) where scope='total')=0),
 ('foreign program filter returns zero',
   (select expected from public.institution_participation(null,null,
     (select id from fixture_ids where label='program_b')) where scope='total')=0),
 ('foreign group filter returns zero',
   (select expected from public.institution_participation(null,null,null,
     (select id from fixture_ids where label='group_b_current')) where scope='total')=0),
 ('foreign period filter returns zero',
   (select expected from public.institution_participation(
     (select id from fixture_ids where label='period_b_current')) where scope='total')=0),
 ('ranking excludes under-five group score',
   (select average_score from public.institution_teacher_ranking(
     (select id from fixture_ids where label='period_a_current'))
    where teacher_id=(select id from fixture_users where label='teacher_a'))=8),
 ('ranking contains only A teachers',
   (select count(*) from public.institution_teacher_ranking()
     where teacher_id=(select id from fixture_users where label='teacher_b'))=0),
 ('ranking excludes small-only group',
   (select count(*) from public.institution_teacher_ranking(null,null,null,
     (select id from fixture_ids where label='group_a_small')))=0),
 ('ranking rejects foreign UUID filters',
   (select count(*) from public.institution_teacher_ranking(
     (select id from fixture_ids where label='period_b_current')))=0),
 ('score summary excludes hidden group and averages only published responses',
   (select average_score=6.67 and response_count=15 and teacher_count=3
    from public.institution_score_summary(
      (select id from fixture_ids where label='period_a_current')))),
 ('score summary hides unpublishable group',
   (select average_score is null and response_count=0
    from public.institution_score_summary(null,null,null,
      (select id from fixture_ids where label='group_a_small')))),
 ('overview is A only',
   (select institution_id from public.institution_overview())=
     (select institution_id from fixture_users where label='coordinator_a')),
 ('overview publishes only safe score',
   (select average_score from public.institution_overview()) > 0);

insert into audit_results
select 'aggregate RPC contracts omit student identity and answers',
  position('student_id' in payload)=0 and position('evaluation_id' in payload)=0
  and position('institutional_email' in payload)=0
  and position('private-student' in payload)=0
  and position('Private Student' in payload)=0
  and position('SECRET-A-' in payload)=0 and position('SECRET-B-' in payload)=0
  and position('numeric_value' in payload)=0
from (select coalesce((select jsonb_agg(to_jsonb(p))::text
  from public.institution_participation() p),'') ||
  coalesce((select jsonb_agg(to_jsonb(r))::text
  from public.institution_teacher_ranking() r),'') ||
  coalesce((select jsonb_agg(to_jsonb(o))::text
  from public.institution_overview() o),'') as payload) contracts;

do $denials$
begin
  begin
    perform pg_catalog.count(*) from public.evaluations;
    insert into audit_results values ('coordinator cannot select evaluations directly',false);
  exception when insufficient_privilege then
    insert into audit_results values ('coordinator cannot select evaluations directly',true);
  end;
  begin
    perform pg_catalog.count(*) from public.evaluation_answers;
    insert into audit_results values ('coordinator cannot select answers directly',false);
  exception when insufficient_privilege then
    insert into audit_results values ('coordinator cannot select answers directly',true);
  end;
  begin
    perform * from public.admin_institution_users();
    insert into audit_results values ('coordinator cannot list admin profiles',false);
  exception when raise_exception then
    insert into audit_results values ('coordinator cannot list admin profiles',true);
  end;
end;
$denials$;

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='coordinator_b'),true);
insert into audit_results values
 ('coordinator B sees only B participation',
   (select expected=5 and completed=5 from public.institution_participation() where scope='total')),
 ('coordinator B cannot see A ranking',
   (select pg_catalog.count(*) from public.institution_teacher_ranking()
    where teacher_id=(select id from fixture_users where label='teacher_a'))=0),
 ('coordinator B sees only own institution overview',
   (select institution_id from public.institution_overview())=
    (select institution_id from fixture_users where label='coordinator_b'));

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='hr_a'),true);
insert into audit_results values
 ('HR A sees three current publishable teachers',
   (select pg_catalog.count(*) from public.hr_teacher_metrics(
     (select id from fixture_ids where label='period_a_current')))=3),
 ('HR A excludes B teacher',
   (select pg_catalog.count(*) from public.hr_teacher_metrics()
    where teacher_id=(select id from fixture_users where label='teacher_b'))=0),
 ('HR A excellent ten category and recommendation',
   (select category='Excelente' and recommendation='Altamente Recomendado'
      and maximum_subjects=4 from public.hr_teacher_metrics(
        (select id from fixture_ids where label='period_a_current'))
    where teacher_id=(select id from fixture_users where label='teacher_excellent'))),
 ('HR A good eight category and recommendation',
   (select category='Bueno' and recommendation='Recomendado'
      and maximum_subjects=3 from public.hr_teacher_metrics(
        (select id from fixture_ids where label='period_a_current'))
    where teacher_id=(select id from fixture_users where label='teacher_a'))),
 ('HR A sufficient seven category and recommendation',
   (select category='Suficiente' and recommendation='Requiere Mejora (Capacitación)'
      and maximum_subjects=2 from public.hr_teacher_metrics(
        (select id from fixture_ids where label='period_a_previous'))
    where teacher_id=(select id from fixture_users where label='teacher_a'))),
 ('HR A insufficient category and recommendation',
   (select category='No Suficiente' and recommendation='No Contratable'
      and maximum_subjects=0 from public.hr_teacher_metrics(
        (select id from fixture_ids where label='period_a_current'))
    where teacher_id=(select id from fixture_users where label='teacher_a_other'))),
 ('HR A ranking contains only published own teachers',
   (select pg_catalog.count(*) from public.institution_teacher_ranking(
     (select id from fixture_ids where label='period_a_current')))=3),
 ('HR A cannot request B period',
   (select pg_catalog.count(*) from public.hr_teacher_metrics(
     (select id from fixture_ids where label='period_b_current')))=0),
 ('HR A cannot request B campus',
   (select pg_catalog.count(*) from public.hr_teacher_metrics(null,
     (select id from fixture_ids where label='campus_b')))=0);
do $hr_denied$
begin
  begin
    perform * from public.admin_institution_summary();
    insert into audit_results values ('HR cannot execute admin summary',false);
  exception when raise_exception then
    insert into audit_results values ('HR cannot execute admin summary',true);
  end;
end;
$hr_denied$;

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='hr_b'),true);
insert into audit_results values
 ('HR B sees only B teacher',
   (select pg_catalog.count(*) from public.hr_teacher_metrics())=1
   and (select average_score from public.hr_teacher_metrics())=10),
 ('HR B cannot see A filters',
   (select pg_catalog.count(*) from public.institutional_filter_options()
    where id=(select id from fixture_ids where label='campus_a'))=0);

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='admin_a'),true);
insert into audit_results values
 ('admin A sees own users only',
   (select user_count from public.admin_institution_summary())=16),
 ('admin A status counts are real',
   (select pending_count=2 and active_count=14 and inactive_count=0
    from public.admin_institution_summary())),
 ('admin A role counts are real',
   (select student_count=6 and teacher_count=4 and coordinator_count=2
      and hr_count=1 and admin_count=1 from public.admin_institution_summary())),
 ('admin A structure counts are real',
   (select campus_count=1 and program_count=1 and subject_count=2
      and group_count=3 and period_count=2 from public.admin_institution_summary())),
 ('admin A users exclude B emails',
   (select pg_catalog.count(*) from public.admin_institution_users()
    where institutional_email like '%teacher_b%')=0),
 ('admin A users include pending and no-role profiles',
   (select pg_catalog.count(*) from public.admin_institution_users()
    where status='pending'::public.user_status)=2
   and (select pg_catalog.count(*) from public.admin_institution_users()
    where pg_catalog.cardinality(role_codes)=0)=2),
 ('admin A search stays within institution',
   (select pg_catalog.count(*) from public.admin_institution_users('teacher_b'))=0),
 ('admin A overview contains one institution',
   (select pg_catalog.count(*) from public.institution_overview())=1);
do $admin_denied$
begin
  begin
    perform * from public.institution_teacher_ranking();
    insert into audit_results values ('admin without coordinator or HR cannot rank teachers',false);
  exception when raise_exception then
    insert into audit_results values ('admin without coordinator or HR cannot rank teachers',true);
  end;
  begin
    perform * from public.institution_score_summary();
    insert into audit_results values ('admin without coordinator or HR cannot see score summary',false);
  exception when raise_exception then
    insert into audit_results values ('admin without coordinator or HR cannot see score summary',true);
  end;
end;
$admin_denied$;

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='admin_b'),true);
insert into audit_results values
 ('admin B sees only B users',
   (select user_count from public.admin_institution_summary())=9),
 ('admin B cannot list A users',
   (select pg_catalog.count(*) from public.admin_institution_users()
    where institutional_email like '%admin_a%')=0),
 ('admin B sees only B structure',
   (select campus_count=1 and program_count=1 and subject_count=1
      and group_count=1 and period_count=1 from public.admin_institution_summary()));

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='student_a_1'),true);
do $student_denied$
begin
  begin
    perform * from public.institution_participation();
    insert into audit_results values ('student cannot execute institutional participation',false);
  exception when raise_exception then
    insert into audit_results values ('student cannot execute institutional participation',true);
  end;
  begin
    perform * from public.institution_teacher_ranking();
    insert into audit_results values ('student cannot execute coordinator ranking',false);
  exception when raise_exception then
    insert into audit_results values ('student cannot execute coordinator ranking',true);
  end;
end;
$student_denied$;

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='teacher_a'),true);
do $teacher_denied$
begin
  begin
    perform * from public.hr_teacher_metrics();
    insert into audit_results values ('teacher cannot execute HR metrics',false);
  exception when raise_exception then
    insert into audit_results values ('teacher cannot execute HR metrics',true);
  end;
end;
$teacher_denied$;

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='coordinator_pending'),true);
do $pending_denied$
begin
  begin
    perform * from public.institutional_filter_options();
    insert into audit_results values ('pending coordinator cannot list filters',false);
  exception when raise_exception then
    insert into audit_results values ('pending coordinator cannot list filters',true);
  end;
  begin
    perform * from public.institution_participation();
    insert into audit_results values ('pending coordinator cannot see participation',false);
  exception when raise_exception then
    insert into audit_results values ('pending coordinator cannot see participation',true);
  end;
  begin
    perform * from public.institution_teacher_ranking();
    insert into audit_results values ('pending coordinator cannot see ranking',false);
  exception when raise_exception then
    insert into audit_results values ('pending coordinator cannot see ranking',true);
  end;
  begin
    perform * from public.institution_score_summary();
    insert into audit_results values ('pending coordinator cannot see score summary',false);
  exception when raise_exception then
    insert into audit_results values ('pending coordinator cannot see score summary',true);
  end;
  begin
    perform * from public.institution_overview();
    insert into audit_results values ('pending coordinator cannot fetch data',false);
  exception when raise_exception then
    insert into audit_results values ('pending coordinator cannot fetch data',true);
  end;
end;
$pending_denied$;

select set_config('request.jwt.claim.sub',
  (select id::text from fixture_users where label='institution_no_role'),true);
do $role_denied$
begin
  begin
    perform * from public.admin_institution_summary();
    insert into audit_results values ('active user without role cannot fetch data',false);
  exception when raise_exception then
    insert into audit_results values ('active user without role cannot fetch data',true);
  end;
end;
$role_denied$;

reset role;
select pg_catalog.count(*) as tests,
  pg_catalog.count(*) filter (where passed) as passed,
  pg_catalog.count(*) filter (where not passed) as failed
from audit_results;
do $assert$ begin
  if exists (select 1 from audit_results where not passed) then
    raise exception 'institutional_dashboard_tests_failed';
  end if;
end $assert$;
rollback;


