-- Block 7: a complete student evaluation is written only by one authenticated RPC.
-- Historical templates remain immutable after a response uses them.

alter table public.evaluations
  add constraint evaluations_student_assignment_period_key
  unique (student_id, teaching_assignment_id, academic_period_id);

create function app_private.enforce_window_template_scope()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and exists (
    select 1 from public.evaluations e
    where e.evaluation_window_id = old.id
  ) and (
    new.institution_id is distinct from old.institution_id
    or new.academic_period_id is distinct from old.academic_period_id
    or new.survey_template_id is distinct from old.survey_template_id
  ) then
    raise exception 'used_window_is_immutable' using errcode = '23514';
  end if;

  perform 1
  from public.survey_templates t
  where t.id = new.survey_template_id
    and (t.institution_id is null or t.institution_id = new.institution_id)
  for share;
  if not found then
    raise exception 'window_template_institution_mismatch' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger evaluation_windows_template_scope
before insert or update of institution_id, academic_period_id, survey_template_id
on public.evaluation_windows
for each row execute function app_private.enforce_window_template_scope();

create function app_private.protect_used_template()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.evaluation_windows w
    join public.evaluations e on e.evaluation_window_id = w.id
    where w.survey_template_id = old.id
  ) then
    raise exception 'used_template_is_immutable' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' and exists (
    select 1
    from public.evaluation_windows w
    where w.survey_template_id = old.id
      and new.institution_id is not null
      and w.institution_id <> new.institution_id
  ) then
    raise exception 'window_template_institution_mismatch' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger survey_templates_protect_history
before update or delete on public.survey_templates
for each row execute function app_private.protect_used_template();

create function app_private.protect_used_questions()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  old_template_id uuid;
  new_template_id uuid;
begin
  if tg_op <> 'INSERT' then old_template_id := old.survey_template_id; end if;
  if tg_op <> 'DELETE' then new_template_id := new.survey_template_id; end if;

  -- Submission holds a SHARE lock on the template until commit. Question
  -- changes take UPDATE locks, so the validated set cannot change mid-send.
  perform 1 from public.survey_templates t
  where t.id in (old_template_id, new_template_id)
  order by t.id for update;

  if exists (
    select 1
    from public.evaluation_windows w
    join public.evaluations e on e.evaluation_window_id = w.id
    where w.survey_template_id in (old_template_id, new_template_id)
  ) then
    raise exception 'used_questions_are_immutable' using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger survey_questions_protect_history
before insert or update or delete on public.survey_questions
for each row execute function app_private.protect_used_questions();

-- The normalized business key is student + teacher + subject + period.
-- A unique constraint above handles repeated windows for one assignment;
-- this trigger also covers a second group/assignment for the same subject.
create function app_private.prevent_duplicate_obligation()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_teacher_id uuid;
  v_subject_id uuid;
begin
  select ta.teacher_id, g.subject_id into v_teacher_id, v_subject_id
  from public.teaching_assignments ta
  join public.groups g
    on g.institution_id = ta.institution_id
   and g.id = ta.group_id
   and g.academic_period_id = ta.academic_period_id
  where ta.id = new.teaching_assignment_id
    and ta.institution_id = new.institution_id
    and ta.academic_period_id = new.academic_period_id;

  if not found then
    raise exception 'evaluation_assignment_unavailable' using errcode = '23503';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      new.student_id::text || ':' || v_teacher_id::text || ':' ||
      v_subject_id::text || ':' || new.academic_period_id::text, 0
    )
  );

  if exists (
    select 1
    from public.evaluations e
    join public.teaching_assignments ta
      on ta.id = e.teaching_assignment_id
     and ta.institution_id = e.institution_id
     and ta.academic_period_id = e.academic_period_id
    join public.groups g
      on g.id = ta.group_id
     and g.institution_id = ta.institution_id
     and g.academic_period_id = ta.academic_period_id
    where e.student_id = new.student_id
      and e.academic_period_id = new.academic_period_id
      and ta.teacher_id = v_teacher_id
      and g.subject_id = v_subject_id
      and e.id <> new.id
  ) then
    raise exception 'already_submitted' using errcode = '23505';
  end if;
  return new;
end;
$$;

create trigger evaluations_prevent_duplicate_obligation
before insert or update of student_id, teaching_assignment_id, academic_period_id
on public.evaluations
for each row execute function app_private.prevent_duplicate_obligation();

-- Read catalog: no caller-supplied identity or tenant, and no student_id in output.
-- A completed evaluation remains visible when its window closes. An unanswered
-- obligation has one chosen window per teacher/subject/period.
create function app_private.my_student_evaluations()
returns table (
  assignment_id uuid,
  window_id uuid,
  evaluation_id uuid,
  status public.evaluation_status,
  subject_name text,
  teacher_name text,
  group_code text,
  period_name text,
  program_name text,
  closes_at timestamptz,
  submitted_at timestamptz,
  template_id uuid,
  can_submit boolean
)
language sql stable security definer
set search_path = ''
as $$
  with me as (
    select p.id, p.institution_id
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'active'::public.user_status
      and exists (
        select 1 from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.profile_id = p.id
          and ur.institution_id = p.institution_id
          and r.code = 'student'
      )
  ),
  candidates as (
    select
      ta.id as assignment_id,
      w.id as window_id,
      ev.id as evaluation_id,
      case when ev.status = 'completed'::public.evaluation_status
        then 'completed'::public.evaluation_status
        else 'pending'::public.evaluation_status end as status,
      s.name as subject_name,
      teacher.full_name as teacher_name,
      g.code as group_code,
      ap.name as period_name,
      coalesce(program.name, 'Programa académico') as program_name,
      w.ends_at as closes_at,
      ev.submitted_at,
      t.id as template_id,
      (
        ev.id is null
        and w.active and t.active and g.active and s.active and ap.active
        and teacher.status = 'active'::public.user_status
        and exists (
          select 1 from public.user_roles tr
          join public.roles rr on rr.id = tr.role_id
          where tr.profile_id = teacher.id
            and tr.institution_id = me.institution_id
            and rr.code = 'teacher'
        )
        and pg_catalog.now() between w.starts_at and w.ends_at
        and pg_catalog.now() between ap.starts_at and ap.ends_at
        and (
          select count(*) = 15
            and count(*) filter (
              where q.question_type = 'scale'::public.question_type and q.required
            ) = 15
          from public.survey_questions q
          where q.survey_template_id = t.id and q.active
        )
      ) as can_submit,
      ta.teacher_id,
      s.id as subject_id,
      ap.id as period_id
    from me
    join public.student_enrollments enrollment
      on enrollment.student_id = me.id
     and enrollment.institution_id = me.institution_id
    join public.groups g
      on g.id = enrollment.group_id
     and g.institution_id = enrollment.institution_id
     and g.academic_period_id = enrollment.academic_period_id
    join public.subjects s
      on s.id = g.subject_id and s.institution_id = g.institution_id
    left join public.programs program
      on program.id = s.program_id and program.institution_id = s.institution_id
    join public.teaching_assignments ta
      on ta.group_id = g.id
     and ta.institution_id = g.institution_id
     and ta.academic_period_id = g.academic_period_id
    join public.profiles teacher
      on teacher.id = ta.teacher_id and teacher.institution_id = me.institution_id
    join public.academic_periods ap
      on ap.id = g.academic_period_id and ap.institution_id = me.institution_id
    join public.evaluation_windows w
      on w.academic_period_id = ap.id and w.institution_id = me.institution_id
    join public.survey_templates t
      on t.id = w.survey_template_id
     and (t.institution_id is null or t.institution_id = me.institution_id)
    left join public.evaluations ev
      on ev.student_id = me.id
     and ev.teaching_assignment_id = ta.id
     and ev.evaluation_window_id = w.id
    where ev.status = 'completed'::public.evaluation_status
       or (
         w.active
         and not exists (
           select 1
           from public.evaluations prior
           join public.teaching_assignments prior_ta
             on prior_ta.id = prior.teaching_assignment_id
            and prior_ta.institution_id = prior.institution_id
            and prior_ta.academic_period_id = prior.academic_period_id
           join public.groups prior_group
             on prior_group.id = prior_ta.group_id
            and prior_group.institution_id = prior_ta.institution_id
            and prior_group.academic_period_id = prior_ta.academic_period_id
           where prior.student_id = me.id
             and prior.academic_period_id = ap.id
             and prior_ta.teacher_id = ta.teacher_id
             and prior_group.subject_id = s.id
         )
       )
  )
  select distinct on (c.teacher_id, c.subject_id, c.period_id)
    c.assignment_id, c.window_id, c.evaluation_id, c.status,
    c.subject_name, c.teacher_name, c.group_code, c.period_name,
    c.program_name, c.closes_at, c.submitted_at, c.template_id,
    c.can_submit
  from candidates c
  order by c.teacher_id, c.subject_id, c.period_id,
    case when c.status = 'completed'::public.evaluation_status then 0
         when c.can_submit then 1 else 2 end,
    c.closes_at, c.window_id
$$;

create function public.my_student_evaluations()
returns table (
  assignment_id uuid,
  window_id uuid,
  evaluation_id uuid,
  status public.evaluation_status,
  subject_name text,
  teacher_name text,
  group_code text,
  period_name text,
  program_name text,
  closes_at timestamptz,
  submitted_at timestamptz,
  template_id uuid,
  can_submit boolean
)
language sql stable security invoker
set search_path = ''
as $$
  select c.assignment_id, c.window_id, c.evaluation_id, c.status,
    c.subject_name, c.teacher_name, c.group_code, c.period_name,
    c.program_name, c.closes_at, c.submitted_at, c.template_id,
    c.can_submit
  from app_private.my_student_evaluations() c
$$;

create function app_private.submit_evaluation(
  p_assignment_id uuid, p_window_id uuid, p_answers jsonb
)
returns uuid
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_student_id uuid := auth.uid();
  v_institution_id uuid;
  v_period_id uuid;
  v_template_id uuid;
  opened_at timestamptz;
  closed_at timestamptz;
  period_starts_at timestamptz;
  period_ends_at timestamptz;
  submitted_time timestamptz;
  answer_count integer;
  distinct_count integer;
  valid_count integer;
  question_count integer;
  valid_question_count integer;
  new_evaluation_id uuid;
begin
  if v_student_id is null then
    raise exception 'session_expired' using errcode = 'P0001';
  end if;

  select p.institution_id into v_institution_id
  from public.profiles p
  where p.id = v_student_id
    and p.status = 'active'::public.user_status
    and exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.profile_id = p.id
        and ur.institution_id = p.institution_id
        and r.code = 'student'
    );
  if v_institution_id is null then
    raise exception 'evaluation_unavailable' using errcode = 'P0001';
  end if;

  select ta.academic_period_id, ap.starts_at, ap.ends_at
    into v_period_id, period_starts_at, period_ends_at
  from public.teaching_assignments ta
  join public.groups g
    on g.id = ta.group_id
   and g.institution_id = ta.institution_id
   and g.academic_period_id = ta.academic_period_id
  join public.subjects s
    on s.id = g.subject_id and s.institution_id = g.institution_id
  join public.academic_periods ap
    on ap.id = g.academic_period_id and ap.institution_id = g.institution_id
  join public.student_enrollments enrollment
    on enrollment.student_id = v_student_id
   and enrollment.group_id = g.id
   and enrollment.institution_id = g.institution_id
   and enrollment.academic_period_id = g.academic_period_id
  join public.profiles teacher
    on teacher.id = ta.teacher_id and teacher.institution_id = ta.institution_id
  where ta.id = p_assignment_id
    and ta.institution_id = v_institution_id
    and g.active and s.active and ap.active
    and teacher.status = 'active'::public.user_status
    and exists (
      select 1 from public.user_roles tr
      join public.roles r on r.id = tr.role_id
      where tr.profile_id = teacher.id
        and tr.institution_id = v_institution_id
        and r.code = 'teacher'
    );
  if v_period_id is null then
    raise exception 'evaluation_unavailable' using errcode = 'P0001';
  end if;

  select w.survey_template_id, w.starts_at, w.ends_at
    into v_template_id, opened_at, closed_at
  from public.evaluation_windows w
  join public.survey_templates t
    on t.id = w.survey_template_id
   and (t.institution_id is null or t.institution_id = w.institution_id)
  where w.id = p_window_id
    and w.institution_id = v_institution_id
    and w.academic_period_id = v_period_id
    and w.active and t.active
  for share of w, t;
  if v_template_id is null then
    raise exception 'evaluation_unavailable' using errcode = 'P0001';
  end if;

  submitted_time := pg_catalog.clock_timestamp();
  if submitted_time < opened_at or submitted_time > closed_at
    or submitted_time < period_starts_at or submitted_time > period_ends_at then
    raise exception 'window_closed' using errcode = 'P0001';
  end if;

  select count(*),
    count(*) filter (
      where q.question_type = 'scale'::public.question_type and q.required
    )
    into question_count, valid_question_count
  from public.survey_questions q
  where q.survey_template_id = v_template_id and q.active;
  if question_count <> 15 or valid_question_count <> 15 then
    raise exception 'questionnaire_unavailable' using errcode = 'P0001';
  end if;

  if p_answers is null or pg_catalog.jsonb_typeof(p_answers) <> 'array'
    or pg_catalog.jsonb_array_length(p_answers) <> 15 then
    raise exception 'invalid_answers' using errcode = 'P0001';
  end if;

  begin
    select count(*), count(distinct supplied.question_id),
      count(*) filter (
        where q.id is not null
          and supplied.value in (0, 2.5, 5, 7.5, 10)
      )
      into answer_count, distinct_count, valid_count
    from pg_catalog.jsonb_to_recordset(p_answers)
      as supplied(question_id uuid, value numeric)
    left join public.survey_questions q
      on q.id = supplied.question_id
     and q.survey_template_id = v_template_id
     and q.active
     and q.question_type = 'scale'::public.question_type
     and q.required;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'invalid_answers' using errcode = 'P0001';
  end;
  if answer_count <> 15 or distinct_count <> 15 or valid_count <> 15 then
    raise exception 'invalid_answers' using errcode = 'P0001';
  end if;

  begin
    insert into public.evaluations (
      institution_id, academic_period_id, evaluation_window_id,
      teaching_assignment_id, student_id, status, started_at, submitted_at
    ) values (
      v_institution_id, v_period_id, p_window_id, p_assignment_id, v_student_id,
      'completed'::public.evaluation_status, submitted_time, submitted_time
    )
    returning id into new_evaluation_id;
  exception when unique_violation then
    raise exception 'already_submitted' using errcode = 'P0001';
  end;

  insert into public.evaluation_answers (
    evaluation_id, question_id, numeric_value
  )
  select new_evaluation_id, supplied.question_id, supplied.value
  from pg_catalog.jsonb_to_recordset(p_answers)
    as supplied(question_id uuid, value numeric);

  return new_evaluation_id;
end;
$$;

create function public.submit_evaluation(
  p_assignment_id uuid, p_window_id uuid, p_answers jsonb
)
returns uuid
language sql volatile security invoker
set search_path = ''
as $$
  select app_private.submit_evaluation(
    p_assignment_id, p_window_id, p_answers
  )
$$;

revoke all on function app_private.enforce_window_template_scope()
  from public, anon, authenticated;
revoke all on function app_private.protect_used_template()
  from public, anon, authenticated;
revoke all on function app_private.protect_used_questions()
  from public, anon, authenticated;
revoke all on function app_private.prevent_duplicate_obligation()
  from public, anon, authenticated;
revoke all on function app_private.my_student_evaluations()
  from public, anon, authenticated;
revoke all on function app_private.submit_evaluation(uuid, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.my_student_evaluations()
  from public, anon, authenticated;
revoke all on function public.submit_evaluation(uuid, uuid, jsonb)
  from public, anon, authenticated;

grant execute on function app_private.my_student_evaluations()
  to authenticated;
grant execute on function app_private.submit_evaluation(uuid, uuid, jsonb)
  to authenticated;
grant execute on function public.my_student_evaluations()
  to authenticated;
grant execute on function public.submit_evaluation(uuid, uuid, jsonb)
  to authenticated;

-- No client table grants or policies for evaluations or evaluation_answers.
-- Teachers and institutional staff still have zero direct response access.
