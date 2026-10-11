-- EvalDoc schema foundation. Access policies will be added in a later block.
-- Tenant-owned relationships carry institution_id. Period-bearing relations
-- also match academic_period_id through composite foreign keys.

create type public.user_status as enum ('pending', 'active', 'inactive');
create type public.evaluation_status as enum ('pending', 'in_progress', 'completed');
create type public.question_type as enum ('scale', 'text');

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  short_name text not null check (btrim(short_name) <> ''),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id),
  name text not null check (btrim(name) <> ''),
  code text not null check (btrim(code) <> ''),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, id),
  unique (institution_id, code)
);

-- id will be the auth.users.id UUID; Auth integration is deferred.
create table public.profiles (
  id uuid primary key,
  institution_id uuid not null references public.institutions (id),
  full_name text not null check (btrim(full_name) <> ''),
  institutional_email text not null check (
    institutional_email = btrim(institutional_email)
    and institutional_email <> ''
  ),
  institutional_identifier text check (
    institutional_identifier is null
    or (institutional_identifier = btrim(institutional_identifier)
      and institutional_identifier <> '')
  ),
  status public.user_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, id)
);
create unique index profiles_institution_email_key
  on public.profiles (institution_id, lower(institutional_email));
create unique index profiles_institution_identifier_key
  on public.profiles (institution_id, lower(institutional_identifier))
  where institutional_identifier is not null;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z_]+$'),
  name text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  role_id uuid not null references public.roles (id),
  institution_id uuid not null references public.institutions (id),
  created_at timestamptz not null default now(),
  foreign key (institution_id, profile_id)
    references public.profiles (institution_id, id),
  unique (profile_id, role_id, institution_id)
);

create table public.academic_periods (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id),
  name text not null check (btrim(name) <> ''),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  unique (institution_id, id),
  unique (institution_id, name)
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id),
  campus_id uuid,
  name text not null check (btrim(name) <> ''),
  code text not null check (btrim(code) <> ''),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (institution_id, campus_id)
    references public.campuses (institution_id, id),
  unique (institution_id, id),
  unique (institution_id, code)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id),
  program_id uuid,
  name text not null check (btrim(name) <> ''),
  code text not null check (btrim(code) <> ''),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (institution_id, program_id)
    references public.programs (institution_id, id),
  unique (institution_id, id),
  unique (institution_id, code)
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id),
  subject_id uuid not null,
  academic_period_id uuid not null,
  code text not null check (btrim(code) <> ''),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (institution_id, subject_id)
    references public.subjects (institution_id, id),
  foreign key (institution_id, academic_period_id)
    references public.academic_periods (institution_id, id),
  unique (institution_id, id, academic_period_id),
  unique (institution_id, subject_id, academic_period_id, code)
);

create table public.teaching_assignments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id),
  teacher_id uuid not null,
  group_id uuid not null,
  academic_period_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (institution_id, teacher_id)
    references public.profiles (institution_id, id),
  foreign key (institution_id, group_id, academic_period_id)
    references public.groups (institution_id, id, academic_period_id),
  unique (institution_id, id, academic_period_id),
  unique (teacher_id, group_id, academic_period_id)
);

create table public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id),
  student_id uuid not null,
  group_id uuid not null,
  academic_period_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (institution_id, student_id)
    references public.profiles (institution_id, id),
  foreign key (institution_id, group_id, academic_period_id)
    references public.groups (institution_id, id, academic_period_id),
  unique (student_id, group_id, academic_period_id)
);

-- NULL institution_id means a shared template. Version changes create new rows.
create table public.survey_templates (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions (id),
  name text not null check (btrim(name) <> ''),
  description text,
  version integer not null check (version > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index survey_templates_global_version_key
  on public.survey_templates (name, version)
  where institution_id is null;
create unique index survey_templates_institution_version_key
  on public.survey_templates (institution_id, name, version)
  where institution_id is not null;

create table public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_template_id uuid not null references public.survey_templates (id),
  position integer not null check (position > 0),
  dimension text not null check (btrim(dimension) <> ''),
  prompt text not null check (btrim(prompt) <> ''),
  question_type public.question_type not null,
  required boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (survey_template_id, position)
);

create table public.evaluation_windows (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id),
  academic_period_id uuid not null,
  survey_template_id uuid not null references public.survey_templates (id),
  name text not null check (btrim(name) <> ''),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (institution_id, academic_period_id)
    references public.academic_periods (institution_id, id),
  check (starts_at < ends_at),
  unique (institution_id, id, academic_period_id),
  unique (institution_id, academic_period_id, name)
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id),
  academic_period_id uuid not null,
  evaluation_window_id uuid not null,
  teaching_assignment_id uuid not null,
  student_id uuid not null,
  status public.evaluation_status not null default 'pending',
  started_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (institution_id, evaluation_window_id, academic_period_id)
    references public.evaluation_windows (institution_id, id, academic_period_id),
  foreign key (institution_id, teaching_assignment_id, academic_period_id)
    references public.teaching_assignments (institution_id, id, academic_period_id),
  foreign key (institution_id, student_id)
    references public.profiles (institution_id, id),
  unique (student_id, teaching_assignment_id, evaluation_window_id),
  check (
    (status = 'pending' and started_at is null and submitted_at is null)
    or (status = 'in_progress' and started_at is not null and submitted_at is null)
    or (status = 'completed' and started_at is not null
      and submitted_at is not null and submitted_at >= started_at)
  )
);

create table public.evaluation_answers (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations (id),
  question_id uuid not null references public.survey_questions (id),
  numeric_value numeric(4, 2) check (
    numeric_value is null or numeric_value between 0 and 10
  ),
  text_value text,
  created_at timestamptz not null default now(),
  unique (evaluation_id, question_id),
  check (numeric_value is not null or nullif(btrim(text_value), '') is not null)
);

-- Unique indexes above cover their leading-column lookup paths.
create index user_roles_institution_id_idx on public.user_roles (institution_id);
create index user_roles_role_id_idx on public.user_roles (role_id);
create index programs_campus_id_idx on public.programs (campus_id)
  where campus_id is not null;
create index subjects_program_id_idx on public.subjects (program_id)
  where program_id is not null;
create index groups_subject_id_idx on public.groups (subject_id);
create index groups_academic_period_id_idx on public.groups (academic_period_id);
create index teaching_assignments_group_id_idx on public.teaching_assignments (group_id);
create index teaching_assignments_academic_period_id_idx
  on public.teaching_assignments (academic_period_id);
create index student_enrollments_institution_id_idx
  on public.student_enrollments (institution_id);
create index student_enrollments_group_id_idx on public.student_enrollments (group_id);
create index student_enrollments_academic_period_id_idx
  on public.student_enrollments (academic_period_id);
create index evaluation_windows_academic_period_id_idx
  on public.evaluation_windows (academic_period_id);
create index evaluation_windows_survey_template_id_idx
  on public.evaluation_windows (survey_template_id);
create index evaluations_institution_id_idx on public.evaluations (institution_id);
create index evaluations_academic_period_id_idx on public.evaluations (academic_period_id);
create index evaluations_teaching_assignment_id_idx
  on public.evaluations (teaching_assignment_id);
create index evaluations_evaluation_window_id_idx
  on public.evaluations (evaluation_window_id);
create index evaluations_status_idx on public.evaluations (status);
create index evaluation_answers_question_id_idx
  on public.evaluation_answers (question_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger institutions_set_updated_at before update on public.institutions
  for each row execute function public.set_updated_at();
create trigger campuses_set_updated_at before update on public.campuses
  for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger academic_periods_set_updated_at before update on public.academic_periods
  for each row execute function public.set_updated_at();
create trigger programs_set_updated_at before update on public.programs
  for each row execute function public.set_updated_at();
create trigger subjects_set_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();
create trigger groups_set_updated_at before update on public.groups
  for each row execute function public.set_updated_at();
create trigger survey_templates_set_updated_at before update on public.survey_templates
  for each row execute function public.set_updated_at();
create trigger evaluation_windows_set_updated_at before update on public.evaluation_windows
  for each row execute function public.set_updated_at();

-- No policies yet: anon/authenticated receive no row access through RLS.
alter table public.institutions enable row level security;
alter table public.campuses enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.academic_periods enable row level security;
alter table public.programs enable row level security;
alter table public.subjects enable row level security;
alter table public.groups enable row level security;
alter table public.teaching_assignments enable row level security;
alter table public.student_enrollments enable row level security;
alter table public.survey_templates enable row level security;
alter table public.survey_questions enable row level security;
alter table public.evaluation_windows enable row level security;
alter table public.evaluations enable row level security;
alter table public.evaluation_answers enable row level security;
