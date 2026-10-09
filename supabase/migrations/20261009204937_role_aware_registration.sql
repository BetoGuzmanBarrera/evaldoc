-- Public signup records an academic request, never an active role or group.
create type public.registration_request_status as enum ('pending', 'approved', 'rejected');

create table public.registration_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique,
  institution_id uuid not null,
  requested_role text not null check (requested_role in ('student', 'teacher')),
  program_id uuid,
  status public.registration_request_status not null default 'pending',
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (institution_id, profile_id)
    references public.profiles (institution_id, id) on delete cascade,
  foreign key (institution_id, program_id)
    references public.programs (institution_id, id),
  unique (institution_id, id),
  check ((requested_role = 'student' and program_id is not null)
    or (requested_role = 'teacher' and program_id is null)),
  check ((status = 'pending' and decided_at is null and decided_by is null)
    or (status <> 'pending' and decided_at is not null))
);

create table public.registration_request_subjects (
  request_id uuid not null,
  institution_id uuid not null,
  subject_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (request_id, subject_id),
  foreign key (institution_id, request_id)
    references public.registration_requests (institution_id, id) on delete cascade,
  foreign key (institution_id, subject_id)
    references public.subjects (institution_id, id)
);
create index registration_request_subjects_subject_idx
  on public.registration_request_subjects (subject_id);

create trigger registration_requests_set_updated_at
  before update on public.registration_requests
  for each row execute function public.set_updated_at();

alter table public.registration_requests enable row level security;
alter table public.registration_request_subjects enable row level security;
revoke all on public.registration_requests, public.registration_request_subjects
  from public, anon, authenticated;
grant select on public.registration_requests to authenticated;
create policy registration_requests_self_read
  on public.registration_requests for select to authenticated
  using (profile_id = (select auth.uid()));

-- Anonymous users may read only active public catalog choices.
grant select on public.programs, public.subjects to anon;
create policy programs_public_registration_read
  on public.programs for select to anon
  using (active and exists (
    select 1 from public.institutions i
    where i.id = institution_id and i.active
  ));
create policy subjects_public_registration_read
  on public.subjects for select to anon
  using (active and exists (
    select 1 from public.institutions i
    where i.id = institution_id and i.active
  ) and (program_id is null or exists (
    select 1 from public.programs p
    where p.id = program_id and p.institution_id = institution_id and p.active
  )));

-- Existing signups without requested_role retain the legacy pending student
-- record. New explicit requests receive no role before institutional approval.
create or replace function app_private.handle_new_evaldoc_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  chosen_institution_id uuid;
  chosen_program_id uuid;
  chosen_subject_id uuid;
  student_role_id uuid;
  chosen_request_id uuid;
  requested_role text;
  subjects_input jsonb;
  subject_value text;
  full_name text;
  identifier text;
begin
  full_name := nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), '');
  identifier := nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'institutional_identifier'), '');
  if full_name is null or pg_catalog.length(full_name) > 120
     or identifier is null or pg_catalog.length(identifier) > 64
     or new.email is null then
    raise exception 'Invalid EvalDoc registration data' using errcode = '22023';
  end if;

  begin
    chosen_institution_id := (new.raw_user_meta_data ->> 'institution_id')::uuid;
  exception when invalid_text_representation then
    raise exception 'Invalid institution' using errcode = '22023';
  end;
  if chosen_institution_id is null or not exists (
    select 1 from public.institutions
    where id = chosen_institution_id and active
  ) then
    raise exception 'Invalid institution' using errcode = '22023';
  end if;

  if coalesce(new.raw_user_meta_data ? 'requested_role', false) then
    requested_role := new.raw_user_meta_data ->> 'requested_role';
    if requested_role is null or requested_role not in ('student', 'teacher') then
      raise exception 'Invalid requested account type' using errcode = '22023';
    end if;

    if requested_role = 'student' then
      begin
        chosen_program_id := (new.raw_user_meta_data ->> 'requested_program_id')::uuid;
      exception when invalid_text_representation then
        raise exception 'Invalid program' using errcode = '22023';
      end;
      if chosen_program_id is null or not exists (
        select 1 from public.programs p
        where p.id = chosen_program_id
          and p.institution_id = chosen_institution_id and p.active
      ) then
        raise exception 'Invalid program' using errcode = '22023';
      end if;
    elsif new.raw_user_meta_data ? 'requested_program_id'
      and new.raw_user_meta_data ->> 'requested_program_id' is not null then
      raise exception 'Teachers cannot request a program' using errcode = '22023';
    end if;

    subjects_input := new.raw_user_meta_data -> 'requested_subject_ids';
    if pg_catalog.jsonb_typeof(subjects_input) is distinct from 'array' then
      raise exception 'Select between 1 and 30 subjects' using errcode = '22023';
    end if;
    if pg_catalog.jsonb_array_length(subjects_input) not between 1 and 30 then
      raise exception 'Select between 1 and 30 subjects' using errcode = '22023';
    end if;
  end if;

  insert into public.profiles (
    id, institution_id, full_name, institutional_email,
    institutional_identifier, status
  ) values (
    new.id, chosen_institution_id, full_name,
    pg_catalog.lower(pg_catalog.btrim(new.email)), identifier, 'pending'
  );

  if requested_role is null then
    select id into student_role_id from public.roles where code = 'student';
    if student_role_id is null then
      raise exception 'Student role is not configured' using errcode = '23503';
    end if;
    insert into public.user_roles (profile_id, role_id, institution_id)
    values (new.id, student_role_id, chosen_institution_id);
    return new;
  end if;

  insert into public.registration_requests (
    profile_id, institution_id, requested_role, program_id
  ) values (
    new.id, chosen_institution_id, requested_role, chosen_program_id
  ) returning id into chosen_request_id;

  for subject_value in
    select pg_catalog.jsonb_array_elements_text(subjects_input)
  loop
    begin
      chosen_subject_id := subject_value::uuid;
    exception when invalid_text_representation then
      raise exception 'Invalid subject' using errcode = '22023';
    end;
    if not exists (
      select 1 from public.subjects s
      left join public.programs p
        on p.id = s.program_id and p.institution_id = s.institution_id
      where s.id = chosen_subject_id
        and s.institution_id = chosen_institution_id and s.active
        and (s.program_id is null or p.active)
        and (requested_role = 'teacher'
          or s.program_id is null or s.program_id = chosen_program_id)
    ) then
      raise exception 'Invalid subject' using errcode = '22023';
    end if;
    insert into public.registration_request_subjects
      (request_id, institution_id, subject_id)
    values (chosen_request_id, chosen_institution_id, chosen_subject_id);
  end loop;
  -- Metadata is only an untrusted signup transport, not a second data store.
  update auth.users set raw_user_meta_data = raw_user_meta_data
    - 'requested_role' - 'requested_program_id' - 'requested_subject_ids'
  where id = new.id;
  return new;
end;
$$;
revoke all on function app_private.handle_new_evaldoc_user()
  from public, anon, authenticated;

create function public.my_registration_request()
returns table (requested_role text, status public.registration_request_status)
language sql stable security invoker
set search_path = ''
as $$
  select r.requested_role, r.status
  from public.registration_requests r
  where r.profile_id = (select auth.uid())
$$;
revoke all on function public.my_registration_request()
  from public, anon, authenticated;
grant execute on function public.my_registration_request() to authenticated;

create function public.admin_pending_registration_requests()
returns table (
  request_id uuid, full_name text, institutional_email text,
  institution_name text, requested_role text, program_name text,
  subject_names text[], status public.registration_request_status
)
language sql stable security definer
set search_path = ''
as $$
  with own as (
    select app_private.current_institution_id() as institution_id
    where app_private.has_active_role('admin')
  )
  select r.id, p.full_name, p.institutional_email, i.name,
    r.requested_role, program.name,
    coalesce(
      pg_catalog.array_agg(s.name order by s.name)
        filter (where s.name is not null), array[]::text[]),
    r.status
  from own
  join public.registration_requests r
    on r.institution_id = own.institution_id and r.status = 'pending'
  join public.profiles p on p.id = r.profile_id
  join public.institutions i on i.id = r.institution_id
  left join public.programs program on program.id = r.program_id
  left join public.registration_request_subjects rs on rs.request_id = r.id
  left join public.subjects s on s.id = rs.subject_id
  group by r.id, p.id, i.id, program.id
  order by r.created_at, r.id
$$;

create function public.admin_decide_registration_request(
  p_request_id uuid, p_approve boolean
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  own_institution_id uuid;
  request_row public.registration_requests%rowtype;
  chosen_role_id uuid;
begin
  if (select auth.uid()) is null
    or not app_private.has_active_role('admin') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  own_institution_id := app_private.current_institution_id();
  if p_request_id is null or p_approve is null then
    raise exception 'Invalid decision' using errcode = '22023';
  end if;

  select * into request_row from public.registration_requests
  where id = p_request_id
    and institution_id = own_institution_id
    and status = 'pending'
  for update;
  if not found then
    raise exception 'Request unavailable' using errcode = '42501';
  end if;
  if not exists (
    select 1 from auth.users u
    where u.id = request_row.profile_id and u.email_confirmed_at is not null
  ) then
    raise exception 'Email is not confirmed' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = request_row.profile_id
      and p.institution_id = own_institution_id and p.status = 'pending'
  ) then
    raise exception 'Profile is not pending' using errcode = '22023';
  end if;

  if p_approve then
    if (request_row.requested_role = 'student' and not exists (
      select 1 from public.programs p
      where p.id = request_row.program_id
        and p.institution_id = own_institution_id and p.active
    )) or not exists (
      select 1 from public.registration_request_subjects rs
      where rs.request_id = request_row.id
    ) or exists (
      select 1 from public.registration_request_subjects rs
      join public.subjects s on s.id = rs.subject_id
      left join public.programs p on p.id = s.program_id
      where rs.request_id = request_row.id
        and (s.institution_id <> own_institution_id or not s.active
          or (s.program_id is not null and not p.active)
          or (request_row.requested_role = 'student'
            and s.program_id is not null
            and s.program_id <> request_row.program_id))
    ) then
      raise exception 'Academic request is no longer valid' using errcode = '22023';
    end if;

    select id into chosen_role_id from public.roles
      where code = request_row.requested_role;
    if chosen_role_id is null then
      raise exception 'Role unavailable' using errcode = '23503';
    end if;
    if request_row.requested_role = 'teacher' then
      delete from public.user_roles ur
      using public.roles role
      where ur.profile_id = request_row.profile_id
        and ur.institution_id = own_institution_id
        and role.id = ur.role_id and role.code = 'student';
    end if;
    insert into public.user_roles (profile_id, role_id, institution_id)
    values (request_row.profile_id, chosen_role_id, own_institution_id)
    on conflict (profile_id, role_id, institution_id) do nothing;
    update public.profiles set status = 'active'
      where id = request_row.profile_id;
  else
    update public.profiles set status = 'inactive'
      where id = request_row.profile_id;
  end if;

  update public.registration_requests
  set status = case when p_approve then 'approved'::public.registration_request_status
                    else 'rejected'::public.registration_request_status end,
      decided_by = (select auth.uid()), decided_at = pg_catalog.now()
  where id = request_row.id;
end;
$$;

revoke all on function public.admin_pending_registration_requests()
  from public, anon, authenticated;
revoke all on function public.admin_decide_registration_request(uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.admin_pending_registration_requests()
  to authenticated;
grant execute on function public.admin_decide_registration_request(uuid, boolean)
  to authenticated;
