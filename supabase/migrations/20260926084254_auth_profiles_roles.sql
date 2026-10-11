-- Email/password public signup creates a pending student profile atomically.
-- Auth metadata supplies contact and institution choices, never a role.
alter table public.profiles
  add constraint profiles_id_auth_users_fkey
  foreign key (id) references auth.users (id) on delete cascade;

-- Let deletion of a user without academic history clean up its role rows.
-- Historical assignments/enrollments/evaluations still prevent deletion.
alter table public.user_roles
  drop constraint user_roles_institution_id_profile_id_fkey;
alter table public.user_roles
  add constraint user_roles_institution_id_profile_id_fkey
  foreign key (institution_id, profile_id)
  references public.profiles (institution_id, id) on delete cascade;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create function app_private.handle_new_evaldoc_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_institution_id uuid;
  student_role_id uuid;
  full_name text;
  identifier text;
begin
  -- These values are untrusted registration input. Validate before persisting.
  full_name := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
  identifier := nullif(btrim(new.raw_user_meta_data ->> 'institutional_identifier'), '');
  if full_name is null or length(full_name) > 120
     or identifier is null or length(identifier) > 64
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

  select id into student_role_id from public.roles where code = 'student';
  if student_role_id is null then
    raise exception 'Student role is not configured' using errcode = '23503';
  end if;

  insert into public.profiles (
    id, institution_id, full_name, institutional_email,
    institutional_identifier, status
  ) values (
    new.id, chosen_institution_id, full_name, lower(btrim(new.email)),
    identifier, 'pending'
  );
  insert into public.user_roles (profile_id, role_id, institution_id)
  values (new.id, student_role_id, chosen_institution_id);
  return new;
end;
$$;

revoke all on function app_private.handle_new_evaldoc_user()
  from public, anon, authenticated;
create trigger evaldoc_on_auth_user_created
  after insert on auth.users
  for each row execute function app_private.handle_new_evaldoc_user();

-- Minimal read policies for signup and for the signed-in user's own identity.
-- No client write policy is created for profiles, roles, or user_roles.
create policy institutions_public_signup_read
  on public.institutions for select to anon, authenticated
  using (active);
create policy profiles_self_read
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy user_roles_self_read
  on public.user_roles for select to authenticated
  using (profile_id = (select auth.uid()));
create policy roles_catalog_read
  on public.roles for select to authenticated
  using (code in ('student', 'teacher', 'coordinator', 'hr', 'admin'));
