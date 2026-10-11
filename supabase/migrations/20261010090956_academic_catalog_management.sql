-- Reference institutions must exist before this migration's catalog even on a
-- fresh local checkout, where seed.sql runs only after all migrations.
insert into public.institutions (name, short_name, slug) values
('Instituto Politécnico Nacional','IPN','ipn'),
('Universidad Nacional Autónoma de México','UNAM','unam'),
('Universidad del Valle de México','UVM','uvm'),
('Tecnológico de Monterrey','Tec de Monterrey','tecnologico-de-monterrey'),
('Universidad Autónoma Metropolitana','UAM','uam'),
('Universidad Iberoamericana','Ibero','universidad-iberoamericana'),
('Universidad Anáhuac','Anáhuac','universidad-anahuac')
on conflict (slug) do nothing;
-- PR #18: campus-scoped academic catalog without rewriting QA evaluations.
-- programs.campus_id is already a tenant-checked 1:N campus relationship.
-- catalog_visible excludes historical QA programs from the public catalog.
alter table public.programs add column catalog_visible boolean not null default true;
create unique index programs_active_catalog_name_key
  on public.programs (institution_id, lower(name))
  where active and catalog_visible;

create temporary table academic_catalog (
  slug text not null, campus_code text not null, campus_name text not null,
  careers text[] not null
) on commit preserve rows;
insert into academic_catalog values
('ipn','CAT-1','ESIME Zacatenco',array['Ingeniería Eléctrica','Ingeniería en Comunicaciones y Electrónica','Ingeniería en Control y Automatización']),
('ipn','CAT-2','UPIIG Campus Guanajuato',array['Ingeniería Aeronáutica','Ingeniería Biotecnológica','Ingeniería en Sistemas Automotrices']),
('ipn','CAT-3','UPIIZ Campus Zacatecas',array['Ingeniería Ambiental','Ingeniería en Alimentos','Ingeniería en Inteligencia Artificial']),
('unam','CAT-1','Ciudad Universitaria',array['Médico Cirujano','Fisioterapia','Neurociencias']),
('unam','CAT-2','FES Acatlán',array['Actuaría','Relaciones Internacionales','Ingeniería Civil']),
('unam','CAT-3','FES Aragón',array['Comunicación y Periodismo','Derecho','Ingeniería en Computación']),
('uvm','CAT-1','Reforma – San Rafael',array['Comunicación y Medios Digitales','Psicología','Economía y Finanzas']),
('uvm','CAT-2','Coyoacán – Tlalpan',array['Ingeniería Biomédica','Medicina Veterinaria y Zootecnia','Fisioterapia']),
('uvm','CAT-3','Monterrey Cumbres',array['Ingeniería en Ciencia de Datos','Ingeniería en Desarrollo de Videojuegos','Ingeniería en Robótica']),
('tecnologico-de-monterrey','CAT-1','Campus Monterrey',array['Arquitectura','Ingeniería Biomédica','Ingeniería en Nanotecnología']),
('tecnologico-de-monterrey','CAT-2','Campus Santa Fe',array['Ingeniería en Transformación Digital de Negocios','Comunicación y Producción Digital','Derecho']),
('tecnologico-de-monterrey','CAT-3','Campus Guadalajara',array['Mercadotecnia','Finanzas','Diseño']),
('uam','CAT-1','Unidad Azcapotzalco',array['Ingeniería Ambiental','Arquitectura','Derecho']),
('uam','CAT-2','Unidad Iztapalapa',array['Computación','Ingeniería Biomédica','Antropología Social']),
('uam','CAT-3','Unidad Xochimilco',array['Agronomía','Estomatología','Comunicación Social']),
('universidad-iberoamericana','CAT-1','Ciudad de México',array['Ingeniería en Inteligencia Artificial','Psicología','Ingeniería Civil']),
('universidad-iberoamericana','CAT-2','Puebla',array['Arquitectura','Ingeniería Automotriz','Derecho']),
('universidad-iberoamericana','CAT-3','León',array['Marketing y Publicidad','Comunicación','Nutrición y Ciencia de los Alimentos']),
('universidad-anahuac','CAT-1','México Campus Norte',array['Biotecnología','Médico Cirujano Dentista','Artes Visuales']),
('universidad-anahuac','CAT-2','México Campus Sur',array['Administración y Dirección de Empresas','Dirección Financiera','Economía']),
('universidad-anahuac','CAT-3','Anáhuac Querétaro',array['Arquitectura','Ingeniería Mecánica para la Innovación','Turismo Internacional']);

insert into public.campuses (institution_id, code, name, active)
select i.id, catalog.campus_code, catalog.campus_name, true
from academic_catalog catalog join public.institutions i on i.slug = catalog.slug
on conflict (institution_id, code) do update
set name = excluded.name, active = true;

-- The QA program remains active for old requests and reports, but is not a
-- fourth public career. Giving it a real campus updates only its structural
-- parent; existing groups, assignments, answers and scores are unchanged.
update public.programs p
set campus_id = coalesce(p.campus_id, c.id), catalog_visible = false
from public.institutions i
join public.campuses c on c.institution_id = i.id and c.code = 'CAT-1'
where i.slug = 'universidad-anahuac'
  and p.institution_id = i.id and p.code = 'QA-ISC'
  and p.name = 'Ingeniería de Software QA';

insert into public.programs
  (institution_id, campus_id, name, code, active, catalog_visible)
select i.id, c.id, career.name,
  catalog.campus_code || '-' || career.ordinality::text, true, true
from academic_catalog catalog
join public.institutions i on i.slug = catalog.slug
join public.campuses c on c.institution_id = i.id
  and c.code = catalog.campus_code
cross join lateral unnest(catalog.careers) with ordinality as career(name, ordinality)
on conflict (institution_id, code) do update
set name = excluded.name, campus_id = excluded.campus_id,
    active = true, catalog_visible = true;
drop table pg_temp.academic_catalog;

-- Preserve older QA requests with NULL campus; new requests must choose one.
alter table public.registration_requests add column campus_id uuid;
alter table public.registration_requests
  add constraint registration_requests_campus_tenant_fk
  foreign key (institution_id, campus_id)
  references public.campuses (institution_id, id);
create index registration_requests_campus_idx
  on public.registration_requests (campus_id) where campus_id is not null;

grant select on public.campuses to anon;
create policy campuses_public_registration_read
  on public.campuses for select to anon
  using (active and exists (
    select 1 from public.institutions i
    where i.id = institution_id and i.active
  ));
drop policy programs_public_registration_read on public.programs;
create policy programs_public_registration_read
  on public.programs for select to anon
  using (active and catalog_visible and campus_id is not null
    and exists (select 1 from public.institutions i
      where i.id = institution_id and i.active)
    and exists (select 1 from public.campuses c
      where c.id = public.programs.campus_id and c.institution_id = public.programs.institution_id and c.active));
drop policy subjects_public_registration_read on public.subjects;
create policy subjects_public_registration_read
  on public.subjects for select to anon
  using (active and exists (
    select 1 from public.programs p
    join public.campuses c on c.id = p.campus_id
      and c.institution_id = p.institution_id
    join public.institutions i on i.id = p.institution_id
    where p.id = public.subjects.program_id and p.institution_id = public.subjects.institution_id
      and p.active and p.catalog_visible and c.active and i.active
  ));



-- Composite tenant + campus reference makes the requested program compatible
-- with its chosen campus. Legacy requests with NULL campus remain untouched.
alter table public.programs
  add constraint programs_tenant_id_campus_key unique (institution_id, id, campus_id);
alter table public.registration_requests
  add constraint registration_requests_program_campus_fk
  foreign key (institution_id, program_id, campus_id)
  references public.programs (institution_id, id, campus_id);

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
    select id into student_role_id from public.roles where code = 'student';
    if student_role_id is null then
      raise exception 'Student role is not configured' using errcode = '23503';
    end if;
    insert into public.user_roles (profile_id, role_id, institution_id)
    values (new.id, student_role_id, chosen_institution_id);
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


-- Coordinator RPCs are the only academic write surface. The client has no
-- INSERT/UPDATE/DELETE grants on these tables; each call checks the live role.
create function app_private.require_academic_coordinator()
returns uuid
language plpgsql stable security definer
set search_path = ''
as $$
declare own_institution uuid;
begin
  if (select auth.uid()) is null
    or not app_private.has_active_role('coordinator') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  own_institution := app_private.current_institution_id();
  if own_institution is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return own_institution;
end;
$$;
revoke all on function app_private.require_academic_coordinator()
  from public, anon, authenticated;

create function public.coordinator_academic_snapshot()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare own_institution uuid;
begin
  own_institution := app_private.require_academic_coordinator();
  return pg_catalog.jsonb_build_object(
    'campuses', coalesce((select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id',c.id,'name',c.name,'active',c.active)
      order by c.name)
      from public.campuses c where c.institution_id=own_institution), '[]'::jsonb),
    'programs', coalesce((select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id',p.id,'campus_id',p.campus_id,
        'name',p.name,'active',p.active)
      order by p.name)
      from public.programs p where p.institution_id=own_institution
        and p.catalog_visible), '[]'::jsonb),
    'subjects', coalesce((select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id',s.id,'program_id',s.program_id,
        'name',s.name,'code',s.code,'active',s.active)
      order by s.name)
      from public.subjects s join public.programs p
        on p.id=s.program_id and p.institution_id=s.institution_id
      where s.institution_id=own_institution and p.catalog_visible), '[]'::jsonb),
    'periods', coalesce((select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id',ap.id,'name',ap.name,
        'active',ap.active,'starts_at',ap.starts_at,'ends_at',ap.ends_at)
      order by ap.starts_at desc)
      from public.academic_periods ap where ap.institution_id=own_institution), '[]'::jsonb),
    'groups', coalesce((select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id',g.id,'subject_id',g.subject_id,
        'period_id',g.academic_period_id,'code',g.code,'active',g.active)
      order by g.code)
      from public.groups g join public.subjects s on s.id=g.subject_id
      join public.programs p on p.id=s.program_id
      where g.institution_id=own_institution and p.catalog_visible), '[]'::jsonb),
    'teachers', coalesce((select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id',p.id,'name',p.full_name) order by p.full_name)
      from public.profiles p join public.user_roles ur
        on ur.profile_id=p.id and ur.institution_id=p.institution_id
      join public.roles r on r.id=ur.role_id and r.code='teacher'
      where p.institution_id=own_institution and p.status='active'), '[]'::jsonb),
    'students', coalesce((select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id',p.id,'name',p.full_name) order by p.full_name)
      from public.profiles p join public.user_roles ur
        on ur.profile_id=p.id and ur.institution_id=p.institution_id
      join public.roles r on r.id=ur.role_id and r.code='student'
      where p.institution_id=own_institution and p.status='active'), '[]'::jsonb),
    'assignments', coalesce((select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id',ta.id,'group_id',ta.group_id,
        'teacher_id',ta.teacher_id))
      from public.teaching_assignments ta where ta.institution_id=own_institution), '[]'::jsonb),
    'enrollments', coalesce((select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id',e.id,'group_id',e.group_id,
        'student_id',e.student_id))
      from public.student_enrollments e where e.institution_id=own_institution), '[]'::jsonb)
  );
end;
$$;

create function public.coordinator_create_period(
  p_name text, p_starts_at timestamptz, p_ends_at timestamptz
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare own_institution uuid; created_id uuid;
begin
  own_institution := app_private.require_academic_coordinator();
  if p_name is null or pg_catalog.btrim(p_name)=''
    or pg_catalog.length(pg_catalog.btrim(p_name))>120
    or p_starts_at is null or p_ends_at is null
    or p_starts_at >= p_ends_at then
    raise exception 'Invalid period' using errcode='22023';
  end if;
  insert into public.academic_periods
    (institution_id,name,starts_at,ends_at)
  values (own_institution,pg_catalog.btrim(p_name),p_starts_at,p_ends_at)
  returning id into created_id;
  return created_id;
end;
$$;

create function public.coordinator_create_subject(
  p_program_id uuid, p_name text, p_code text
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare own_institution uuid; created_id uuid;
begin
  own_institution := app_private.require_academic_coordinator();
  if p_name is null or pg_catalog.btrim(p_name)=''
    or pg_catalog.length(pg_catalog.btrim(p_name))>120
    or p_code is null or pg_catalog.btrim(p_code)=''
    or pg_catalog.length(pg_catalog.btrim(p_code))>40
    or not exists (
      select 1 from public.programs p join public.campuses c
        on c.id=p.campus_id and c.institution_id=p.institution_id
      where p.id=p_program_id and p.institution_id=own_institution
        and p.active and p.catalog_visible and c.active
    ) then
    raise exception 'Invalid subject context' using errcode='22023';
  end if;
  insert into public.subjects (institution_id,program_id,name,code)
  values (own_institution,p_program_id,pg_catalog.btrim(p_name),
    pg_catalog.btrim(p_code)) returning id into created_id;
  return created_id;
end;
$$;

create function public.coordinator_update_subject(
  p_subject_id uuid, p_name text, p_code text, p_active boolean
) returns void
language plpgsql security definer set search_path = ''
as $$
declare own_institution uuid;
begin
  own_institution := app_private.require_academic_coordinator();
  if p_name is null or pg_catalog.btrim(p_name)=''
    or pg_catalog.length(pg_catalog.btrim(p_name))>120
    or p_code is null or pg_catalog.btrim(p_code)=''
    or pg_catalog.length(pg_catalog.btrim(p_code))>40
    or p_active is null then
    raise exception 'Invalid subject' using errcode='22023';
  end if;
  update public.subjects s set name=pg_catalog.btrim(p_name),
    code=pg_catalog.btrim(p_code),active=p_active
  from public.programs p
  where s.id=p_subject_id and s.institution_id=own_institution
    and p.id=s.program_id and p.institution_id=own_institution
    and p.catalog_visible;
  if not found then
    raise exception 'Subject unavailable' using errcode='42501';
  end if;
end;
$$;

create function public.coordinator_create_group(
  p_subject_id uuid, p_period_id uuid, p_code text
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare own_institution uuid; created_id uuid;
begin
  own_institution := app_private.require_academic_coordinator();
  if p_code is null or pg_catalog.btrim(p_code)=''
    or pg_catalog.length(pg_catalog.btrim(p_code))>40
    or not exists (
      select 1 from public.subjects s join public.programs p
        on p.id=s.program_id and p.institution_id=s.institution_id
      join public.campuses c on c.id=p.campus_id
        and c.institution_id=p.institution_id
      where s.id=p_subject_id and s.institution_id=own_institution
        and s.active and p.active and p.catalog_visible and c.active
    ) or not exists (
      select 1 from public.academic_periods ap
      where ap.id=p_period_id and ap.institution_id=own_institution and ap.active
    ) then
    raise exception 'Invalid group context' using errcode='22023';
  end if;
  insert into public.groups (institution_id,subject_id,academic_period_id,code)
  values (own_institution,p_subject_id,p_period_id,pg_catalog.btrim(p_code))
  returning id into created_id;
  return created_id;
end;
$$;

create function public.coordinator_set_group_active(
  p_group_id uuid, p_active boolean
) returns void
language plpgsql security definer set search_path = ''
as $$
declare own_institution uuid;
begin
  own_institution := app_private.require_academic_coordinator();
  if p_active is null then
    raise exception 'Invalid group state' using errcode='22023';
  end if;
  update public.groups g set active=p_active
  from public.subjects s join public.programs p on p.id=s.program_id
  where g.id=p_group_id and g.institution_id=own_institution
    and s.id=g.subject_id and s.institution_id=own_institution
    and p.institution_id=own_institution and p.catalog_visible;
  if not found then
    raise exception 'Group unavailable' using errcode='42501';
  end if;
end;
$$;

create function public.coordinator_assign_teacher(
  p_group_id uuid, p_teacher_id uuid
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare own_institution uuid; period_id uuid; created_id uuid;
begin
  own_institution := app_private.require_academic_coordinator();
  select g.academic_period_id into period_id
  from public.groups g join public.subjects s on s.id=g.subject_id
  join public.programs p on p.id=s.program_id
  join public.academic_periods ap on ap.id=g.academic_period_id
  where g.id=p_group_id and g.institution_id=own_institution
    and g.active and s.active and p.active and p.catalog_visible and ap.active;
  if period_id is null or not exists (
    select 1 from public.profiles profile
    join public.user_roles ur on ur.profile_id=profile.id
      and ur.institution_id=profile.institution_id
    join public.roles r on r.id=ur.role_id and r.code='teacher'
    where profile.id=p_teacher_id and profile.institution_id=own_institution
      and profile.status='active'
  ) then
    raise exception 'Invalid teaching assignment' using errcode='22023';
  end if;
  insert into public.teaching_assignments
    (institution_id,teacher_id,group_id,academic_period_id)
  values (own_institution,p_teacher_id,p_group_id,period_id)
  returning id into created_id;
  return created_id;
end;
$$;

create function public.coordinator_enroll_student(
  p_group_id uuid, p_student_id uuid
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare own_institution uuid; period_id uuid; created_id uuid;
begin
  own_institution := app_private.require_academic_coordinator();
  select g.academic_period_id into period_id
  from public.groups g join public.subjects s on s.id=g.subject_id
  join public.programs p on p.id=s.program_id
  join public.academic_periods ap on ap.id=g.academic_period_id
  where g.id=p_group_id and g.institution_id=own_institution
    and g.active and s.active and p.active and p.catalog_visible and ap.active;
  if period_id is null or not exists (
    select 1 from public.profiles profile
    join public.user_roles ur on ur.profile_id=profile.id
      and ur.institution_id=profile.institution_id
    join public.roles r on r.id=ur.role_id and r.code='student'
    where profile.id=p_student_id and profile.institution_id=own_institution
      and profile.status='active'
  ) then
    raise exception 'Invalid enrollment' using errcode='22023';
  end if;
  insert into public.student_enrollments
    (institution_id,student_id,group_id,academic_period_id)
  values (own_institution,p_student_id,p_group_id,period_id)
  returning id into created_id;
  return created_id;
end;
$$;

revoke all on function public.coordinator_academic_snapshot() from public,anon,authenticated;
revoke all on function public.coordinator_create_period(text,timestamptz,timestamptz) from public,anon,authenticated;
revoke all on function public.coordinator_create_subject(uuid,text,text) from public,anon,authenticated;
revoke all on function public.coordinator_update_subject(uuid,text,text,boolean) from public,anon,authenticated;
revoke all on function public.coordinator_create_group(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.coordinator_set_group_active(uuid,boolean) from public,anon,authenticated;
revoke all on function public.coordinator_assign_teacher(uuid,uuid) from public,anon,authenticated;
revoke all on function public.coordinator_enroll_student(uuid,uuid) from public,anon,authenticated;
grant execute on function public.coordinator_academic_snapshot() to authenticated;
grant execute on function public.coordinator_create_period(text,timestamptz,timestamptz) to authenticated;
grant execute on function public.coordinator_create_subject(uuid,text,text) to authenticated;
grant execute on function public.coordinator_update_subject(uuid,text,text,boolean) to authenticated;
grant execute on function public.coordinator_create_group(uuid,uuid,text) to authenticated;
grant execute on function public.coordinator_set_group_active(uuid,boolean) to authenticated;
grant execute on function public.coordinator_assign_teacher(uuid,uuid) to authenticated;
grant execute on function public.coordinator_enroll_student(uuid,uuid) to authenticated;



-- Show requested campus to institutional reviewers without exposing another tenant.
drop function public.institutional_pending_registration_requests();
create function public.institutional_pending_registration_requests()
returns table (
  request_id uuid, full_name text, institutional_email text,
  institution_name text, requested_role text, campus_name text,
  program_name text, subject_names text[],
  status public.registration_request_status
)
language sql stable security definer
set search_path = ''
as $$
  with actor as (
    select app_private.current_institution_id() as institution_id,
      case
        when app_private.has_active_role('admin') then 'admin'
        when app_private.has_active_role('coordinator') then 'coordinator'
      end as role_code
    where (select auth.uid()) is not null
  )
  select r.id, p.full_name, p.institutional_email, i.name,
    r.requested_role, campus.name, program.name,
    coalesce(pg_catalog.array_agg(s.name order by s.name)
      filter (where s.name is not null), array[]::text[]),
    r.status
  from actor
  join public.registration_requests r
    on r.institution_id = actor.institution_id and r.status = 'pending'
    and ((actor.role_code = 'admin' and r.requested_role = 'coordinator')
      or (actor.role_code = 'coordinator'
        and r.requested_role in ('student', 'teacher')))
  join public.profiles p on p.id = r.profile_id and p.status = 'pending'
  join public.institutions i on i.id = r.institution_id
  left join public.campuses campus on campus.id = r.campus_id
  left join public.programs program on program.id = r.program_id
  left join public.registration_request_subjects rs on rs.request_id = r.id
  left join public.subjects s on s.id = rs.subject_id
  group by r.id, p.id, i.id, campus.id, program.id
  order by r.created_at, r.id
$$;
revoke all on function public.institutional_pending_registration_requests()
  from public, anon, authenticated;
grant execute on function public.institutional_pending_registration_requests()
  to authenticated;

-- Existing requests without a campus remain valid historical/QA records.
-- New campus-scoped academic requests cannot be approved after their campus,
-- career, or selected subjects have become incompatible.
create function app_private.validate_academic_request_approval()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.status='approved' and old.status='pending'
    and new.requested_role in ('student','teacher')
    and new.campus_id is not null then
    if not exists (
      select 1 from public.campuses c
      where c.id=new.campus_id and c.institution_id=new.institution_id and c.active
    ) or (new.requested_role='student' and not exists (
      select 1 from public.programs p
      where p.id=new.program_id and p.institution_id=new.institution_id
        and p.campus_id=new.campus_id and p.active and p.catalog_visible
    )) or exists (
      select 1 from public.registration_request_subjects rs
      join public.subjects s on s.id=rs.subject_id
      left join public.programs p on p.id=s.program_id
      where rs.request_id=new.id
        and (s.institution_id<>new.institution_id or not s.active
          or p.id is null or p.institution_id<>new.institution_id
          or p.campus_id<>new.campus_id or not p.active or not p.catalog_visible
          or (new.requested_role='student' and p.id<>new.program_id))
    ) then
      raise exception 'Academic request is no longer valid' using errcode='22023';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function app_private.validate_academic_request_approval()
  from public, anon, authenticated;
create trigger registration_requests_validate_academic_approval
before update of status on public.registration_requests
for each row execute function app_private.validate_academic_request_approval();

-- Registration requests remain onboarding evidence. Subsequent teaching
-- assignments and enrollments are authorized by coordinator RPCs, active
-- institutional roles, academic relationships, FKs, RLS, and UNIQUE constraints.
