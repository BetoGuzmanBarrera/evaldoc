-- Block 10. Institutional analytics expose only aggregates from publishable
-- assignments. Authorization runs before each query, including empty results.

create function public.institution_analytics_overview(
  p_period_id uuid default null, p_campus_id uuid default null,
  p_program_id uuid default null, p_group_id uuid default null
)
returns table (
  average_score numeric, response_count bigint, teacher_count bigint,
  expected bigint, completed bigint, pending bigint, participation numeric
)
language plpgsql stable security definer
set search_path = ''
as $$
declare v_institution_id uuid;
begin
  v_institution_id := app_private.institutional_identity(
    array['coordinator','hr','admin']::text[]);
  return query
  with scores as (
    select pg_catalog.round(pg_catalog.sum(r.average_score * r.response_count)
      / nullif(pg_catalog.sum(r.response_count),0),2) as value,
      coalesce(pg_catalog.sum(r.response_count),0)::bigint as responses,
      pg_catalog.count(distinct r.teacher_id)::bigint as teachers
    from app_private.institutional_assignment_results() r
    where r.published
      and (p_period_id is null or r.period_id = p_period_id)
      and (p_campus_id is null or r.campus_id = p_campus_id)
      and (p_program_id is null or r.program_id = p_program_id)
      and (p_group_id is null or r.group_id = p_group_id)
  )
  select s.value, s.responses, s.teachers,
    p.expected, p.completed, p.pending, p.participation
  from scores s
  cross join public.institution_participation(
    p_period_id,p_campus_id,p_program_id,p_group_id) p
  where p.scope = 'total' and v_institution_id is not null;
end;
$$;

create function public.institution_analytics_trend(
  p_campus_id uuid default null, p_program_id uuid default null,
  p_group_id uuid default null
)
returns table (
  period_id uuid, period_name text, starts_at timestamptz,
  average_score numeric, response_count bigint, teacher_count bigint,
  expected bigint, completed bigint, pending bigint, participation numeric
)
language plpgsql stable security definer
set search_path = ''
as $$
declare v_institution_id uuid;
begin
  v_institution_id := app_private.institutional_identity(
    array['coordinator','hr','admin']::text[]);
  return query
  with scores as (
    select r.period_id,
      pg_catalog.round(pg_catalog.sum(r.average_score * r.response_count)
        / nullif(pg_catalog.sum(r.response_count),0),2) as value,
      pg_catalog.sum(r.response_count)::bigint as responses,
      pg_catalog.count(distinct r.teacher_id)::bigint as teachers
    from app_private.institutional_assignment_results() r
    where r.published
      and (p_campus_id is null or r.campus_id = p_campus_id)
      and (p_program_id is null or r.program_id = p_program_id)
      and (p_group_id is null or r.group_id = p_group_id)
    group by r.period_id
  ), participation_by_period as (
    select p.scope_id, p.expected, p.completed, p.pending, p.participation
    from public.institution_participation(
      null,p_campus_id,p_program_id,p_group_id) p
    where p.scope = 'period'
  )
  select ap.id, ap.name, ap.starts_at,
    s.value, coalesce(s.responses,0)::bigint,
    coalesce(s.teachers,0)::bigint,
    coalesce(p.expected,0)::bigint, coalesce(p.completed,0)::bigint,
    coalesce(p.pending,0)::bigint, coalesce(p.participation,0)::numeric
  from public.academic_periods ap
  left join scores s on s.period_id = ap.id
  left join participation_by_period p on p.scope_id = ap.id
  where ap.institution_id = v_institution_id
  order by ap.starts_at, ap.id;
end;
$$;

create function public.institution_analytics_comparison(
  p_period_id uuid default null, p_campus_id uuid default null,
  p_program_id uuid default null, p_group_id uuid default null
)
returns table (
  current_period_id uuid, current_period_name text,
  previous_period_id uuid, previous_period_name text,
  current_score numeric, previous_score numeric,
  absolute_change numeric, percentage_change numeric,
  current_participation numeric, previous_participation numeric
)
language plpgsql stable security definer
set search_path = ''
as $$
declare v_institution_id uuid;
begin
  v_institution_id := app_private.institutional_identity(
    array['coordinator','hr','admin']::text[]);
  return query
  with periods as (
    select t.* from public.institution_analytics_trend(
      p_campus_id,p_program_id,p_group_id) t
  ), selected as (
    select t.* from periods t
    where p_period_id is null or t.period_id = p_period_id
    order by t.starts_at desc, t.period_id desc limit 1
  ), previous as (
    select t.* from periods t cross join selected c
    where (t.starts_at,t.period_id) < (c.starts_at,c.period_id)
    order by t.starts_at desc, t.period_id desc limit 1
  )
  select c.period_id, c.period_name, p.period_id, p.period_name,
    c.average_score, p.average_score,
    case when c.average_score is not null and p.average_score is not null
      then pg_catalog.round(c.average_score-p.average_score,2) end,
    case when c.average_score is not null and p.average_score > 0
      then pg_catalog.round(100*(c.average_score-p.average_score)/p.average_score,2) end,
    c.participation, p.participation
  from selected c left join previous p on true
  where v_institution_id is not null;
end;
$$;

-- Each output score comes from complete 15-answer evaluations belonging to
-- an assignment that has independently reached the five-response threshold.
create function public.institution_question_analytics(
  p_period_id uuid default null, p_campus_id uuid default null,
  p_program_id uuid default null, p_group_id uuid default null
)
returns table (
  question_order integer, question_text text,
  average_score numeric, response_count bigint
)
language plpgsql stable security definer
set search_path = ''
as $$
declare v_institution_id uuid;
begin
  v_institution_id := app_private.institutional_identity(
    array['coordinator','hr']::text[]);
  return query
  with published as (
    select r.assignment_id from app_private.institutional_assignment_results() r
    where r.published
      and (p_period_id is null or r.period_id = p_period_id)
      and (p_campus_id is null or r.campus_id = p_campus_id)
      and (p_program_id is null or r.program_id = p_program_id)
      and (p_group_id is null or r.group_id = p_group_id)
  ), complete_evaluations as (
    select e.id, w.survey_template_id
    from published r
    join public.evaluations e on e.teaching_assignment_id = r.assignment_id
      and e.institution_id = v_institution_id
      and e.status = 'completed'::public.evaluation_status
    join public.evaluation_windows w on w.id = e.evaluation_window_id
      and w.institution_id = e.institution_id
      and w.academic_period_id = e.academic_period_id
    join public.evaluation_answers a on a.evaluation_id = e.id
    join public.survey_questions q on q.id = a.question_id
      and q.survey_template_id = w.survey_template_id
      and q.active and q.required
      and q.question_type = 'scale'::public.question_type
    where a.numeric_value is not null
    group by e.id, w.survey_template_id
    having pg_catalog.count(*) = 15
      and pg_catalog.count(distinct q.position) = 15
  )
  select q.position, q.prompt,
    pg_catalog.round(pg_catalog.avg(a.numeric_value),2),
    pg_catalog.count(distinct e.id)::bigint
  from complete_evaluations e
  join public.evaluation_answers a on a.evaluation_id = e.id
  join public.survey_questions q on q.id = a.question_id
    and q.survey_template_id = e.survey_template_id
    and q.active and q.required
    and q.question_type = 'scale'::public.question_type
  where a.numeric_value is not null
  group by q.position, q.prompt
  having pg_catalog.count(distinct e.id) >= 5
  order by q.position, q.prompt;
end;
$$;

create function public.institution_analytics_breakdown(
  p_period_id uuid default null, p_campus_id uuid default null,
  p_program_id uuid default null, p_group_id uuid default null
)
returns table (
  scope text, scope_id uuid, label text, average_score numeric,
  response_count bigint, teacher_count bigint, assignment_count bigint
)
language plpgsql stable security definer
set search_path = ''
as $$
declare v_institution_id uuid;
begin
  v_institution_id := app_private.institutional_identity(
    array['coordinator','hr']::text[]);
  return query
  with published as (
    select r.* from app_private.institutional_assignment_results() r
    where r.published
      and (p_period_id is null or r.period_id = p_period_id)
      and (p_campus_id is null or r.campus_id = p_campus_id)
      and (p_program_id is null or r.program_id = p_program_id)
      and (p_group_id is null or r.group_id = p_group_id)
  ), scoped as (
    select 'campus'::text as kind, r.campus_id as id,
      coalesce(c.name,'Sin campus') as name,
      r.teacher_id, r.assignment_id, r.average_score, r.response_count
    from published r left join public.campuses c on c.id = r.campus_id
      and c.institution_id = v_institution_id
    union all
    select 'program', r.program_id, coalesce(p.name,'Sin programa'),
      r.teacher_id, r.assignment_id, r.average_score, r.response_count
    from published r left join public.programs p on p.id = r.program_id
      and p.institution_id = v_institution_id
    union all
    select 'group', r.group_id, g.code,
      r.teacher_id, r.assignment_id, r.average_score, r.response_count
    from published r join public.groups g on g.id = r.group_id
      and g.institution_id = v_institution_id
  )
  select s.kind, s.id, s.name,
    pg_catalog.round(pg_catalog.sum(s.average_score*s.response_count)
      / nullif(pg_catalog.sum(s.response_count),0),2),
    pg_catalog.sum(s.response_count)::bigint,
    pg_catalog.count(distinct s.teacher_id)::bigint,
    pg_catalog.count(distinct s.assignment_id)::bigint
  from scoped s
  group by s.kind,s.id,s.name
  order by s.kind,s.name;
end;
$$;

create function public.institution_teacher_trends(
  p_teacher_id uuid default null, p_campus_id uuid default null,
  p_program_id uuid default null, p_group_id uuid default null
)
returns table (
  teacher_id uuid, teacher_name text, period_id uuid, period_name text,
  starts_at timestamptz, average_score numeric,
  response_count bigint, assignment_count bigint
)
language plpgsql stable security definer
set search_path = ''
as $$
declare v_institution_id uuid;
begin
  v_institution_id := app_private.institutional_identity(
    array['coordinator','hr']::text[]);
  return query
  select teacher.id, teacher.full_name, ap.id, ap.name, ap.starts_at,
    pg_catalog.round(pg_catalog.sum(r.average_score*r.response_count)
      / nullif(pg_catalog.sum(r.response_count),0),2),
    pg_catalog.sum(r.response_count)::bigint,
    pg_catalog.count(distinct r.assignment_id)::bigint
  from app_private.institutional_assignment_results() r
  join public.profiles teacher on teacher.id = r.teacher_id
    and teacher.institution_id = v_institution_id
  join public.academic_periods ap on ap.id = r.period_id
    and ap.institution_id = v_institution_id
  where r.published
    and (p_teacher_id is null or r.teacher_id = p_teacher_id)
    and (p_campus_id is null or r.campus_id = p_campus_id)
    and (p_program_id is null or r.program_id = p_program_id)
    and (p_group_id is null or r.group_id = p_group_id)
  group by teacher.id,teacher.full_name,ap.id,ap.name,ap.starts_at
  order by teacher.full_name,ap.starts_at,ap.id;
end;
$$;

revoke all on function public.institution_analytics_overview(uuid,uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.institution_analytics_trend(uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.institution_analytics_comparison(uuid,uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.institution_question_analytics(uuid,uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.institution_analytics_breakdown(uuid,uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.institution_teacher_trends(uuid,uuid,uuid,uuid) from public, anon, authenticated;

grant execute on function public.institution_analytics_overview(uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.institution_analytics_trend(uuid,uuid,uuid) to authenticated;
grant execute on function public.institution_analytics_comparison(uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.institution_question_analytics(uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.institution_analytics_breakdown(uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.institution_teacher_trends(uuid,uuid,uuid,uuid) to authenticated;

-- Existing FK, unique and filter indexes cover the join paths used above.
-- No table grants, policies or indexes are added.
