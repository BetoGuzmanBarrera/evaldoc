-- Minimal academic facility catalog. Institution-scoped facilities may belong
-- to one campus or to the institution as a whole. No client writes are granted.
create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id),
  campus_id uuid,
  name text not null check (name = btrim(name) and name <> ''),
  facility_type text not null check (facility_type ~ '^[a-z][a-z_]*$'),
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (institution_id, campus_id)
    references public.campuses (institution_id, id),
  check (description is null or description = btrim(description))
);

create unique index facilities_campus_name_key
  on public.facilities (institution_id, campus_id, lower(name))
  where campus_id is not null;
create unique index facilities_institution_name_key
  on public.facilities (institution_id, lower(name))
  where campus_id is null;

create trigger facilities_set_updated_at before update on public.facilities
  for each row execute function public.set_updated_at();

-- The junction has no redundant tenant column: the trigger verifies that
-- both referenced entities belong to the same institution and compatible campus.
create table public.program_facilities (
  program_id uuid not null references public.programs (id),
  facility_id uuid not null references public.facilities (id),
  created_at timestamptz not null default now(),
  primary key (program_id, facility_id)
);
create index program_facilities_facility_id_idx
  on public.program_facilities (facility_id);

create function app_private.validate_program_facility()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  program_institution uuid;
  program_campus uuid;
  facility_institution uuid;
  facility_campus uuid;
begin
  select p.institution_id, p.campus_id, f.institution_id, f.campus_id
  into program_institution, program_campus, facility_institution, facility_campus
  from public.programs p
  cross join public.facilities f
  where p.id = new.program_id and f.id = new.facility_id
  for share of p, f;

  if not found then
    raise exception 'program_or_facility_unavailable' using errcode = '23503';
  end if;
  if program_institution <> facility_institution
     or (program_campus is not null and facility_campus is not null
         and program_campus <> facility_campus) then
    raise exception 'program_facility_scope_mismatch' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger program_facilities_validate_scope
before insert or update of program_id, facility_id on public.program_facilities
for each row execute function app_private.validate_program_facility();

-- Existing links must stay valid if an administrator later moves either side.
create function app_private.protect_program_facility_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'programs' and exists (
    select 1 from public.program_facilities pf
    join public.facilities f on f.id = pf.facility_id
    where pf.program_id = new.id
      and (f.institution_id <> new.institution_id
        or (new.campus_id is not null and f.campus_id is not null
            and new.campus_id <> f.campus_id))
  ) then
    raise exception 'program_facility_scope_mismatch' using errcode = '23514';
  elsif tg_table_name = 'facilities' and exists (
    select 1 from public.program_facilities pf
    join public.programs p on p.id = pf.program_id
    where pf.facility_id = new.id
      and (p.institution_id <> new.institution_id
        or (p.campus_id is not null and new.campus_id is not null
            and p.campus_id <> new.campus_id))
  ) then
    raise exception 'program_facility_scope_mismatch' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger programs_protect_facility_scope
before update of institution_id, campus_id on public.programs
for each row execute function app_private.protect_program_facility_scope();
create trigger facilities_protect_program_scope
before update of institution_id, campus_id on public.facilities
for each row execute function app_private.protect_program_facility_scope();

revoke all on function app_private.validate_program_facility()
  from public, anon, authenticated;
revoke all on function app_private.protect_program_facility_scope()
  from public, anon, authenticated;

alter table public.facilities enable row level security;
alter table public.program_facilities enable row level security;
revoke all on public.facilities, public.program_facilities
  from public, anon, authenticated;
grant select on public.facilities, public.program_facilities to authenticated;

create policy facilities_structure_read
  on public.facilities for select to authenticated
  using (
    institution_id = (select app_private.current_institution_id())
    and ((select app_private.has_active_role('coordinator'))
      or (select app_private.has_active_role('admin')))
  );

create policy program_facilities_structure_read
  on public.program_facilities for select to authenticated
  using (
    ((select app_private.has_active_role('coordinator'))
      or (select app_private.has_active_role('admin')))
    and exists (
      select 1 from public.programs p
      join public.facilities f on f.id = program_facilities.facility_id
      where p.id = program_facilities.program_id
        and p.institution_id = (select app_private.current_institution_id())
        and f.institution_id = p.institution_id
    )
  );
