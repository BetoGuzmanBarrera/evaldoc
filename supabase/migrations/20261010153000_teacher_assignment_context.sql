-- A teacher may see the academic context of their own assignment without
-- broadening the campus and program SELECT policies for other users.
create function public.teacher_assignment_context(p_assignment_id uuid)
returns table (campus_name text, program_name text)
language sql stable security definer
set search_path = ''
as $$
  select c.name, p.name
  from app_private.current_teacher_identity() me
  join public.teaching_assignments ta
    on ta.id = p_assignment_id
   and ta.teacher_id = me.teacher_id
   and ta.institution_id = me.institution_id
  join public.groups g
    on g.id = ta.group_id
   and g.institution_id = ta.institution_id
   and g.academic_period_id = ta.academic_period_id
  join public.subjects s
    on s.id = g.subject_id and s.institution_id = g.institution_id
  left join public.programs p
    on p.id = s.program_id and p.institution_id = s.institution_id
  left join public.campuses c
    on c.id = p.campus_id and c.institution_id = p.institution_id
$$;

revoke all on function public.teacher_assignment_context(uuid) from public, anon, authenticated;
grant execute on function public.teacher_assignment_context(uuid) to authenticated;
