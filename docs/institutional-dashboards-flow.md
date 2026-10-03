# Dashboards institucionales reales (Bloque 9)

Las rutas `/coordinator`, `/hr`, `/admin` y `/institutions` consumen RPC de PostgreSQL. Cada función deriva `institution_id` de `auth.uid()`, exige perfil `active` y consulta `user_roles`/`roles` en base de datos. El cliente no envía el ID institucional como autoridad. Admin es institucional; no existe superadmin global. Un UUID de campus, programa, grupo o periodo ajeno produce un conjunto vacío dentro de la institución propia.

## RPC y permisos

`public.institutional_filter_options()` devuelve `scope`, `id`, `label`, `parent_id` y `period_id` del catálogo propio de campus, programas, grupos y periodos. `public.institution_participation(period,campus,program,group)` devuelve filas por `total`, `campus`, `program`, `group` y `period` con `expected`, `completed`, `pending`, `participation` y `students`. `public.institution_overview()` devuelve una fila de la propia institución con conteos de estructura, estudiantes, docentes, participación y promedio publicable. Estas tres RPC permiten coordinator, HR y admin activos.

`public.institution_teacher_ranking(period,campus,program,group)` devuelve solo docentes de la propia institución con resultados publicables: `teacher_id`, `teacher_name`, `average_score`, `response_count` y `assignment_count`. `public.institution_score_summary` devuelve promedio, respuestas y docentes publicables del mismo filtro. Ambas permiten solo coordinator o HR. `public.hr_teacher_metrics(period,campus)` añade `subject_count`, categoría, recomendación y máximo de materias; solo HR puede ejecutarla. `public.admin_institution_summary()` devuelve conteos por estado, rol y estructura. `public.admin_institution_users(search)` devuelve hasta 100 perfiles propios con nombre, correo, estado y roles; ambas son exclusivas de admin. El correo de esta lista administrativa no se relaciona con ninguna respuesta o evaluación.

Las funciones públicas y los dos helpers privados son `SECURITY DEFINER`, propiedad de `postgres`, con `search_path = ''` y objetos calificados. Se revocó `EXECUTE` de `PUBLIC` y `anon`; solo `authenticated` ejecuta las ocho RPC públicas. Los helpers privados no tienen permiso cliente. No se añadieron políticas RLS, SELECT sobre `evaluations` o `evaluation_answers`, ni escrituras administrativas.

## Métricas y filtros

Una evaluación esperada corresponde a una obligación única `(alumno, docente, materia, periodo)` derivada de matrícula y asignación en un periodo que tenga ventana de evaluación. Si hay matrículas duplicadas para esa combinación, se atribuye a un grupo canónico para no inflar totales. Una obligación está realizada si existe una evaluación completada de esa combinación; `pending = expected − completed` y `participation = completed / expected × 100`, con cero cuando no hay obligaciones. Los conteos se calculan en PostgreSQL. Campus y programa se derivan de la materia del grupo. Los periodos históricos permanecen separados y pueden compararse mediante el filtro.

El ranking, el resumen de puntuación y las categorías usan únicamente asignaciones con **al menos cinco evaluaciones completas de 15 reactivos**. El promedio institucional pondera el promedio de cada asignación publicable por su número de respuestas. Las asignaciones menores al umbral no contribuyen a ninguna calificación, aunque sus obligaciones sí forman parte de los conteos de participación. No se descargan respuestas individuales al navegador.

RRHH clasifica a partir del promedio ponderado **redondeado a un decimal**: 9.0–10.0 `Excelente` / `Altamente Recomendado` / hasta 4 materias; 8.0–8.9 `Bueno` / `Recomendado` / hasta 3; 7.0–7.9 `Suficiente` / `Requiere Mejora (Capacitación)` / hasta 2; 0.0–6.9 `No Suficiente` / `No Contratable` / 0. Las categorías son indicadores del proyecto, no decisiones laborales automáticas ni atributos persistidos del docente.

## Límites y verificación

Los filtros de participación muestran conteos de obligaciones incluso en grupos pequeños, pero nunca calificaciones bajo el umbral. Como en el Bloque 8, consultas repetidas de agregados vivos pueden permitir diferencias temporales al llegar respuestas nuevas; una futura publicación por cohortes cerradas o instantáneas congeladas reforzaría el anonimato. Los perfiles administrativos se limitan a 100 resultados por búsqueda. No se implementan altas, cambios de rol, PDF, talleres/laboratorios ni notificaciones.

`supabase/tests/institutional_real_dashboards.sql` usa dos instituciones y roles ficticios dentro de `BEGIN … ROLLBACK`. Prueba filtros, obligaciones esperadas, completadas y pendientes, cuatro categorías, ranking publicable, cuentas sin acceso y ausencia de identidad estudiantil en las respuestas agregadas. Tras `supabase db reset --local` se vuelven a ejecutar las suites de los Bloques 6, 7 y 8.
