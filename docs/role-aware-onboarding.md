# Registro por rol y onboarding institucional (PR #16)

El registro público acepta únicamente solicitudes `student` o `teacher`. La selección es una intención académica, no un rol autorizado. El trigger de `auth.users` crea `profiles.status = pending` y una fila en `registration_requests`; guarda cada materia en `registration_request_subjects`. No inserta `user_roles`, `student_enrollments` ni `teaching_assignments` para estas solicitudes.

## Estudiante

El formulario pide institución, nombre, correo, número de cuenta, un programa activo de `public.programs` y una o varias materias activas de `public.subjects` compatibles con el programa. Después solicita contraseña, confirmación, términos y Turnstile. El cliente filtra las opciones para facilitar la selección; el trigger vuelve a validar institución, programa y cada materia. Tras confirmar el correo, la cuenta permanece pendiente. Un administrador activo de esa institución puede aprobarla, lo que asigna `student` y activa el perfil. Las materias solicitadas siguen siendo referencias para verificación: la institución debe elegir grupos reales y crear las filas de `student_enrollments` por separado.

## Docente

El formulario pide institución, nombre, correo, número de empleado y una o varias materias activas de esa institución, además de contraseña, términos y Turnstile. El trigger guarda la solicitud sin otorgar `teacher`. Tras confirmar el correo, un administrador activo de la misma institución puede aprobar la solicitud; la RPC asigna `teacher` y activa el perfil. La institución debe decidir los grupos y periodos reales mediante `teaching_assignments`. Aprobar no crea asignaciones ficticias.

## Modelo y autorización

`registration_requests` almacena perfil, institución, tipo solicitado, programa opcional, estado `pending | approved | rejected`, decisión y timestamps. `registration_request_subjects` es la relación N:M normalizada. Las claves foráneas compuestas impiden mezclar programas o materias de otra institución. El trigger comprueba además que el programa y las materias estén activos y que las materias estudiantiles correspondan al programa elegido (o sean comunes, con `program_id IS NULL`).

Las nuevas solicitudes explícitas no tienen ningún rol hasta la aprobación. `profiles.status = pending` bloquea las rutas y RPC académicas. Los campos de solicitud en `raw_user_meta_data` son un transporte no confiable durante signup y se eliminan al guardar las filas normalizadas; editar metadata después no cambia tablas autorizativas. El trigger rechaza `requested_role` distinto de `student` o `teacher`, incluidos `admin`, `hr` y `coordinator`. La RPC de decisión exige `admin` activo obtenido de tablas de la base, verifica la misma institución, correo confirmado y vigencia de la solicitud académica. Solo ella escribe rol y estado. El cliente no tiene permisos de escritura sobre las tablas de solicitudes ni roles. La consulta administrativa también exige `admin` activo y solo devuelve la institución propia. RLS sigue vigente; las políticas públicas de `programs` y `subjects` muestran únicamente catálogos activos al visitante anónimo.

Para compatibilidad, altas antiguas sin `requested_role` conservan la ruta previa: perfil pendiente con rol `student` provisional, sin `registration_requests`. Ese rol no da acceso mientras el perfil esté pendiente. No se migran ni alteran cuentas existentes. Las nuevas altas del formulario siempre envían `requested_role`.

**Materia ≠ grupo.** `subjects` identifica la materia; `groups` representa la oferta concreta en un periodo. Una docente puede impartir Bases de Datos en BD-01 y BD-02, Redes en RED-01 y RED-02 e Ingeniería de Software en IS-01. Cada vínculo docente/grupo/periodo vive en `teaching_assignments`; cada vínculo estudiante/grupo/periodo vive en `student_enrollments`. Ejemplo ilustrativo para Profesora Laura:

- Bases de Datos: BD-01 (32 alumnos) y BD-02 (28 alumnos).
- Redes: RED-01 (35 alumnos) y RED-02 (30 alumnos).
- Ingeniería de Software: IS-01 (24 alumnos).

La cantidad de alumnos se calcula contando inscripciones reales en `student_enrollments`, nunca se guarda como contador manual. Los valores del ejemplo no son datos del escenario QA.

## Operación pendiente

La pantalla administrativa resuelve el tipo de cuenta, pero no asigna grupos. Como siguiente paso, una interfaz institucional puede presentar grupos activos compatibles para que un administrador cree inscripciones o asignaciones mediante funciones autorizadas y comprobaciones de periodo. El catálogo QA local contiene actualmente un solo programa y una sola materia; las instituciones sin oferta académica cargada no pueden completar un registro nuevo hasta que la institución publique programas y materias reales.

La migración se puede aplicar de forma incremental con `supabase migration up --local`. No requiere `db reset` ni modifica evaluaciones, resultados agregados, informes PDF o el umbral de privacidad de cinco respuestas.