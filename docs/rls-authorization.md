# Autorización RLS multiinstitución

La migración 20261002215313_multiinstitution_rls.sql aplica mínimo privilegio a las 16 tablas públicas sin alterar migraciones previas. La autorización proviene de auth.uid(), profiles, user_roles, roles y relaciones académicas reales. Metadata, parámetros del cliente y la prioridad visual de roles no conceden acceso. Admin administra solo su institución: no existe superadmin global.

## Lectura por rol

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

El estudiante obtiene nombres mínimos de docentes mediante public.my_evaluation_teachers(): solo teaching_assignment_id, teacher_id y teacher_name de sus grupos inscritos, con docentes activos y rol teacher. No se abren perfiles arbitrarios. Coordinación y administración aún no leen perfiles de terceros ni inscripciones. HR ve su institución, identidad propia, catálogo de roles y periodos; sus métricas serán agregadas más adelante.

Una cuenta pending puede autenticarse y consultar su propia identidad, rol e institución para mostrar el estado, pero ninguna política académica la autoriza. Una cuenta inactive o activa sin rol tampoco obtiene datos académicos. El registro no comprueba afiliación institucional; la validación y activación administrativas seguras siguen pendientes.

## Barreras de base de datos

La migración revoca los privilegios de tabla heredados para PUBLIC, anon y authenticated, y solo concede SELECT a las superficies anteriores. No concede INSERT, UPDATE ni DELETE a clientes. Evaluations y evaluation_answers carecen incluso de SELECT y de políticas cliente: student_id y las respuestas individuales siguen internos. Los resultados de docentes, coordinación y RRHH deberán exponerse mediante agregaciones futuras con protección de anonimato.

Las políticas restringen la institución propia, directa o indirectamente. Las plantillas globales (institution_id nulo) solo se ven si una ventana elegible propia las utiliza. El catálogo anónimo de instituciones activas es la excepción necesaria para el registro; las sesiones autenticadas solo ven su institución.

Las funciones app_private.current_institution_id() y app_private.has_active_role(text) evitan recursión RLS. app_private.my_evaluation_teachers() aplica la proyección mínima. Las tres son SECURITY DEFINER, propiedad de postgres, con search_path vacío y referencias calificadas. No aceptan identificadores de usuario ni institución. EXECUTE está revocado a PUBLIC y anon y concedido a authenticated; el wrapper público de docentes es SECURITY INVOKER y solo puede ejecutarlo authenticated. El trigger de registro anterior conserva EXECUTE restringido. Las políticas envuelven llamadas constantes en SELECT para favorecer su evaluación por sentencia.

Las cuatro políticas del Bloque 5 se conservaron. Solo se modificó el destinatario de institutions_public_signup_read, de anon y authenticated a anon; el filtro de instituciones activas sigue igual. Ninguna política se eliminó. Se añadieron once políticas SELECT: institutions_authenticated_own_read, campuses_structure_read, academic_periods_role_read, programs_role_read, subjects_role_read, groups_role_read, teaching_assignments_role_read, student_enrollments_own_read, evaluation_windows_role_read, survey_templates_role_read y survey_questions_role_read. Total: 15. RLS sigue habilitada en las 16 tablas, sin políticas de escritura ni USING (true).

## Pruebas y límites

supabase/tests/multiinstitution_rls.sql crea usuarios y registros A/B ficticios en una transacción que termina con ROLLBACK. Prueba consultas permitidas y denegadas, pending, ausencia de rol, UUID de otra institución, escalada mediante profiles y user_roles y falta de lectura directa de evaluaciones y respuestas. No agrega cuentas al seed. Los índices existentes cubren los filtros de institución, usuario, grupo, periodo y relaciones empleados; no se añadieron índices.

El PR #7 debe implementar escrituras transaccionales seguras para evaluaciones y respuestas, validar inscripción, asignación, ventana, plantilla, pregunta, tipo y obligatoriedad, y exponer resultados agregados con umbrales de privacidad. También falta el proceso institucional de afiliación y activación y la asignación segura de roles privilegiados. Los dashboards siguen con mocks. El esquema todavía permite que una ventana referencie una plantilla de otra institución: ninguna política revela la plantilla, pero el flujo de escritura futuro debe impedir esa relación inválida. La clave service_role nunca llega al frontend.
