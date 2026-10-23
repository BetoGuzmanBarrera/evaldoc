-- PR #23: read-only catalog and QA regression, enclosed in a rollback.
begin;
do $tests$
begin
 if (select count(*) from public.institutions where active)<>7
   or (select count(*) from public.campuses where active)<>21
   or (select count(*) from public.programs where active and catalog_visible)<>63
 then raise exception 'PR23 institution/campus/program counts changed'; end if;
 if (select count(*) from public.subjects where code ~
   '^(IPN|UNAM|UVM|TEC|UAM|IBERO|ANAHUAC)-C[1-3]-P[1-3]-M[1-3]$')<>189
 then raise exception 'PR23 imported subject count is not 189'; end if;
 if (select count(*) from public.subjects)<>191
 then raise exception 'PR23 existing QA subjects were changed'; end if;
 if exists (
   select 1 from public.programs p
   left join public.subjects s on s.program_id=p.id and s.institution_id=p.institution_id
     and s.active and s.code ~
       '^(IPN|UNAM|UVM|TEC|UAM|IBERO|ANAHUAC)-C[1-3]-P[1-3]-M[1-3]$'
   where p.active and p.catalog_visible
   group by p.id having count(s.id)<>3
 ) then raise exception 'PR23 a public program does not have 3 imported subjects'; end if;
 if exists (
   select 1 from public.campuses c
   join public.programs p on p.campus_id=c.id and p.active and p.catalog_visible
   join public.subjects s on s.program_id=p.id and s.active and s.code ~
     '^(IPN|UNAM|UVM|TEC|UAM|IBERO|ANAHUAC)-C[1-3]-P[1-3]-M[1-3]$'
   where c.active
   group by c.id having count(*)<>9
 ) then raise exception 'PR23 a campus does not have 9 imported subjects'; end if;
 if exists (
   select 1 from public.institutions i
   join public.subjects s on s.institution_id=i.id and s.code ~
     '^(IPN|UNAM|UVM|TEC|UAM|IBERO|ANAHUAC)-C[1-3]-P[1-3]-M[1-3]$'
   where i.active
   group by i.id having count(*)<>27
 ) then raise exception 'PR23 an institution does not have 27 imported subjects'; end if;
 if exists (
   select 1 from public.subjects s
   join public.programs p on p.id=s.program_id
   join public.campuses c on c.id=p.campus_id
   where s.institution_id<>p.institution_id
      or p.institution_id<>c.institution_id
 ) then raise exception 'PR23 cross-institution subject relationship'; end if;
 if exists (
   select 1 from public.subjects
   group by institution_id,code having count(*)>1
 ) or exists (
   select 1 from public.subjects
   group by program_id,lower(name) having count(*)>1
 ) then raise exception 'PR23 duplicate code or program/name'; end if;
 if not exists (select 1 from public.subjects where code='QA-BIOT-101' and active)
   or not exists (select 1 from public.subjects where code='QA-BD01' and active)
   or not exists (select 1 from public.programs where code='QA-ISC'
       and not catalog_visible)
 then raise exception 'PR23 QA subject/program changed'; end if;
 if (select count(*) from public.evaluations)<>5
   or (select count(*) from public.evaluation_answers)<>75
   or (select round(avg(numeric_value),1) from public.evaluation_answers)<>8.7
 then raise exception 'PR23 Laura evaluation scenario changed'; end if;
 if not exists (
   select 1 from pg_class r join pg_namespace n on n.oid=r.relnamespace
   where n.nspname='public' and r.relname='subjects' and r.relrowsecurity
 ) then raise exception 'PR23 subjects RLS disabled'; end if;
end
$tests$;
select 'PR23 catalog, isolation, QA and RLS passed' as result;
rollback;