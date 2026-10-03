# Autorización RLS multiinstitución

La migración `20261002215313_multiinstitution_rls.sql` establece mínimo privilegio sobre las 16 tablas públicas. La migración `20261002223647_student_real_evaluations.sql` añade dos RPC y triggers de integridad. La quinta migración, `20261002233352_teacher_aggregated_results.sql`, añade tres RPC docentes de resultados agregados. Ninguna de las dos añade políticas RLS. La autorización se resuelve desde `auth.uid()`, `profiles`, `user_roles`, `roles` y relaciones académicas reales; ni metadata ni el estado del frontend conceden acceso. Cada administrador opera dentro de su institución.

## Lectura directa por rol

| Tabla | Anon | Student activo | Teacher activo | Coordinator activo | HR activo | Admin activo |
| --- | --- | --- | --- | --- | --- | --- |
| institutions | Activas para registro | Propia | Propia | Propia | Propia | Propia |
| profiles | — | Propio | Propio | Propio | Propio | Propio |
| roles | — | Catálogo | Catálogo | Catálogo | Catálogo | Catálogo |
| user_roles | — | Propios | Propios | Propios | Propios | Propios |
| campuses | — | — | — | Propios | — | Propios |
| academic_periods | — | Inscripciones propias | Asignaciones propias | Propios | Propios | Propios |
| programs | — | Materias inscritas | — | Propios | — | Propios |
| subjects | — | Inscritas | Impartidas | Propias | — | Propias |
| groups | — | Inscritos | Asignados | Propios | — | Propios |
| teaching_assignments | — | De grupos inscritos | Propias | Propias | — | Propias |
| student_enrollments | — | Propias | — | — | — | — |
| survey_templates | — | Ventana elegible activa | — | Propias o globales vinculadas | — | Propias o globales vinculadas |
| survey_questions | — | Activas de plantilla elegible | — | De plantilla visible | — | De plantilla visible |
| evaluation_windows | — | Activas con inscripción y asignación del periodo | — | Propias | — | Propias |
| evaluations | — | — | — | — | — | — |
| evaluation_answers | — | — | — | — | — | — |

Una cuenta `pending` puede iniciar sesión y consultar identidad, rol e institución propios para mostrar su estado, pero no obtiene catálogo académico ni puede enviar evaluaciones. Una cuenta inactiva, sin rol `student`, no inscrita o de otra institución tampoco puede usar la RPC del alumno. La asignación y activación institucional siguen siendo procesos administrativos separados del registro público.

## RPC del alumno

`public.my_student_evaluations()` no recibe identificador de alumno o institución: parte de `auth.uid()` y solo retorna materia, docente, grupo, periodo, plantilla, plazo, estado e ID de evaluación propio. `public.submit_evaluation(uuid, uuid, jsonb)` recibe asignación, ventana y 15 respuestas; la función privada determina el alumno desde Auth y valida toda la relación académica, ventana y cuestionario antes de escribir. Un UUID manual ajeno no amplía acceso. El cliente no tiene INSERT/UPDATE/DELETE directos y las respuestas son privadas aun para el alumno después del envío.

Las implementaciones privadas son `SECURITY DEFINER`, propiedad de `postgres`, `search_path = ''`, con objetos calificados. Solo `authenticated` recibe `EXECUTE`; `PUBLIC` y `anon` están revocados. Los wrappers del esquema `public` son `SECURITY INVOKER`. Los triggers de integridad también son privados y no ejecutables por clientes. Los permisos de ejecución no sustituyen la validación interna de rol, estado, institución y matrícula.

## RPC de resultados docentes

`public.teacher_assignment_results(uuid)`, `public.teacher_results_history()` y `public.teacher_period_breakdown(uuid)` son wrappers `SECURITY INVOKER` disponibles solo para `authenticated`. La función privada de asignaciones es `SECURITY DEFINER`, propiedad de `postgres`, con `search_path = ''`, comprobación de perfil activo y rol `teacher` en la propia institución, y `teacher_id` derivado exclusivamente de `auth.uid()`. Sus permisos `EXECUTE` se revocan de `PUBLIC` y `anon`; la función de identidad no es ejecutable por clientes. Un UUID ajeno no devuelve filas. Las otras funciones privadas operan solo sobre agregados ya filtrados y son `SECURITY INVOKER`.

La quinta migración no concede `SELECT` en `evaluations` ni `evaluation_answers`, ni añade políticas para estas tablas o `student_enrollments`. Las puntuaciones de asignación y los promedios por periodo requieren cinco evaluaciones completas de una misma asignación; el histórico se construye solo con agregados publicables. Los conteos de respuestas pueden incluir asignaciones aún no publicables, pero no sus calificaciones. El detalle de los límites del umbral está en `docs/teacher-results-flow.md`.

## Políticas y límites

Siguen existiendo las 15 políticas SELECT del Bloque 6, sin `USING (true)` general ni políticas de escritura cliente. Las funciones existentes `app_private.current_institution_id()`, `app_private.has_active_role(text)` y `app_private.my_evaluation_teachers()` preservan lectura restringida; el wrapper público de nombres docentes solo proyecta los asignados al alumno. `evaluations.student_id` sirve internamente para elegibilidad y RF03, pero ni la tabla ni respuestas individuales se exponen a docentes, coordinación, RRHH o administración. El futuro PR de resultados deberá usar únicamente agregados y defenderse de filtros que permitan reidentificar alumnos.

`supabase/tests/multiinstitution_rls.sql` cubre 66 casos de autorización del Bloque 6. `supabase/tests/student_real_evaluations.sql` añade los casos de escritura real y privacidad. `supabase/tests/teacher_real_results.sql` añade aislamiento y umbral de resultados docentes. Las dos suites nuevas cierran con `ROLLBACK`; el seed no contiene usuarios ficticios.
