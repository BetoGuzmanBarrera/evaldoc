-- Block 8. Only complete, validated response sets contribute to aggregates.
-- Five responses from one assignment are required before any score is released.
-- Counts may include unpublished assignments; scores and charts never do.

create function app_private.current_teacher_identity()
returns table (teacher_id uuid, institution_id uuid)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'session_expired' using errcode = 'P0001';
  end if;

  return query
    select p.id, p.institution_id
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'::public.user_status
      and exists (
        select 1 from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.profile_id = p.id
          and ur.institution_id = p.institution_id
          and r.code = 'teacher'
      );
  if not found then
    raise exception 'teacher_access_denied' using errcode = 'P0001';
  end if;
end;
$$;

-- The private result set is already privacy-filtered. Even direct execution
-- cannot retrieve an individual evaluation or a score under the threshold.
create function app_private.teacher_assignment_results(p_assignment_id uuid)
returns table (
  assignment_id uuid,
  period_id uuid,
  period_name text,
  period_starts_at timestamptz,
  subject_name text,
  group_code text,
  response_count bigint,
  average_score numeric,
  favorable_percent numeric,
  question_scores jsonb,
  published boolean
)
language sql stable security definer
set search_path = ''
as $$
  with own_assignments as (
    select ta.id as assignment_id,
      ap.id as period_id, ap.name as period_name,
      ap.starts_at as period_starts_at,
      s.name as subject_name, g.code as group_code
    from app_private.current_teacher_identity() me
    join public.teaching_assignments ta
      on ta.teacher_id = me.teacher_id
     and ta.institution_id = me.institution_id
    join public.groups g
      on g.id = ta.group_id
     and g.institution_id = ta.institution_id
     and g.academic_period_id = ta.academic_period_id
    join public.subjects s
      on s.id = g.subject_id and s.institution_id = g.institution_id
    join public.academic_periods ap
      on ap.id = ta.academic_period_id and ap.institution_id = ta.institution_id
    where p_assignment_id is null or ta.id = p_assignment_id
  ),
  complete_responses as (
    select e.id as evaluation_id,
      e.teaching_assignment_id as assignment_id,
      w.survey_template_id as template_id,
      pg_catalog.avg(a.numeric_value) as evaluation_average,
      pg_catalog.avg(case when a.numeric_value >= 7.5 then 1::numeric else 0::numeric end) as favorable_share
    from own_assignments own
    join public.evaluations e
      on e.teaching_assignment_id = own.assignment_id
     and e.academic_period_id = own.period_id
     and e.status = 'completed'::public.evaluation_status
    join public.evaluation_windows w
      on w.id = e.evaluation_window_id
     and w.institution_id = e.institution_id
     and w.academic_period_id = e.academic_period_id
    join public.evaluation_answers a on a.evaluation_id = e.id
    join public.survey_questions q
      on q.id = a.question_id
     and q.survey_template_id = w.survey_template_id
     and q.active and q.required
     and q.question_type = 'scale'::public.question_type
    where a.numeric_value is not null
    group by e.id, e.teaching_assignment_id, w.survey_template_id
    having pg_catalog.count(*) = 15
      and (select pg_catalog.count(*) from public.survey_questions expected
           where expected.survey_template_id = w.survey_template_id
             and expected.active) = 15
      and not exists (
        select 1 from public.survey_questions invalid
        where invalid.survey_template_id = w.survey_template_id
          and invalid.active
          and (not invalid.required or invalid.question_type <> 'scale'::public.question_type)
      )
  ),
  totals as (
    select own.assignment_id, own.period_id, own.period_name,
      own.period_starts_at, own.subject_name, own.group_code,
      pg_catalog.count(response.evaluation_id)::bigint as response_count,
      pg_catalog.round(pg_catalog.avg(response.evaluation_average), 2) as average_score,
      pg_catalog.round(pg_catalog.avg(response.favorable_share) * 100, 2) as favorable_percent,
      pg_catalog.count(distinct response.template_id) as template_count
    from own_assignments own
    left join complete_responses response on response.assignment_id = own.assignment_id
    group by own.assignment_id, own.period_id, own.period_name,
      own.period_starts_at, own.subject_name, own.group_code
  ),
  question_means as (
    select response.assignment_id, q.id as question_id,
      q.position, q.prompt,
      pg_catalog.round(pg_catalog.avg(a.numeric_value), 2) as score
    from complete_responses response
    join public.evaluation_answers a on a.evaluation_id = response.evaluation_id
    join public.survey_questions q
      on q.id = a.question_id
     and q.survey_template_id = response.template_id
     and q.active and q.required
     and q.question_type = 'scale'::public.question_type
    group by response.assignment_id, q.id, q.position, q.prompt
  ),
  question_lists as (
    select q.assignment_id,
      pg_catalog.count(*) as question_count,
      pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'id', q.question_id, 'position', q.position,
        'label', q.prompt, 'score', q.score
      ) order by q.position) as scores
    from question_means q
    group by q.assignment_id
  )
  select totals.assignment_id, totals.period_id, totals.period_name,
    totals.period_starts_at, totals.subject_name, totals.group_code,
    totals.response_count,
    case when totals.response_count >= 5 then totals.average_score end,
    case when totals.response_count >= 5 then totals.favorable_percent end,
    case when totals.response_count >= 5
      and totals.template_count = 1
      and questions.question_count = 15
      then questions.scores else '[]'::jsonb end,
    totals.response_count >= 5
  from totals
  left join question_lists questions on questions.assignment_id = totals.assignment_id
  order by totals.period_starts_at desc, totals.subject_name, totals.group_code
$$;

create function public.teacher_assignment_results(p_assignment_id uuid)
returns table (
  assignment_id uuid, period_id uuid, period_name text,
  period_starts_at timestamptz, subject_name text, group_code text,
  response_count bigint, average_score numeric, favorable_percent numeric,
  question_scores jsonb, published boolean
)
language sql stable security invoker
set search_path = ''
as $$
  select result.assignment_id, result.period_id, result.period_name,
    result.period_starts_at, result.subject_name, result.group_code,
    result.response_count, result.average_score, result.favorable_percent,
    result.question_scores, result.published
  from app_private.teacher_assignment_results(p_assignment_id) result
$$;

-- Period scores use only published assignment aggregates, so subtracting a
-- visible assignment score cannot recover an unpublished small group's score.
create function app_private.teacher_results_history()
returns table (
  period_id uuid, period_name text, period_starts_at timestamptz,
  response_count bigint, published_responses bigint,
  assignment_count bigint, average_score numeric, favorable_percent numeric
)
language sql stable security invoker
set search_path = ''
as $$
  with own as (
    select * from app_private.teacher_assignment_results(null::uuid)
  )
  select own.period_id, own.period_name,
    pg_catalog.max(own.period_starts_at),
    pg_catalog.sum(own.response_count)::bigint,
    coalesce(pg_catalog.sum(own.response_count) filter (where own.published), 0)::bigint,
    pg_catalog.count(*)::bigint,
    pg_catalog.round(
      pg_catalog.sum(own.average_score * own.response_count) filter (where own.published)
      / nullif(pg_catalog.sum(own.response_count) filter (where own.published), 0), 2
    ),
    pg_catalog.round(
      pg_catalog.sum(own.favorable_percent * own.response_count) filter (where own.published)
      / nullif(pg_catalog.sum(own.response_count) filter (where own.published), 0), 2
    )
  from own
  group by own.period_id, own.period_name
  order by pg_catalog.max(own.period_starts_at) desc, own.period_id
$$;

create function public.teacher_results_history()
returns table (
  period_id uuid, period_name text, period_starts_at timestamptz,
  response_count bigint, published_responses bigint,
  assignment_count bigint, average_score numeric, favorable_percent numeric
)
language sql stable security invoker
set search_path = ''
as $$
  select history.period_id, history.period_name, history.period_starts_at,
    history.response_count, history.published_responses,
    history.assignment_count, history.average_score, history.favorable_percent
  from app_private.teacher_results_history() history
$$;

create function app_private.teacher_period_breakdown(p_period_id uuid)
returns table (question_position integer, label text, score numeric, response_count bigint)
language sql stable security invoker
set search_path = ''
as $$
  with released as (
    select result.response_count, result.question_scores
    from app_private.teacher_assignment_results(null::uuid) result
    where result.period_id = p_period_id
      and result.published
      and pg_catalog.jsonb_array_length(result.question_scores) = 15
  ),
  question_values as (
    select (question.item ->> 'position')::integer as question_position,
      question.item ->> 'label' as label,
      (question.item ->> 'score')::numeric as score,
      released.response_count
    from released
    cross join lateral pg_catalog.jsonb_array_elements(released.question_scores) question(item)
  )
  select question_values.question_position, question_values.label,
    pg_catalog.round(pg_catalog.sum(question_values.score * question_values.response_count)
      / pg_catalog.sum(question_values.response_count), 2),
    pg_catalog.sum(question_values.response_count)::bigint
  from question_values
  group by question_values.question_position, question_values.label
  order by question_values.question_position, question_values.label
$$;

create function public.teacher_period_breakdown(p_period_id uuid)
returns table (question_position integer, label text, score numeric, response_count bigint)
language sql stable security invoker
set search_path = ''
as $$
  select breakdown.question_position, breakdown.label, breakdown.score,
    breakdown.response_count
  from app_private.teacher_period_breakdown(p_period_id) breakdown
$$;

revoke all on function app_private.current_teacher_identity() from public, anon, authenticated;
revoke all on function app_private.teacher_assignment_results(uuid) from public, anon, authenticated;
revoke all on function app_private.teacher_results_history() from public, anon, authenticated;
revoke all on function app_private.teacher_period_breakdown(uuid) from public, anon, authenticated;
revoke all on function public.teacher_assignment_results(uuid) from public, anon, authenticated;
revoke all on function public.teacher_results_history() from public, anon, authenticated;
revoke all on function public.teacher_period_breakdown(uuid) from public, anon, authenticated;

grant execute on function app_private.teacher_assignment_results(uuid) to authenticated;
grant execute on function app_private.teacher_results_history() to authenticated;
grant execute on function app_private.teacher_period_breakdown(uuid) to authenticated;
grant execute on function public.teacher_assignment_results(uuid) to authenticated;
grant execute on function public.teacher_results_history() to authenticated;
grant execute on function public.teacher_period_breakdown(uuid) to authenticated;

-- No SELECT grant or policy is added for evaluations, answers or enrollments.
