-- Legacy/Auth signup without requested_role keeps a pending profile with no role.
-- Explicit student, teacher, and coordinator requests retain their approval path.
create or replace function app_private.handle_new_evaldoc_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  chosen_institution_id uuid;
  chosen_campus_id uuid;
  chosen_program_id uuid;
  chosen_subject_id uuid;
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
    if requested_role is null or requested_role not in ('student', 'teacher', 'coordinator') then
      raise exception 'Invalid requested account type' using errcode = '22023';
    end if;
    if requested_role = 'coordinator' then
      if new.raw_user_meta_data ? 'requested_campus_id'
        or new.raw_user_meta_data ? 'requested_program_id'
        or new.raw_user_meta_data ? 'requested_subject_ids' then
        raise exception 'Coordinator requests cannot include academic selections'
          using errcode = '22023';
      end if;
      subjects_input := '[]'::jsonb;
    else
      begin
        chosen_campus_id := (new.raw_user_meta_data ->> 'requested_campus_id')::uuid;
      exception when invalid_text_representation then
        raise exception 'Invalid campus' using errcode = '22023';
      end;
      if chosen_campus_id is null or not exists (
        select 1 from public.campuses c
        where c.id = chosen_campus_id
          and c.institution_id = chosen_institution_id and c.active
      ) then
        raise exception 'Invalid campus' using errcode = '22023';
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
            and p.institution_id = chosen_institution_id
            and p.campus_id = chosen_campus_id and p.active and p.catalog_visible
        ) then
          raise exception 'Invalid program' using errcode = '22023';
        end if;
      elsif new.raw_user_meta_data ? 'requested_program_id'
        and new.raw_user_meta_data ->> 'requested_program_id' is not null then
        raise exception 'Only students can request a program' using errcode = '22023';
      end if;
      subjects_input := new.raw_user_meta_data -> 'requested_subject_ids';
      if pg_catalog.jsonb_typeof(subjects_input) is distinct from 'array'
        or pg_catalog.jsonb_array_length(subjects_input) not between 1 and 30 then
        raise exception 'Select between 1 and 30 subjects' using errcode = '22023';
      end if;
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
    return new;
  end if;

  insert into public.registration_requests (
    profile_id, institution_id, campus_id, requested_role, program_id
  ) values (
    new.id, chosen_institution_id, chosen_campus_id, requested_role, chosen_program_id
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
      join public.programs p
        on p.id = s.program_id and p.institution_id = s.institution_id
      where s.id = chosen_subject_id
        and s.institution_id = chosen_institution_id and s.active
        and p.active and p.catalog_visible and p.campus_id = chosen_campus_id
        and (requested_role = 'teacher' or p.id = chosen_program_id)
    ) then
      raise exception 'Invalid subject' using errcode = '22023';
    end if;
    insert into public.registration_request_subjects
      (request_id, institution_id, subject_id)
    values (chosen_request_id, chosen_institution_id, chosen_subject_id);
  end loop;
  update auth.users set raw_user_meta_data = raw_user_meta_data
    - 'requested_role' - 'requested_campus_id'
    - 'requested_program_id' - 'requested_subject_ids'
  where id = new.id;
  return new;
end;
$$;
revoke all on function app_private.handle_new_evaldoc_user()
  from public, anon, authenticated;
