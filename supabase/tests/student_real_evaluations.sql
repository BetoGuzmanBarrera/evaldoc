-- Block 7 regression. Fictional Auth users and academic rows exist only
-- inside this transaction; ROLLBACK leaves the local seed unchanged.
begin;

create temp table audit_ids (label text primary key, id uuid not null) on commit drop;
create temp table audit_results (test_name text primary key, passed boolean not null) on commit drop;
create temp table audit_payloads (label text primary key, answers jsonb not null) on commit drop;
create temp table audit_created (id uuid not null) on commit drop;
grant select on audit_ids, audit_payloads to authenticated;
grant insert on audit_created to authenticated;
grant select, insert on audit_results to authenticated;

insert into audit_ids values
  ('student_a','d1000000-0000-4000-8000-000000000001'),
  ('teacher_a','d1000000-0000-4000-8000-000000000002'),
  ('uninscribed_a','d1000000-0000-4000-8000-000000000003'),
  ('pending_a','d1000000-0000-4000-8000-000000000004'),
  ('student_b','d1000000-0000-4000-8000-000000000005'),
  ('teacher_b','d1000000-0000-4000-8000-000000000006'),
  ('coordinator_a','d1000000-0000-4000-8000-000000000007'),
  ('campus_a','d2000000-0000-4000-8000-000000000001'),
  ('campus_b','d2000000-0000-4000-8000-000000000002'),
  ('program_a','d3000000-0000-4000-8000-000000000001'),
  ('program_b','d3000000-0000-4000-8000-000000000002'),
  ('subject_a','d4000000-0000-4000-8000-000000000001'),
  ('subject_b','d4000000-0000-4000-8000-000000000002'),
  ('period_a','d5000000-0000-4000-8000-000000000001'),
  ('period_b','d5000000-0000-4000-8000-000000000002'),
  ('group_a','d6000000-0000-4000-8000-000000000001'),
  ('group_b','d6000000-0000-4000-8000-000000000002'),
  ('assignment_a','d7000000-0000-4000-8000-000000000001'),
  ('assignment_b','d7000000-0000-4000-8000-000000000002'),
  ('window_a','d8000000-0000-4000-8000-000000000001'),
  ('window_b','d8000000-0000-4000-8000-000000000002'),
  ('window_closed','d8000000-0000-4000-8000-000000000003'),
  ('window_second','d8000000-0000-4000-8000-000000000004'),
  ('template_b','d9000000-0000-4000-8000-000000000001');

do $fixture$
declare
  institution_a uuid;
  institution_b uuid;
  official_template uuid;
  now_at timestamptz := pg_catalog.clock_timestamp();
begin
  select id into strict institution_a from public.institutions where slug='ipn';
  select id into strict institution_b from public.institutions where slug='unam';
  select id into strict official_template from public.survey_templates
    where name='Evaluación docente oficial' and version=1 and institution_id is null;

  insert into auth.users (id,email,raw_user_meta_data)
  select ids.id, 'student-a@block7.example.test',
    jsonb_build_object('institution_id',institution_a::text,'full_name','Student A',
                       'institutional_identifier','B7-SA')
  from audit_ids ids where label='student_a';
  insert into auth.users (id,email,raw_user_meta_data)
  select ids.id, 'teacher-a@block7.example.test',
    jsonb_build_object('institution_id',institution_a::text,'full_name','Teacher A',
                       'institutional_identifier','B7-TA')
  from audit_ids ids where label='teacher_a';
  insert into auth.users (id,email,raw_user_meta_data)
  select ids.id, 'uninscribed-a@block7.example.test',
    jsonb_build_object('institution_id',institution_a::text,'full_name','Uninscribed A',
                       'institutional_identifier','B7-UA')
  from audit_ids ids where label='uninscribed_a';
  insert into auth.users (id,email,raw_user_meta_data)
  select ids.id, 'pending-a@block7.example.test',
    jsonb_build_object('institution_id',institution_a::text,'full_name','Pending A',
                       'institutional_identifier','B7-PA')
  from audit_ids ids where label='pending_a';
  insert into auth.users (id,email,raw_user_meta_data)
  select ids.id, 'student-b@block7.example.test',
    jsonb_build_object('institution_id',institution_b::text,'full_name','Student B',
                       'institutional_identifier','B7-SB')
  from audit_ids ids where label='student_b';
  insert into auth.users (id,email,raw_user_meta_data)
  select ids.id, 'teacher-b@block7.example.test',
    jsonb_build_object('institution_id',institution_b::text,'full_name','Teacher B',
                       'institutional_identifier','B7-TB')
  from audit_ids ids where label='teacher_b';
  insert into auth.users (id,email,raw_user_meta_data)
  select ids.id, 'coordinator-a@block7.example.test',
    jsonb_build_object('institution_id',institution_a::text,'full_name','Coordinator A',
                       'institutional_identifier','B7-CA')
  from audit_ids ids where label='coordinator_a';

  update public.profiles set status='active'
  where id in (select id from audit_ids where label <> 'pending_a'
    and label in ('student_a','teacher_a','uninscribed_a','student_b','teacher_b','coordinator_a'));

  delete from public.user_roles
  where profile_id in (select id from audit_ids
    where label in ('teacher_a','teacher_b','coordinator_a'));
  insert into public.user_roles (profile_id,role_id,institution_id)
  select ids.id,r.id,p.institution_id from audit_ids ids
  join public.profiles p on p.id=ids.id
  join public.roles r on r.code=case when ids.label='coordinator_a' then 'coordinator' else 'teacher' end
  where ids.label in ('teacher_a','teacher_b','coordinator_a');

  insert into public.campuses (id,institution_id,name,code) values
    ((select id from audit_ids where label='campus_a'),institution_a,'Campus A','B7-CA'),
    ((select id from audit_ids where label='campus_b'),institution_b,'Campus B','B7-CB');
  insert into public.programs (id,institution_id,campus_id,name,code) values
    ((select id from audit_ids where label='program_a'),institution_a,
      (select id from audit_ids where label='campus_a'),'Programa A','B7-PA'),
    ((select id from audit_ids where label='program_b'),institution_b,
      (select id from audit_ids where label='campus_b'),'Programa B','B7-PB');
  insert into public.subjects (id,institution_id,program_id,name,code) values
    ((select id from audit_ids where label='subject_a'),institution_a,
      (select id from audit_ids where label='program_a'),'Materia A','B7-SA'),
    ((select id from audit_ids where label='subject_b'),institution_b,
      (select id from audit_ids where label='program_b'),'Materia B','B7-SB');
  insert into public.academic_periods
    (id,institution_id,name,starts_at,ends_at) values
    ((select id from audit_ids where label='period_a'),institution_a,
      'Periodo A',now_at - interval '30 days',now_at + interval '30 days'),
    ((select id from audit_ids where label='period_b'),institution_b,
      'Periodo B',now_at - interval '30 days',now_at + interval '30 days');
  insert into public.groups
    (id,institution_id,subject_id,academic_period_id,code) values
    ((select id from audit_ids where label='group_a'),institution_a,
      (select id from audit_ids where label='subject_a'),
      (select id from audit_ids where label='period_a'),'GA'),
    ((select id from audit_ids where label='group_b'),institution_b,
      (select id from audit_ids where label='subject_b'),
      (select id from audit_ids where label='period_b'),'GB');
  insert into public.teaching_assignments
    (id,institution_id,teacher_id,group_id,academic_period_id) values
    ((select id from audit_ids where label='assignment_a'),institution_a,
      (select id from audit_ids where label='teacher_a'),
      (select id from audit_ids where label='group_a'),
      (select id from audit_ids where label='period_a')),
    ((select id from audit_ids where label='assignment_b'),institution_b,
      (select id from audit_ids where label='teacher_b'),
      (select id from audit_ids where label='group_b'),
      (select id from audit_ids where label='period_b'));
  insert into public.student_enrollments
    (institution_id,student_id,group_id,academic_period_id) values
    (institution_a,(select id from audit_ids where label='student_a'),
      (select id from audit_ids where label='group_a'),
      (select id from audit_ids where label='period_a')),
    (institution_a,(select id from audit_ids where label='pending_a'),
      (select id from audit_ids where label='group_a'),
      (select id from audit_ids where label='period_a')),
    (institution_b,(select id from audit_ids where label='student_b'),
      (select id from audit_ids where label='group_b'),
      (select id from audit_ids where label='period_b'));

  insert into public.survey_templates (id,institution_id,name,version)
  values ((select id from audit_ids where label='template_b'),institution_b,
          'Plantilla institucional B',1);
  insert into public.survey_questions
    (survey_template_id,position,dimension,prompt,question_type,required)
  select (select id from audit_ids where label='template_b'),
    q.position,q.dimension,q.prompt,q.question_type,q.required
  from public.survey_questions q
  where q.survey_template_id=official_template;

  insert into public.evaluation_windows
    (id,institution_id,academic_period_id,survey_template_id,name,starts_at,ends_at) values
    ((select id from audit_ids where label='window_a'),institution_a,
      (select id from audit_ids where label='period_a'),official_template,
      'Ventana A',now_at - interval '1 day',now_at + interval '1 day'),
    ((select id from audit_ids where label='window_b'),institution_b,
      (select id from audit_ids where label='period_b'),
      (select id from audit_ids where label='template_b'),
      'Ventana B',now_at - interval '1 day',now_at + interval '1 day'),
    ((select id from audit_ids where label='window_closed'),institution_a,
      (select id from audit_ids where label='period_a'),official_template,
      'Ventana cerrada',now_at - interval '10 days',now_at - interval '5 days'),
    ((select id from audit_ids where label='window_second'),institution_a,
      (select id from audit_ids where label='period_a'),official_template,
      'Segunda ventana',now_at - interval '1 day',now_at + interval '2 days');

  begin
    insert into public.evaluation_windows
      (institution_id,academic_period_id,survey_template_id,name,starts_at,ends_at)
    values (institution_a,(select id from audit_ids where label='period_a'),
      (select id from audit_ids where label='template_b'),
      'Cruce inválido',now_at - interval '1 day',now_at + interval '1 day');
    insert into audit_results values ('A window rejects B template',false);
  exception when check_violation then
    insert into audit_results values ('A window rejects B template',true);
  end;
end;
$fixture$;

insert into audit_payloads (label,answers)
select 'official',jsonb_agg(jsonb_build_object(
  'question_id',q.id,
  'value',case (q.position-1)%5
    when 0 then 0 when 1 then 2.5 when 2 then 5
    when 3 then 7.5 else 10 end
) order by q.position)
from public.survey_questions q
join public.survey_templates t on t.id=q.survey_template_id
where t.name='Evaluación docente oficial' and t.institution_id is null;

-- Student A sees exactly one obligation; the open window wins over a closed one.
set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label='student_a'),true);
insert into audit_results values
  ('eligible student sees one pending obligation',
    (select count(*) from public.my_student_evaluations())=1
    and (select count(*) from public.my_student_evaluations()
         where assignment_id=(select id from audit_ids where label='assignment_a')
           and window_id=(select id from audit_ids where label='window_a')
           and status='pending' and can_submit)=1),
  ('student A cannot see B assignment, template, questions or window',
    (select count(*) from public.my_student_evaluations()
      where assignment_id=(select id from audit_ids where label='assignment_b'))=0
    and (select count(*) from public.teaching_assignments
      where id=(select id from audit_ids where label='assignment_b'))=0
    and (select count(*) from public.survey_templates
      where id=(select id from audit_ids where label='template_b'))=0
    and (select count(*) from public.survey_questions
      where survey_template_id=(select id from audit_ids where label='template_b'))=0
    and (select count(*) from public.evaluation_windows
      where id=(select id from audit_ids where label='window_b'))=0);

do $tests$
declare
  assignment_a uuid := (select id from audit_ids where label='assignment_a');
  assignment_b uuid := (select id from audit_ids where label='assignment_b');
  window_a uuid := (select id from audit_ids where label='window_a');
  window_b uuid := (select id from audit_ids where label='window_b');
  window_closed uuid := (select id from audit_ids where label='window_closed');
  payload jsonb := (select answers from audit_payloads where label='official');
  b_question uuid;
begin
  select q.id into b_question from public.survey_questions q
  where q.survey_template_id=(select id from audit_ids where label='template_b')
  limit 1;
  -- RLS hides B questions, so choose a guaranteed foreign UUID instead.
  b_question := 'ffffffff-ffff-4fff-8fff-ffffffffffff';

  begin
    perform public.submit_evaluation(assignment_b,window_a,payload);
    insert into audit_results values ('wrong assignment rejected',false);
  exception when others then
    insert into audit_results values ('wrong assignment rejected',
      sqlerrm='evaluation_unavailable');
  end;
  begin
    perform public.submit_evaluation(assignment_a,window_b,payload);
    insert into audit_results values ('B window rejected',false);
  exception when others then
    insert into audit_results values ('B window rejected',
      sqlerrm='evaluation_unavailable');
  end;
  begin
    perform public.submit_evaluation(assignment_a,window_closed,payload);
    insert into audit_results values ('closed window rejected',false);
  exception when others then
    insert into audit_results values ('closed window rejected',
      sqlerrm='window_closed');
  end;
  begin
    perform public.submit_evaluation(assignment_a,window_a,payload - 0);
    insert into audit_results values ('missing required answer rejected',false);
  exception when others then
    insert into audit_results values ('missing required answer rejected',
      sqlerrm='invalid_answers');
  end;
  begin
    perform public.submit_evaluation(assignment_a,window_a,
      jsonb_set(payload,'{1,question_id}',payload->0->'question_id'));
    insert into audit_results values ('duplicate question rejected',false);
  exception when others then
    insert into audit_results values ('duplicate question rejected',
      sqlerrm='invalid_answers');
  end;
  begin
    perform public.submit_evaluation(assignment_a,window_a,
      jsonb_set(payload,'{0,question_id}',to_jsonb(b_question::text)));
    insert into audit_results values ('foreign question rejected',false);
  exception when others then
    insert into audit_results values ('foreign question rejected',
      sqlerrm='invalid_answers');
  end;
  begin
    perform public.submit_evaluation(assignment_a,window_a,
      jsonb_set(payload,'{0,value}','1'::jsonb));
    insert into audit_results values ('value 1 rejected',false);
  exception when others then
    insert into audit_results values ('value 1 rejected',sqlerrm='invalid_answers');
  end;
  begin
    perform public.submit_evaluation(assignment_a,window_a,
      jsonb_set(payload,'{0,value}','3.5'::jsonb));
    insert into audit_results values ('value 3.5 rejected',false);
  exception when others then
    insert into audit_results values ('value 3.5 rejected',sqlerrm='invalid_answers');
  end;

end;
$tests$;

reset role;
insert into audit_results values ('invalid sends left no partial evaluation',
  (select count(*) from public.evaluations
    where teaching_assignment_id=(select id from audit_ids where label='assignment_a'))=0
  and (select count(*) from public.evaluation_answers a
    join public.evaluations e on e.id=a.evaluation_id
    where e.teaching_assignment_id=(select id from audit_ids where label='assignment_a'))=0);
set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label='uninscribed_a'),true);
insert into audit_results values ('uninscribed student sees no obligation',
  (select count(*) from public.my_student_evaluations())=0);
do $tests$
begin
  begin
    perform public.submit_evaluation(
      (select id from audit_ids where label='assignment_a'),
      (select id from audit_ids where label='window_a'),
      (select answers from audit_payloads where label='official'));
    insert into audit_results values ('uninscribed student cannot submit',false);
  exception when others then
    insert into audit_results values ('uninscribed student cannot submit',
      sqlerrm='evaluation_unavailable');
  end;
end;
$tests$;

select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label='pending_a'),true);
insert into audit_results values ('pending student sees no obligation',
  (select count(*) from public.my_student_evaluations())=0);
do $tests$
begin
  begin
    perform public.submit_evaluation(
      (select id from audit_ids where label='assignment_a'),
      (select id from audit_ids where label='window_a'),
      (select answers from audit_payloads where label='official'));
    insert into audit_results values ('pending student cannot submit',false);
  exception when others then
    insert into audit_results values ('pending student cannot submit',
      sqlerrm='evaluation_unavailable');
  end;
end;
$tests$;

select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label='student_b'),true);
insert into audit_results values ('student B sees only B obligation',
  (select count(*) from public.my_student_evaluations())=1
  and (select count(*) from public.my_student_evaluations()
       where assignment_id=(select id from audit_ids where label='assignment_b'))=1);
do $tests$
begin
  begin
    perform public.submit_evaluation(
      (select id from audit_ids where label='assignment_a'),
      (select id from audit_ids where label='window_a'),
      (select answers from audit_payloads where label='official'));
    insert into audit_results values ('student B cannot submit A UUIDs',false);
  exception when others then
    insert into audit_results values ('student B cannot submit A UUIDs',
      sqlerrm='evaluation_unavailable');
  end;
end;
$tests$;

select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label='student_a'),true);
do $tests$
declare
  created_id uuid;
begin
  created_id := public.submit_evaluation(
    (select id from audit_ids where label='assignment_a'),
    (select id from audit_ids where label='window_a'),
    (select answers from audit_payloads where label='official'));
  insert into audit_created values (created_id);
  insert into audit_results values
    ('catalog now reports completion',
      (select count(*) from public.my_student_evaluations()
       where evaluation_id=created_id and status='completed')=1);
  begin
    perform public.submit_evaluation(
      (select id from audit_ids where label='assignment_a'),
      (select id from audit_ids where label='window_a'),
      (select answers from audit_payloads where label='official'));
    insert into audit_results values ('second send rejected',false);
  exception when others then
    insert into audit_results values ('second send rejected',sqlerrm='already_submitted');
  end;
  begin
    perform public.submit_evaluation(
      (select id from audit_ids where label='assignment_a'),
      (select id from audit_ids where label='window_second'),
      (select answers from audit_payloads where label='official'));
    insert into audit_results values ('second window cannot bypass RF03',false);
  exception when others then
    insert into audit_results values ('second window cannot bypass RF03',
      sqlerrm='already_submitted');
  end;
end;
$tests$;

-- The authenticated client has no direct SELECT grant; inspect writes as
-- the fixture owner after testing the client-facing catalog.
reset role;
insert into audit_results values
  ('valid send creates completed evaluation',
    (select count(*) from public.evaluations
     where id=(select id from audit_created) and status='completed')=1),
  ('valid send writes exactly 15 answers',
    (select count(*) from public.evaluation_answers
     where evaluation_id=(select id from audit_created))=15),
  ('all five official scale values were accepted',
    (select count(distinct numeric_value) from public.evaluation_answers
     where evaluation_id=(select id from audit_created))=5
    and (select min(numeric_value) from public.evaluation_answers
         where evaluation_id=(select id from audit_created))=0
    and (select max(numeric_value) from public.evaluation_answers
         where evaluation_id=(select id from audit_created))=10);

-- Only privileged fixture setup can write directly. Test immutability and
-- normalized RF03 across a second group for the same teacher and subject.
do $tests$
declare
  institution_a uuid := (select id from public.institutions where slug='ipn');
  created_group uuid := 'd6000000-0000-4000-8000-000000000003';
  created_assignment uuid := 'd7000000-0000-4000-8000-000000000003';
begin
  begin
    update public.survey_questions set prompt='Changed after use'
    where id=(select q.id from public.survey_questions q
      join public.survey_templates t on t.id=q.survey_template_id
      where t.name='Evaluación docente oficial' order by q.position limit 1);
    insert into audit_results values ('used question cannot be changed',false);
  exception when check_violation then
    insert into audit_results values ('used question cannot be changed',true);
  end;
  begin
    update public.survey_templates set name='Changed after use'
    where name='Evaluación docente oficial';
    insert into audit_results values ('used template cannot be changed',false);
  exception when check_violation then
    insert into audit_results values ('used template cannot be changed',true);
  end;
  insert into public.groups
    (id,institution_id,subject_id,academic_period_id,code) values
    (created_group,institution_a,
      (select id from audit_ids where label='subject_a'),
      (select id from audit_ids where label='period_a'),'GA2');
  insert into public.teaching_assignments
    (id,institution_id,teacher_id,group_id,academic_period_id) values
    (created_assignment,institution_a,
      (select id from audit_ids where label='teacher_a'),
      created_group,(select id from audit_ids where label='period_a'));
  insert into public.student_enrollments
    (institution_id,student_id,group_id,academic_period_id) values
    (institution_a,(select id from audit_ids where label='student_a'),
      created_group,(select id from audit_ids where label='period_a'));
  begin
    insert into public.evaluations
      (institution_id,academic_period_id,evaluation_window_id,
       teaching_assignment_id,student_id,status,started_at,submitted_at) values
      (institution_a,(select id from audit_ids where label='period_a'),
       (select id from audit_ids where label='window_second'),
       created_assignment,(select id from audit_ids where label='student_a'),
       'completed',now(),now());
    insert into audit_results values ('second group same subject and teacher rejected',false);
  exception when unique_violation then
    insert into audit_results values ('second group same subject and teacher rejected',true);
  end;
end;
$tests$;

set local role authenticated;
select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label='teacher_a'),true);
insert into audit_results values ('teacher catalog has no student rows',
  (select count(*) from public.my_student_evaluations())=0);
do $tests$
begin
  begin
    perform count(*) from public.evaluation_answers;
    insert into audit_results values ('teacher cannot read individual answers',false);
  exception when insufficient_privilege then
    insert into audit_results values ('teacher cannot read individual answers',true);
  end;
end;
$tests$;

select set_config('request.jwt.claim.sub',
  (select id::text from audit_ids where label='coordinator_a'),true);
do $tests$
begin
  begin
    perform count(*) from public.evaluations;
    insert into audit_results values ('coordinator cannot read student identity',false);
  exception when insufficient_privilege then
    insert into audit_results values ('coordinator cannot read student identity',true);
  end;
end;
$tests$;

reset role;
select count(*) as tests, count(*) filter (where passed) as passed,
  array_agg(test_name order by test_name) filter (where not passed) as failed
from audit_results;
do $tests$
begin
  if exists (select 1 from audit_results where not passed) then
    raise exception 'Block 7 evaluation regression failed';
  end if;
end;
$tests$;
rollback;
