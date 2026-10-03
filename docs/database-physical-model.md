# Modelo físico PostgreSQL / Supabase

El DDL versionado consta de ocho migraciones. El esquema público final tiene 18 tablas, 130 columnas, tres enums (`evaluation_status`, `question_type`, `user_status`) y 17 políticas SELECT. RLS está habilitada en las 18 tablas. El [DER](database-er-diagram.md), [diccionario](data-dictionary.md) y [reproducción DDL](ddl-reproduction.md) complementan este resumen.

| Área | Tablas | Llaves y relaciones principales |
| --- | --- | --- |
| Tenencia e identidad | `institutions`, `campuses`, `profiles`, `roles`, `user_roles` | UUID como PK; `profiles.id → auth.users.id ON DELETE CASCADE`; perfiles y roles pertenecen a una institución; UNIQUE de rol por perfil/institución. |
| Estructura académica | `academic_periods`, `programs`, `subjects`, `groups`, `teaching_assignments`, `student_enrollments` | FK compuestas `(institution_id, id)` y `(institution_id, id, academic_period_id)` impiden mezclar instituciones/periodos. UNIQUE de docente/grupo/periodo y alumno/grupo/periodo. |
| Instalaciones | `facilities`, `program_facilities` | FK de instalación a institución y campus; PK de unión `(program_id, facility_id)`; triggers verifican misma institución y campus compatible incluso al mover entidades. |
| Encuesta | `survey_templates`, `survey_questions`, `evaluation_windows` | Plantilla versionada, pregunta única por posición, ventana vinculada a periodo y plantilla. Triggers protegen plantillas ya usadas. |
| Respuestas | `evaluations`, `evaluation_answers` | FK de evaluación a alumno, asignación y ventana compatibles; UNIQUE por alumno/asignación/periodo y alumno/asignación/ventana. Respuesta única por evaluación/pregunta. |

## Restricciones e índices destacados

- `academic_periods` y `evaluation_windows`: `starts_at < ends_at`. `evaluation_answers`: al menos un valor no vacío y `numeric_value` entre 0 y 10. La RPC de envío limita la plantilla oficial a los cinco puntos 0, 2.5, 5, 7.5, 10 y exactamente 15 respuestas.
- RF03: `evaluations_student_assignment_period_key` y trigger `evaluations_prevent_duplicate_obligation` comparan alumno, docente, materia y periodo incluso entre grupos o ventanas. La inserción de evaluación y respuestas se efectúa en una transacción.
- Instalaciones: índices únicos parciales por `(institution_id, campus_id, lower(name))` o `(institution_id, lower(name))` cuando el campus es nulo; evitan nombres duplicados por alcance. `program_facilities_facility_id_idx` cubre consultas inversas de su FK sin duplicar la PK.
- Índices de búsqueda previos: `(institution_id, id)` para FK compuestas, `(institution_id, code)` en campus/programas/materias, índices sobre `academic_period_id`, `group_id`, `teacher_id`, `question_id` y `survey_template_id` donde corresponde. Los índices creados por PK/UNIQUE son implícitos; no se crearon copias explícitas en el Bloque 14.
- `facilities.facility_type` es texto normalizado con CHECK, no un enum de negocio cerrado; los tres enums reales son los citados arriba.

## Normalización y alcance

Las entidades separan instituciones, sedes, carreras, materias, grupos, asignaciones, matrículas, plantillas y respuestas. La relación N:M entre carrera e instalación vive en `program_facilities`, sin repetir atributos de ninguna parte. Las versiones de plantilla y los periodos nuevos conservan históricos. En el **modelo lógico** los atributos no clave dependen de la clave de su entidad y no se almacenan agregados en las tablas de respuestas, por lo que sigue la 3FN.

El **modelo físico** repite `institution_id` y, en algunas relaciones, `academic_period_id` deliberadamente para permitir FK compuestas que impiden cruces de tenant y periodo. Por ello no se afirma que cada tabla física satisfaga una 3FN estricta en sentido formal; es una desnormalización controlada de integridad/seguridad. `facilities` conserva `institution_id` aun cuando tiene `campus_id`, para admitir instalaciones de alcance institucional y verificar el tenant con FK compuesta. Las métricas se calculan en RPC; no sobrescriben evaluaciones históricas.

La RLS protege la lectura directa de estructura según rol y tenant. `evaluations` y `evaluation_answers` no conceden lectura directa a los roles cliente. La nueva relación de instalaciones es de solo lectura para coordinadores/administradores activos de su institución; las escrituras quedan a un proceso administrativo futuro con revisión. Véase [RLS](rls-authorization.md).
