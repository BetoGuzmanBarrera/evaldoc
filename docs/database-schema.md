# Esquema de base de datos de EvalDoc

Las primeras cuatro migraciones de `supabase/migrations` construyen 16 tablas públicas: `institutions`, `campuses`, `profiles`, `roles`, `user_roles`, `academic_periods`, `programs`, `subjects`, `groups`, `teaching_assignments`, `student_enrollments`, `survey_templates`, `survey_questions`, `evaluation_windows`, `evaluations` y `evaluation_answers`. La quinta añade agregados docentes y la sexta agregados institucionales, sin tablas nuevas. `supabase db reset --local` aplica las migraciones en orden y después `supabase/seed.sql`. El seed contiene siete instituciones, cinco roles y una plantilla global versionada; no crea usuarios, contraseñas ni datos académicos ficticios permanentes.

## Relaciones y periodos

Las relaciones académicas usan claves foráneas compuestas con `institution_id`. Grupo, asignación, inscripción, ventana y evaluación conservan su `academic_period_id`; un periodo nuevo crea registros nuevos y no sobrescribe resultados previos. `profiles.id` referencia `auth.users.id`. Cada perfil tiene una institución; `user_roles` admite varios roles del mismo perfil en esa institución. El docente y la materia se obtienen de `teaching_assignments → groups → subjects`, y la elegibilidad del alumno de `student_enrollments` en ese grupo y periodo.

`survey_templates` usa versiones positivas. La plantilla oficial global v1 del seed contiene 15 preguntas activas, obligatorias, tipo `scale`, con posiciones 1–15 y los textos autorizados en `supabase/seed.sql`. Para cambiar un cuestionario usado, se crea otra versión: los triggers `survey_templates_protect_history` y `survey_questions_protect_history` impiden alterar o borrar una versión con evaluaciones, e incluso añadirle preguntas. La ventana bloquea su institución, periodo y plantilla después de recibir una evaluación. `evaluation_windows_template_scope` exige que su plantilla sea global o de su propia institución, también cuando se actualiza una ventana.

`evaluation_answers.numeric_value` conserva el CHECK general 0–10 para plantillas futuras. El envío real del cuestionario v1 acepta solo 0, 2.5, 5, 7.5 y 10; esa regla se valida en la RPC. No se calculan promedios sobre 5.

## RF03 e integridad del envío

La obligación de la rúbrica `(alumno, docente, materia, ciclo)` se representa sin columnas redundantes: `student_id` de la evaluación, `teacher_id` de la asignación, `subject_id` del grupo y `academic_period_id`. El trigger `evaluations_prevent_duplicate_obligation` resuelve esa combinación, toma un advisory lock transaccional y rechaza otra evaluación para ella incluso si cambia el grupo o la ventana. `UNIQUE (student_id, teaching_assignment_id, academic_period_id)` añade una barrera declarativa para la misma asignación. Se conserva la restricción previa de alumno/asignación/ventana. Las dos protecciones operan en la base, no en React ni localStorage.

`public.submit_evaluation(assignment_id, window_id, answers)` es el único camino cliente para escribir una evaluación completa. Su función privada usa `auth.uid()`; verifica perfil y rol `student` activos, institución, inscripción, asignación del grupo, docente activo, periodo activo y vigente, ventana activa y abierta, y plantilla global o de la institución. Comprueba exactamente los 15 IDs únicos de preguntas activas, obligatorias y tipo escala de esa plantilla, con los cinco valores permitidos. Inserta la evaluación completada y las 15 respuestas en la misma transacción PostgreSQL; cualquier error revierte todo. El cliente no envía `student_id`.

`public.my_student_evaluations()` devuelve únicamente obligaciones académicas propias con materia, docente, grupo, periodo, plazo y estado. Para una misma combinación RF03 muestra una evaluación completada o una ventana pendiente preferentemente abierta, sin exponer `student_id` ni respuestas. La UI de alumno usa ese catálogo para dashboard, lista, elegibilidad, historial y confirmación tras envío. Las preguntas se leen con la política RLS existente únicamente si la plantilla corresponde a una ventana elegible.

## Privacidad y permisos

RLS permanece activa en las 16 tablas. Las migraciones de alumno, docente e institucional no agregan políticas ni permisos directos sobre `evaluations` o `evaluation_answers`. Docentes, coordinación, RRHH y administración no pueden consultar respuestas individuales ni la identidad del evaluador. Las funciones `SECURITY DEFINER` pertenecen a `postgres`, usan `search_path = ''` y objetos calificados; `EXECUTE` se revoca de `PUBLIC` y `anon`. Los wrappers de alumno y docente son `SECURITY INVOKER`; las RPC institucionales verifican el rol y la institución dentro de la función elevada. Las funciones trigger no son ejecutables por clientes. Los promedios se publican únicamente cuando una asignación reúne cinco evaluaciones completas; véanse `docs/teacher-results-flow.md` y `docs/institutional-dashboards-flow.md`.

## Reproducción

`supabase/tests/multiinstitution_rls.sql` cubre la autorización previa (66 comprobaciones). `supabase/tests/student_real_evaluations.sql` usa fixtures ficticios dentro de una transacción con `ROLLBACK`; cubre elegibilidad, manipulación de UUID, aislamiento A/B, plantilla/ventana, escala, atomicidad, duplicados y privacidad. `supabase/tests/teacher_real_results.sql` verifica agregación, umbral y aislamiento docente. `supabase/tests/institutional_real_dashboards.sql` verifica participación, ranking, categorías, filtros y aislamiento institucional. Ninguna suite deja fixtures. Los dashboards de alumno, docente, coordinación, RRHH y administración usan RPC reales.

## Ampliación del Bloque 10

La séptima migración, `20261003050927_institutional_analytics.sql`, añade seis RPC de analítica sin crear tablas, políticas o índices. Reutiliza las relaciones y periodos anteriores; ninguna migración previa se edita. `supabase/tests/institutional_analytics.sql` verifica fórmulas, tres periodos, los 15 reactivos, el umbral y el aislamiento, y termina en `ROLLBACK`. Véase `docs/institutional-analytics.md`.
