-- Read-only academic access is derived from live profiles, roles and relationships.
-- The client receives no write grants in this block; evaluations remain closed.
alter policy institutions_public_signup_read on public.institutions to anon;

-- Supabase projects may grant all public tables to API roles by default.
-- Reset these grants explicitly before adding the narrow read surface below.
revoke all on
  public.institutions, public.campuses, public.profiles, public.roles,
  public.user_roles, public.academic_periods, public.programs, public.subjects,
  public.groups, public.teaching_assignments, public.student_enrollments,
  public.survey_templates, public.survey_questions, public.evaluation_windows,
  public.evaluations, public.evaluation_answers
from public, anon, authenticated;

grant select on public.institutions to anon, authenticated;
grant select on
  public.campuses, public.profiles, public.roles, public.user_roles,
  public.academic_periods, public.programs, public.subjects, public.groups,
  public.teaching_assignments, public.student_enrollments,
  public.survey_templates, public.survey_questions, public.evaluation_windows
to authenticated;

-- These private lookups bypass the self-read identity policies, preventing
-- policy recursion. They derive identity from auth.uid(), never client metadata
-- or a client-provided institution ID.
create function app_private.current_institution_id()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select p.institution_id
  from public.profiles p
  where p.id = (select auth.uid())
$$;

create function app_private.has_active_role(role_code text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.user_roles ur
      on ur.profile_id = p.id and ur.institution_id = p.institution_id
    join public.roles r on r.id = ur.role_id
    where p.id = (select auth.uid())
      and p.status = 'active'::public.user_status
      and r.code = role_code
  )
$$;

revoke all on function app_private.current_institution_id() from public, anon, authenticated;
revoke all on function app_private.has_active_role(text) from public, anon, authenticated;
grant usage on schema app_private to authenticated;
grant execute on function app_private.current_institution_id() to authenticated;
grant execute on function app_private.has_active_role(text) to authenticated;

-- Anonymous visitors see only active signup choices. Signed-in users see only
-- their own institution, including pending users loading their identity.
create policy institutions_authenticated_own_read
  on public.institutions for select to authenticated
  using (id = (select app_private.current_institution_id()));

-- Identity policies from Block 5 remain self-read only. There are no client
-- INSERT/UPDATE/DELETE grants or policies for profiles, roles or user_roles.

create policy campuses_structure_read
  on public.campuses for select to authenticated
  using (
    institution_id = (select app_private.current_institution_id())
    and (
      (select app_private.has_active_role('coordinator'))
      or (select app_private.has_active_role('admin'))
    )
  );

create policy academic_periods_role_read
  on public.academic_periods for select to authenticated
  using (
    institution_id = (select app_private.current_institution_id())
    and (
      (select app_private.has_active_role('coordinator'))
      or (select app_private.has_active_role('admin'))
      or (select app_private.has_active_role('hr'))
      or (
        (select app_private.has_active_role('student'))
        and exists (
          select 1 from public.student_enrollments e
          where e.institution_id = academic_periods.institution_id
            and e.academic_period_id = academic_periods.id
            and e.student_id = (select auth.uid())
        )
      )
      or (
        (select app_private.has_active_role('teacher'))
        and exists (
          select 1 from public.teaching_assignments ta
          where ta.institution_id = academic_periods.institution_id
            and ta.academic_period_id = academic_periods.id
            and ta.teacher_id = (select auth.uid())
        )
      )
    )
  );

create policy programs_role_read
  on public.programs for select to authenticated
  using (
    institution_id = (select app_private.current_institution_id())
    and (
      (select app_private.has_active_role('coordinator'))
      or (select app_private.has_active_role('admin'))
      or (
        (select app_private.has_active_role('student'))
        and exists (
          select 1
          from public.subjects s
          join public.groups g
            on g.institution_id = s.institution_id and g.subject_id = s.id
          join public.student_enrollments e
            on e.institution_id = g.institution_id
           and e.group_id = g.id
           and e.academic_period_id = g.academic_period_id
          where s.institution_id = programs.institution_id
            and s.program_id = programs.id
            and e.student_id = (select auth.uid())
        )
      )
    )
  );

create policy subjects_role_read
  on public.subjects for select to authenticated
  using (
    institution_id = (select app_private.current_institution_id())
    and (
      (select app_private.has_active_role('coordinator'))
      or (select app_private.has_active_role('admin'))
      or (
        (select app_private.has_active_role('student'))
        and exists (
          select 1
          from public.groups g
          join public.student_enrollments e
            on e.institution_id = g.institution_id
           and e.group_id = g.id
           and e.academic_period_id = g.academic_period_id
          where g.institution_id = subjects.institution_id
            and g.subject_id = subjects.id
            and e.student_id = (select auth.uid())
        )
      )
      or (
        (select app_private.has_active_role('teacher'))
        and exists (
          select 1
          from public.groups g
          join public.teaching_assignments ta
            on ta.institution_id = g.institution_id
           and ta.group_id = g.id
           and ta.academic_period_id = g.academic_period_id
          where g.institution_id = subjects.institution_id
            and g.subject_id = subjects.id
            and ta.teacher_id = (select auth.uid())
        )
      )
    )
  );

create policy groups_role_read
  on public.groups for select to authenticated
  using (
    institution_id = (select app_private.current_institution_id())
    and (
      (select app_private.has_active_role('coordinator'))
      or (select app_private.has_active_role('admin'))
      or (
        (select app_private.has_active_role('student'))
        and exists (
          select 1 from public.student_enrollments e
          where e.institution_id = groups.institution_id
            and e.group_id = groups.id
            and e.academic_period_id = groups.academic_period_id
            and e.student_id = (select auth.uid())
        )
      )
      or (
        (select app_private.has_active_role('teacher'))
        and exists (
          select 1 from public.teaching_assignments ta
          where ta.institution_id = groups.institution_id
            and ta.group_id = groups.id
            and ta.academic_period_id = groups.academic_period_id
            and ta.teacher_id = (select auth.uid())
        )
      )
    )
  );

create policy teaching_assignments_role_read
  on public.teaching_assignments for select to authenticated
  using (
    institution_id = (select app_private.current_institution_id())
    and (
      (select app_private.has_active_role('coordinator'))
      or (select app_private.has_active_role('admin'))
      or (
        (select app_private.has_active_role('teacher'))
        and teacher_id = (select auth.uid())
      )
      or (
        (select app_private.has_active_role('student'))
        and exists (
          select 1 from public.student_enrollments e
          where e.institution_id = teaching_assignments.institution_id
            and e.group_id = teaching_assignments.group_id
            and e.academic_period_id = teaching_assignments.academic_period_id
            and e.student_id = (select auth.uid())
        )
      )
    )
  );

create policy student_enrollments_own_read
  on public.student_enrollments for select to authenticated
  using (
    institution_id = (select app_private.current_institution_id())
    and student_id = (select auth.uid())
    and (select app_private.has_active_role('student'))
  );

create policy evaluation_windows_role_read
  on public.evaluation_windows for select to authenticated
  using (
    institution_id = (select app_private.current_institution_id())
    and (
      (select app_private.has_active_role('coordinator'))
      or (select app_private.has_active_role('admin'))
      or (
        active
        and (select app_private.has_active_role('student'))
        and exists (
          select 1
          from public.student_enrollments e
          join public.teaching_assignments ta
            on ta.institution_id = e.institution_id
           and ta.group_id = e.group_id
           and ta.academic_period_id = e.academic_period_id
          where e.institution_id = evaluation_windows.institution_id
            and e.academic_period_id = evaluation_windows.academic_period_id
            and e.student_id = (select auth.uid())
        )
      )
    )
  );

-- NULL template institution means global, but a global template is exposed
-- only when an eligible window in the caller's institution uses it.
create policy survey_templates_role_read
  on public.survey_templates for select to authenticated
  using (
    (institution_id is null
      or institution_id = (select app_private.current_institution_id()))
    and (
      (
        institution_id = (select app_private.current_institution_id())
        and (
          (select app_private.has_active_role('coordinator'))
          or (select app_private.has_active_role('admin'))
        )
      )
      or (
        (select app_private.has_active_role('coordinator'))
        or (select app_private.has_active_role('admin'))
      ) and exists (
        select 1 from public.evaluation_windows w
        where w.institution_id = (select app_private.current_institution_id())
          and w.survey_template_id = survey_templates.id
      )
      or (
        (select app_private.has_active_role('student'))
        and exists (
          select 1
          from public.evaluation_windows w
          join public.student_enrollments e
            on e.institution_id = w.institution_id
           and e.academic_period_id = w.academic_period_id
          join public.teaching_assignments ta
            on ta.institution_id = e.institution_id
           and ta.group_id = e.group_id
           and ta.academic_period_id = e.academic_period_id
          where w.survey_template_id = survey_templates.id
            and w.institution_id = (select app_private.current_institution_id())
            and w.active
            and e.student_id = (select auth.uid())
        )
      )
    )
  );

create policy survey_questions_role_read
  on public.survey_questions for select to authenticated
  using (
    exists (
      select 1 from public.survey_templates t
      where t.id = survey_questions.survey_template_id
    )
    and (
      active
      or (select app_private.has_active_role('coordinator'))
      or (select app_private.has_active_role('admin'))
    )
  );

-- A dedicated, narrow projection supplies only teacher names for an active
-- student's real enrollments. The private definer function never accepts IDs.
create function app_private.my_evaluation_teachers()
returns table (teaching_assignment_id uuid, teacher_id uuid, teacher_name text)
language sql stable security definer
set search_path = ''
as $$
  select ta.id, teacher.id, teacher.full_name
  from public.profiles student
  join public.user_roles student_role
    on student_role.profile_id = student.id
   and student_role.institution_id = student.institution_id
  join public.roles student_role_code
    on student_role_code.id = student_role.role_id
   and student_role_code.code = 'student'
  join public.student_enrollments e
    on e.student_id = student.id
   and e.institution_id = student.institution_id
  join public.teaching_assignments ta
    on ta.institution_id = e.institution_id
   and ta.group_id = e.group_id
   and ta.academic_period_id = e.academic_period_id
  join public.profiles teacher
    on teacher.id = ta.teacher_id
   and teacher.institution_id = ta.institution_id
   and teacher.status = 'active'::public.user_status
  join public.user_roles teacher_role
    on teacher_role.profile_id = teacher.id
   and teacher_role.institution_id = teacher.institution_id
  join public.roles teacher_role_code
    on teacher_role_code.id = teacher_role.role_id
   and teacher_role_code.code = 'teacher'
  where student.id = (select auth.uid())
    and student.status = 'active'::public.user_status
$$;

revoke all on function app_private.my_evaluation_teachers()
  from public, anon, authenticated;
grant execute on function app_private.my_evaluation_teachers()
  to authenticated;

-- Public API wrapper is SECURITY INVOKER; its only data source is the
-- authenticated, no-argument private projection above.
create function public.my_evaluation_teachers()
returns table (teaching_assignment_id uuid, teacher_id uuid, teacher_name text)
language sql stable security invoker
set search_path = ''
as $$
  select d.teaching_assignment_id, d.teacher_id, d.teacher_name
  from app_private.my_evaluation_teachers() d
$$;

revoke all on function public.my_evaluation_teachers()
  from public, anon, authenticated;
grant execute on function public.my_evaluation_teachers()
  to authenticated;

-- Evaluations and evaluation_answers intentionally have no client grants or
-- policies. Their write flow and aggregated teacher results belong to PR #7.