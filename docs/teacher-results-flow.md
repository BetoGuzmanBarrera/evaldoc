# Resultados reales del docente (Bloque 8)

Las páginas `/teacher`, `/teacher/results/:id` y `/teacher/history` consumen exclusivamente las RPC agregadas de la quinta migración. El navegador nunca descarga `evaluations`, `evaluation_answers`, `student_enrollments`, `student_id`, nombres ni identificadores de estudiantes. Tampoco calcula promedios a partir de respuestas individuales. Las páginas de coordinación, RRHH y administración usan sus propias RPC institucionales.

## Autorización y publicación

`app_private.current_teacher_identity()` obtiene el docente desde `auth.uid()` y comprueba perfil activo, rol `teacher` en base de datos y misma institución. La función privada `teacher_assignment_results(uuid)` une solamente asignaciones de ese docente e institución. Un UUID de otra asignación produce cero filas. La función es `SECURITY DEFINER`, propiedad de `postgres`, con `search_path = ''` y objetos calificados; su wrapper público es `SECURITY INVOKER`. `PUBLIC` y `anon` no tienen `EXECUTE`; solo `authenticated` ejecuta las RPC de resultados. La función de identidad no tiene `EXECUTE` para clientes. No se añadieron permisos directos ni políticas RLS sobre respuestas, evaluaciones o inscripciones.

Una respuesta cuenta solo si su evaluación está completada y contiene exactamente los 15 reactivos activos, obligatorios y de escala de una plantilla de 15 preguntas. El umbral de publicación es **5 evaluaciones completas por asignación**. Por debajo de cinco, la RPC devuelve conteo, pero `average_score` y `favorable_percent` son `NULL`, `question_scores` es `[]` y `published` es `false`. Si se mezclan versiones de plantilla, puede publicarse el promedio general cuando se alcance el umbral, pero se oculta el desglose por reactivo para evitar mezclar preguntas no equivalentes.

## Cálculos y columnas

El promedio de una evaluación es la media de sus 15 valores numéricos en escala **0–10**. El promedio de asignación es la media de esos promedios individuales, redondeada a dos decimales. El porcentaje favorable es la proporción de reactivos con puntuación 7.5 o 10, promediada por evaluación y multiplicada por 100. Cada promedio por reactivo es la media de ese reactivo entre evaluaciones completas de la asignación. PostgreSQL realiza todos estos cálculos.

`teacher_assignment_results(p_assignment_id)` devuelve `assignment_id`, `period_id`, `period_name`, `period_starts_at`, `subject_name`, `group_code`, `response_count`, `average_score`, `favorable_percent`, `question_scores` y `published`. El JSON de cada pregunta contiene solo `id`, `position`, `label` y `score`. `teacher_results_history()` devuelve `period_id`, `period_name`, `period_starts_at`, `response_count`, `published_responses`, `assignment_count`, `average_score` y `favorable_percent`. `teacher_period_breakdown(p_period_id)` devuelve `question_position`, `label`, `score` y `response_count`. Ninguna RPC devuelve IDs de evaluaciones o alumnos.

El histórico pondera los promedios de **asignaciones publicables** por su número de respuestas. Su conteo total sí incluye asignaciones aún protegidas, pero ninguna puntuación de ellas contribuye al promedio. Esto impide restar un promedio visible de periodo y uno visible de asignación para reconstruir la puntuación de un grupo pequeño. El desglose de periodo pondera solo asignaciones publicables de 15 preguntas. La UI compara periodos solo si ambos tienen promedio publicable y no inventa un mejor o peor reactivo cuando todos están empatados.

## Límites y pruebas

El umbral evita divulgar resultados de grupos de menos de cinco, pero los agregados se actualizan durante una ventana abierta. Consultas repetidas antes y después de una respuesta nueva podrían permitir diferencias temporales; una futura versión debería publicar cohortes cerradas o instantáneas congeladas si se exige resistencia formal a ese ataque. Los conteos visibles también revelan participación agregada. El Bloque 11 añade descarga de PDF del propio docente con estas RPC; véase [pdf-reports.md](pdf-reports.md).

`supabase/tests/teacher_real_results.sql` crea dos instituciones, varios docentes y estudiantes ficticios en una transacción con `ROLLBACK`. Verifica umbral, 15 preguntas, promedios, histórico, UUID ajeno, acceso por rol y ausencia de identidad en las RPC. Las suites previas de RLS y evaluación real se vuelven a ejecutar tras `supabase db reset --local`.
