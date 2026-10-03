# Autorización RLS multiinstitución

La migración `20261002215313_multiinstitution_rls.sql` establece mínimo privilegio sobre las 16 tablas públicas. La migración `20261002223647_student_real_evaluations.sql` añade dos RPC y triggers de integridad. La quinta migración, `20261002233352_teacher_aggregated_results.sql`, añade tres RPC docentes de resultados agregados. La sexta, `20261003035132_institutional_aggregated_dashboards.sql`, añade RPC institucionales de lectura. Ninguna añade políticas RLS. La autorización se resuelve desde `auth.uid()`, `profiles`, `user_roles`, `roles` y relaciones académicas reales; ni metadata ni el estado del frontend conceden acceso. Cada administrador opera dentro de su institución.

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

## RPC institucionales

`app_private.institutional_identity(text[])` comprueba sesión, perfil activo, rol autorizado en base de datos e institución propia. Las RPC institucionales son `SECURITY DEFINER`, propiedad de `postgres`, con `search_path = ''` y objetos calificados; los helpers privados no tienen `EXECUTE` para clientes. Las ocho RPC públicas solo conceden ejecución a `authenticated` y validan el rol dentro de la función. `institution_participation` y `institution_overview` permiten coordinator, HR o admin de la institución propia; el ranking y resumen de puntuación solo permiten coordinator o HR; `hr_teacher_metrics` solo HR; las RPC de usuarios y resumen administrativo solo admin. Filtros UUID de otra institución devuelven cero filas o métricas vacías, sin cambiar el alcance institucional.

La sexta migración no concede lectura directa a `evaluations`, `evaluation_answers` ni `student_enrollments`, no añade `USING (true)` y no crea escrituras administrativas. `admin_institution_users` puede devolver nombres y correos de **perfiles de la propia institución** al admin, pero ninguna RPC agregada devuelve identidad del alumno asociada a una evaluación. El ranking utiliza solo asignaciones con cinco evaluaciones completas. Véase `docs/institutional-dashboards-flow.md` para fórmulas y límites.

## Políticas y límites

Siguen existiendo las 15 políticas SELECT del Bloque 6, sin `USING (true)` general ni políticas de escritura cliente. Las funciones existentes `app_private.current_institution_id()`, `app_private.has_active_role(text)` y `app_private.my_evaluation_teachers()` preservan lectura restringida; el wrapper público de nombres docentes solo proyecta los asignados al alumno. `evaluations.student_id` sirve internamente para elegibilidad y RF03, pero ni la tabla ni respuestas individuales se exponen a docentes, coordinación, RRHH o administración.

`supabase/tests/multiinstitution_rls.sql` cubre 66 casos de autorización del Bloque 6. `supabase/tests/student_real_evaluations.sql` añade los casos de escritura real y privacidad. `supabase/tests/teacher_real_results.sql` añade aislamiento y umbral de resultados docentes. `supabase/tests/institutional_real_dashboards.sql` añade autorización institucional y cálculos. Las tres suites nuevas cierran con `ROLLBACK`; el seed no contiene usuarios ficticios.

## Analíticas institucionales del Bloque 10

La séptima migración añade seis RPC `SECURITY DEFINER`, propiedad de `postgres`, con `search_path = ''` y objetos calificados. Cada función llama a `app_private.institutional_identity` **antes** de calcular o devolver filas, incluso si un periodo no tiene datos. Solo `authenticated` recibe `EXECUTE`; `PUBLIC` y `anon` están revocados. `institution_analytics_overview`, `institution_analytics_trend` e `institution_analytics_comparison` permiten coordinator, HR y admin activos. `institution_analytics_breakdown`, `institution_question_analytics` e `institution_teacher_trends` permiten únicamente coordinator y HR. Los UUID filtrados nunca reemplazan la institución derivada de Auth.

Los resultados se basan en asignaciones con cinco evaluaciones completas de 15 respuestas válidas; no proyectan identidad del evaluador ni respuestas individuales. La migración no añade políticas RLS, `USING (true)`, permisos directos sobre tablas sensibles, índices ni escrituras administrativas. `supabase/tests/institutional_analytics.sql` comprueba aislamiento, umbral, roles y forma de las respuestas dentro de `BEGIN … ROLLBACK`. Véase `docs/institutional-analytics.md`.

## Descarga PDF del Bloque 11

El Bloque 11 no crea migración, RPC, política ni privilegio. Los informes se construyen solo después de consultar las RPC anteriores con la sesión del usuario. La descarga del docente usa `teacher_assignment_results` para su propia asignación; un UUID ajeno devuelve cero filas. Coordinación, RRHH y Administración usan únicamente las RPC que su rol permite en la institución obtenida por `auth.uid()`. Administración no recibe el desglose de reactivos ni ranking docente. Alumno y perfil `pending` no tienen acceso a los RPC de informes. El modelo PDF no incluye `student_id`, correos, respuestas ni IDs de evaluaciones individuales. Véase [pdf-reports.md](pdf-reports.md) para la matriz de reportes y límites.
