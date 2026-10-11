-- PR 19: SQL boundary checks and permissions. The application helper is the
-- single production classification rule; no category is persisted in SQL.
begin;
create temp table classification_cases (score numeric, responses integer, expected text) on commit drop;
insert into classification_cases values
  (10,5,'contratable'),(8.7,5,'contratable'),(8,5,'contratable'),
  (7.99,5,'intermedio'),(7.5,5,'intermedio'),(6,5,'intermedio'),
  (5.99,5,'no_contratable'),(5,5,'no_contratable'),(0,5,'no_contratable'),
  (8.7,4,'protected'),(7.5,4,'protected'),(5.5,4,'protected');

do $tests$
begin
  if exists (
    select 1 from classification_cases
    where (case when responses < 5 then 'protected'
      when score >= 8 and score <= 10 then 'contratable'
      when score >= 6 and score < 8 then 'intermedio'
      when score >= 0 and score < 6 then 'no_contratable'
      else 'unavailable' end) <> expected
  ) then raise exception 'PR 19 score boundary regression failed'; end if;

  if not has_function_privilege('authenticated', 'public.teacher_assignment_context(uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'public.teacher_assignment_context(uuid)', 'EXECUTE')
    or exists (
      select 1 from pg_proc p, aclexplode(p.proacl) acl
      where p.oid='public.teacher_assignment_context(uuid)'::regprocedure
        and acl.grantee=0 and acl.privilege_type='EXECUTE'
    )
  then raise exception 'PR 19 teacher context grants are invalid'; end if;

  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='teacher_assignment_context'
      and p.prosecdef and 'search_path=""' = any(p.proconfig)
  ) then raise exception 'PR 19 teacher context requires SECURITY DEFINER with empty search_path'; end if;
end;
$tests$;

select count(*) as classification_boundary_cases from classification_cases;
rollback;
