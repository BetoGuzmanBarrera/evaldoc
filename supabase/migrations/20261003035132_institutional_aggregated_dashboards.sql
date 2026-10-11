-- Block 9. Every public RPC derives its institution from the active Auth profile.
-- No institutional caller receives student-level evaluations or answers.

create function app_private.institutional_identity(p_roles text[])
returns uuid
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_institution_id uuid;
begin
  if auth.uid() is null then
    raise exception 'session_expired' using errcode = 'P0001';
  end if;
  select p.institution_id into v_institution_id
  from public.profiles p
  where p.id = auth.uid()
    and p.status = 'active'::public.user_status
    and exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.profile_id = p.id and ur.institution_id = p.institution_id
        and r.code = any(p_roles)
    );
  if v_institution_id is null then
    raise exception 'institutional_access_denied' using errcode = 'P0001';
  end if;
  return v_institution_id;
end;
$$;

-- Private intermediate; the only score released by callers is from an
-- assignment with at least five complete, 15-question evaluations.
create function app_private.institutional_assignment_results()
returns table (
  assignment_id uuid, teacher_id uuid, period_id uuid, campus_id uuid,
  program_id uuid, group_id uuid, response_count bigint, average_score numeric,
  published boolean
)
language sql stable security definer
set search_path = ''
as $$
  with own_assignments as (
    select ta.id, ta.teacher_id, ta.academic_period_id, g.id as group_id,
      p.campus_id, s.program_id
    from public.teaching_assignments ta
    join public.groups g on g.id = ta.group_id
      and g.institution_id = ta.institution_id
      and g.academic_period_id = ta.academic_period_id
    join public.subjects s on s.id = g.subject_id
      and s.institution_id = ta.institution_id
    left join public.programs p on p.id = s.program_id
      and p.institution_id = ta.institution_id
    where ta.institution_id = app_private.institutional_identity(
      array['coordinator','hr','admin']::text[])
  ),
  complete_responses as (
    select e.id, e.teaching_assignment_id,
      pg_catalog.avg(a.numeric_value) as evaluation_average
    from own_assignments own
    join public.evaluations e on e.teaching_assignment_id = own.id
      and e.academic_period_id = own.academic_period_id
      and e.status = 'completed'::public.evaluation_status
    join public.evaluation_windows w on w.id = e.evaluation_window_id
      and w.institution_id = e.institution_id
      and w.academic_period_id = e.academic_period_id
    join public.evaluation_answers a on a.evaluation_id = e.id
    join public.survey_questions q on q.id = a.question_id
      and q.survey_template_id = w.survey_template_id
      and q.active and q.required and q.question_type = 'scale'::public.question_type
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
          and (not invalid.required
            or invalid.question_type <> 'scale'::public.question_type)
      )
  )
  select own.id, own.teacher_id, own.academic_period_id, own.campus_id,
    own.program_id, own.group_id,
    pg_catalog.count(response.id)::bigint,
    case when pg_catalog.count(response.id) >= 5
      then pg_catalog.round(pg_catalog.avg(response.evaluation_average), 2) end,
    pg_catalog.count(response.id) >= 5
  from own_assignments own
  left join complete_responses response on response.teaching_assignment_id = own.id
  group by own.id, own.teacher_id, own.academic_period_id, own.campus_id,
    own.program_id, own.group_id
$$;

create function public.institutional_filter_options()
returns table (scope text, id uuid, label text, parent_id uuid, period_id uuid)
language sql stable security definer
set search_path = ''
as $$
  with own as (select app_private.institutional_identity(
    array['coordinator','hr','admin']::text[]) as institution_id)
  select 'campus'::text, c.id, c.name, null::uuid, null::uuid
  from own join public.campuses c on c.institution_id = own.institution_id
  union all
  select 'program'::text, p.id, p.name, p.campus_id, null::uuid
  from own join public.programs p on p.institution_id = own.institution_id
  union all
  select 'group'::text, g.id, g.code || ' · ' || s.name || ' · ' || ap.name,
    s.program_id, g.academic_period_id
  from own join public.groups g on g.institution_id = own.institution_id
  join public.subjects s on s.id = g.subject_id and s.institution_id = g.institution_id
  join public.academic_periods ap on ap.id = g.academic_period_id
    and ap.institution_id = g.institution_id
  union all
  select 'period'::text, ap.id, ap.name, null::uuid, null::uuid
  from own join public.academic_periods ap on ap.institution_id = own.institution_id
$$;

-- Each expected obligation is one student/teacher/subject/period, matching RF03.
-- A canonical group prevents a duplicate enrollment from inflating totals.
create function public.institution_participation(
  p_period_id uuid default null, p_campus_id uuid default null,
  p_program_id uuid default null, p_group_id uuid default null
)
returns table (
  scope text, scope_id uuid, label text, expected bigint, completed bigint,
  pending bigint, participation numeric, students bigint
)
language sql stable security definer
set search_path = ''
as $$
  with own as (select app_private.institutional_identity(
    array['coordinator','hr','admin']::text[]) as institution_id),
  candidates as (
    select distinct on (se.student_id, ta.teacher_id, g.subject_id, g.academic_period_id)
      se.student_id, ta.teacher_id, g.subject_id,
      g.academic_period_id as period_id, ap.name as period_name,
      g.id as group_id, g.code as group_name,
      p.id as program_id, p.name as program_name,
      c.id as campus_id, c.name as campus_name
    from own
    join public.student_enrollments se on se.institution_id = own.institution_id
    join public.groups g on g.id = se.group_id
      and g.institution_id = se.institution_id
      and g.academic_period_id = se.academic_period_id
    join public.teaching_assignments ta on ta.group_id = g.id
      and ta.institution_id = g.institution_id
      and ta.academic_period_id = g.academic_period_id
    join public.academic_periods ap on ap.id = g.academic_period_id
      and ap.institution_id = g.institution_id
    join public.subjects s on s.id = g.subject_id and s.institution_id = g.institution_id
    left join public.programs p on p.id = s.program_id and p.institution_id = g.institution_id
    left join public.campuses c on c.id = p.campus_id and c.institution_id = g.institution_id
    where exists (select 1 from public.evaluation_windows w
      where w.institution_id = own.institution_id
        and w.academic_period_id = g.academic_period_id)
    order by se.student_id, ta.teacher_id, g.subject_id, g.academic_period_id, g.id
  ),
  obligations as (
    select candidate.*,
      exists (
        select 1 from public.evaluations e
        join public.teaching_assignments completed_ta on completed_ta.id = e.teaching_assignment_id
          and completed_ta.institution_id = e.institution_id
        join public.groups completed_group on completed_group.id = completed_ta.group_id
          and completed_group.institution_id = e.institution_id
        where e.student_id = candidate.student_id
          and e.academic_period_id = candidate.period_id
          and completed_ta.teacher_id = candidate.teacher_id
          and completed_group.subject_id = candidate.subject_id
          and e.status = 'completed'::public.evaluation_status
      ) as done
    from candidates candidate
    where (p_period_id is null or candidate.period_id = p_period_id)
      and (p_campus_id is null or candidate.campus_id = p_campus_id)
      and (p_program_id is null or candidate.program_id = p_program_id)
      and (p_group_id is null or candidate.group_id = p_group_id)
  ),
  scoped as (
    select 'total'::text as scope, null::uuid as scope_id, 'Total'::text as label,
      student_id, done from obligations
    union all select 'campus', campus_id, coalesce(campus_name,'Sin campus'), student_id, done from obligations
    union all select 'program', program_id, coalesce(program_name,'Sin programa'), student_id, done from obligations
    union all select 'group', group_id, group_name, student_id, done from obligations
    union all select 'period', period_id, period_name, student_id, done from obligations
  )
  select scoped.scope, scoped.scope_id, scoped.label,
    pg_catalog.count(*)::bigint,
    pg_catalog.count(*) filter (where scoped.done)::bigint,
    pg_catalog.count(*) filter (where not scoped.done)::bigint,
    pg_catalog.round(100::numeric * pg_catalog.count(*) filter (where scoped.done)
      / nullif(pg_catalog.count(*),0), 2),
    pg_catalog.count(distinct scoped.student_id)::bigint
  from scoped
  group by scoped.scope, scoped.scope_id, scoped.label
  union all
  select 'total', null::uuid, 'Total', 0::bigint, 0::bigint, 0::bigint,
    0::numeric, 0::bigint
  where not exists (select 1 from obligations)
$$;

-- Ranking is intentionally unavailable to an admin without a separate
-- coordinator or HR role. Only published assignment scores contribute.
create function public.institution_teacher_ranking(
  p_period_id uuid default null, p_campus_id uuid default null,
  p_program_id uuid default null, p_group_id uuid default null
)
returns table (
  teacher_id uuid, teacher_name text, average_score numeric,
  response_count bigint, assignment_count bigint
)
language sql stable security definer
set search_path = ''
as $$
  with own as (select app_private.institutional_identity(
    array['coordinator','hr']::text[]) as institution_id),
  published as (
    select result.* from app_private.institutional_assignment_results() result
    where result.published
      and (p_period_id is null or result.period_id = p_period_id)
      and (p_campus_id is null or result.campus_id = p_campus_id)
      and (p_program_id is null or result.program_id = p_program_id)
      and (p_group_id is null or result.group_id = p_group_id)
  )
  select teacher.id, teacher.full_name,
    pg_catalog.round(pg_catalog.sum(published.average_score * published.response_count)
      / pg_catalog.sum(published.response_count), 2),
    pg_catalog.sum(published.response_count)::bigint,
    pg_catalog.count(*)::bigint
  from own
  join public.profiles teacher on teacher.institution_id = own.institution_id
  join published on published.teacher_id = teacher.id
  group by teacher.id, teacher.full_name
  order by 3 desc, 4 desc, teacher.full_name
$$;

create function public.institution_score_summary(
  p_period_id uuid default null, p_campus_id uuid default null,
  p_program_id uuid default null, p_group_id uuid default null
)
returns table (average_score numeric, response_count bigint, teacher_count bigint)
language sql stable security definer
set search_path = ''
as $$
  with own as (select app_private.institutional_identity(
    array['coordinator','hr']::text[]) as institution_id),
  published as (
    select result.* from app_private.institutional_assignment_results() result
    where result.published
      and (p_period_id is null or result.period_id = p_period_id)
      and (p_campus_id is null or result.campus_id = p_campus_id)
      and (p_program_id is null or result.program_id = p_program_id)
      and (p_group_id is null or result.group_id = p_group_id)
  )
  select pg_catalog.round(pg_catalog.sum(published.average_score * published.response_count)
      / nullif(pg_catalog.sum(published.response_count),0), 2),
    coalesce(pg_catalog.sum(published.response_count),0)::bigint,
    pg_catalog.count(distinct published.teacher_id)::bigint
  from own left join published on true
  where own.institution_id is not null
$$;

create function public.hr_teacher_metrics(
  p_period_id uuid default null, p_campus_id uuid default null
)
returns table (
  teacher_id uuid, teacher_name text, average_score numeric,
  response_count bigint, subject_count bigint, category text,
  recommendation text, maximum_subjects integer
)
language sql stable security definer
set search_path = ''
as $$
  with own as (select app_private.institutional_identity(array['hr']::text[]) as institution_id),
  published as (
    select result.* from app_private.institutional_assignment_results() result
    where result.published
      and (p_period_id is null or result.period_id = p_period_id)
      and (p_campus_id is null or result.campus_id = p_campus_id)
  ),
  teacher_scores as (
    select teacher.id, teacher.full_name,
      pg_catalog.round(pg_catalog.sum(published.average_score * published.response_count)
        / pg_catalog.sum(published.response_count), 1) as score,
      pg_catalog.sum(published.response_count)::bigint as responses,
      pg_catalog.count(distinct g.subject_id)::bigint as subjects
    from own
    join public.profiles teacher on teacher.institution_id = own.institution_id
    join published on published.teacher_id = teacher.id
    join public.teaching_assignments ta on ta.id = published.assignment_id
      and ta.institution_id = own.institution_id
    join public.groups g on g.id = ta.group_id and g.institution_id = own.institution_id
    group by teacher.id, teacher.full_name
  )
  select scores.id, scores.full_name, scores.score,
    scores.responses, scores.subjects,
    case when scores.score >= 9 then 'Excelente'
         when scores.score >= 8 then 'Bueno'
         when scores.score >= 7 then 'Suficiente'
         else 'No Suficiente' end,
    case when scores.score >= 9 then 'Altamente Recomendado'
         when scores.score >= 8 then 'Recomendado'
         when scores.score >= 7 then 'Requiere Mejora (Capacitación)'
         else 'No Contratable' end,
    case when scores.score >= 9 then 4
         when scores.score >= 8 then 3
         when scores.score >= 7 then 2 else 0 end
  from teacher_scores scores
  order by scores.score desc, scores.full_name
$$;

create function public.institution_overview()
returns table (
  institution_id uuid, institution_name text, short_name text,
  campus_count bigint, program_count bigint, subject_count bigint,
  group_count bigint, period_count bigint, teacher_count bigint,
  student_count bigint, expected bigint, completed bigint,
  pending bigint, participation numeric, average_score numeric
)
language sql stable security definer
set search_path = ''
as $$
  with own as (select app_private.institutional_identity(
    array['coordinator','hr','admin']::text[]) as institution_id),
  participation as (
    select expected, completed, pending, participation
    from public.institution_participation(null,null,null,null)
    where scope = 'total'
  ),
  scores as (
    select pg_catalog.round(pg_catalog.sum(result.average_score * result.response_count)
      / nullif(pg_catalog.sum(result.response_count),0), 2) as average_score
    from app_private.institutional_assignment_results() result
    where result.published
  )
  select i.id, i.name, i.short_name,
    (select pg_catalog.count(*) from public.campuses c where c.institution_id = i.id),
    (select pg_catalog.count(*) from public.programs p where p.institution_id = i.id),
    (select pg_catalog.count(*) from public.subjects s where s.institution_id = i.id),
    (select pg_catalog.count(*) from public.groups g where g.institution_id = i.id),
    (select pg_catalog.count(*) from public.academic_periods ap where ap.institution_id = i.id),
    (select pg_catalog.count(distinct ur.profile_id)
      from public.user_roles ur join public.roles r on r.id = ur.role_id
      where ur.institution_id = i.id and r.code = 'teacher'),
    (select pg_catalog.count(distinct ur.profile_id)
      from public.user_roles ur join public.roles r on r.id = ur.role_id
      where ur.institution_id = i.id and r.code = 'student'),
    participation.expected, participation.completed, participation.pending,
    participation.participation, scores.average_score
  from own join public.institutions i on i.id = own.institution_id
  cross join participation cross join scores
$$;

create function public.admin_institution_summary()
returns table (
  user_count bigint, pending_count bigint, active_count bigint,
  inactive_count bigint, student_count bigint, teacher_count bigint,
  coordinator_count bigint, hr_count bigint, admin_count bigint,
  campus_count bigint, program_count bigint, subject_count bigint,
  group_count bigint, period_count bigint
)
language sql stable security definer
set search_path = ''
as $$
  with own as (select app_private.institutional_identity(array['admin']::text[]) as institution_id)
  select
    (select pg_catalog.count(*) from public.profiles p where p.institution_id = own.institution_id),
    (select pg_catalog.count(*) from public.profiles p where p.institution_id = own.institution_id and p.status = 'pending'::public.user_status),
    (select pg_catalog.count(*) from public.profiles p where p.institution_id = own.institution_id and p.status = 'active'::public.user_status),
    (select pg_catalog.count(*) from public.profiles p where p.institution_id = own.institution_id and p.status = 'inactive'::public.user_status),
    (select pg_catalog.count(*) from public.user_roles ur join public.roles r on r.id = ur.role_id where ur.institution_id = own.institution_id and r.code = 'student'),
    (select pg_catalog.count(*) from public.user_roles ur join public.roles r on r.id = ur.role_id where ur.institution_id = own.institution_id and r.code = 'teacher'),
    (select pg_catalog.count(*) from public.user_roles ur join public.roles r on r.id = ur.role_id where ur.institution_id = own.institution_id and r.code = 'coordinator'),
    (select pg_catalog.count(*) from public.user_roles ur join public.roles r on r.id = ur.role_id where ur.institution_id = own.institution_id and r.code = 'hr'),
    (select pg_catalog.count(*) from public.user_roles ur join public.roles r on r.id = ur.role_id where ur.institution_id = own.institution_id and r.code = 'admin'),
    (select pg_catalog.count(*) from public.campuses c where c.institution_id = own.institution_id),
    (select pg_catalog.count(*) from public.programs p where p.institution_id = own.institution_id),
    (select pg_catalog.count(*) from public.subjects s where s.institution_id = own.institution_id),
    (select pg_catalog.count(*) from public.groups g where g.institution_id = own.institution_id),
    (select pg_catalog.count(*) from public.academic_periods ap where ap.institution_id = own.institution_id)
  from own
$$;

create function public.admin_institution_users(p_search text default null)
returns table (profile_id uuid, full_name text, institutional_email text,
  status public.user_status, role_codes text[])
language sql stable security definer
set search_path = ''
as $$
  with own as (select app_private.institutional_identity(array['admin']::text[]) as institution_id)
  select p.id, p.full_name, p.institutional_email, p.status,
    coalesce(pg_catalog.array_agg(distinct r.code) filter (where r.code is not null), array[]::text[])
  from own join public.profiles p on p.institution_id = own.institution_id
  left join public.user_roles ur on ur.profile_id = p.id and ur.institution_id = own.institution_id
  left join public.roles r on r.id = ur.role_id
  where p_search is null or p_search = ''
    or p.full_name ilike '%' || p_search || '%'
    or p.institutional_email ilike '%' || p_search || '%'
  group by p.id, p.full_name, p.institutional_email, p.status
  order by p.full_name, p.id
  limit 100
$$;

revoke all on function app_private.institutional_identity(text[]) from public, anon, authenticated;
revoke all on function app_private.institutional_assignment_results() from public, anon, authenticated;
revoke all on function public.institutional_filter_options() from public, anon, authenticated;
revoke all on function public.institution_participation(uuid,uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.institution_teacher_ranking(uuid,uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.institution_score_summary(uuid,uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.hr_teacher_metrics(uuid,uuid) from public, anon, authenticated;
revoke all on function public.institution_overview() from public, anon, authenticated;
revoke all on function public.admin_institution_summary() from public, anon, authenticated;
revoke all on function public.admin_institution_users(text) from public, anon, authenticated;

grant execute on function public.institutional_filter_options() to authenticated;
grant execute on function public.institution_participation(uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.institution_teacher_ranking(uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.institution_score_summary(uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.hr_teacher_metrics(uuid,uuid) to authenticated;
grant execute on function public.institution_overview() to authenticated;
grant execute on function public.admin_institution_summary() to authenticated;
grant execute on function public.admin_institution_users(text) to authenticated;

-- No SELECT grant, permissive policy, or write permission is added to a table.
