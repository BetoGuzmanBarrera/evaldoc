# Registro por rol y coordinación institucional (PR #16–17)

El coordinador es el responsable académico cotidiano de su institución: revisa solicitudes de estudiante y docente, sigue indicadores, aplica filtros y descarga reportes institucionales ya autorizados. Admin permanece como rol técnico para bootstrap, mantenimiento y aprobación de solicitudes de coordinación. No se elimina admin del esquema ni se amplían permisos de lectura de evaluaciones individuales.

## Solicitud pública

/register muestra las siete instituciones activas, tengan o no catálogo académico. La selección de Estudiante, Docente o Coordinador representa una solicitud, nunca un rol concedido desde el navegador. El formulario pide contraseña con la política vigente, confirmación, términos y Turnstile; Supabase Auth exige confirmar el correo. El trigger app_private.handle_new_evaldoc_user() crea un perfil pending y una fila de registration_requests, sin insertar user_roles para solicitudes explícitas.

- Estudiante: número de cuenta, programa activo y materias activas compatibles. Si no hay programa, no puede enviar la solicitud.
- Docente: número de empleado y materias activas de la institución. Si no hay materias, no puede enviar la solicitud.
- Coordinador: número de empleado, sin programa ni materias. El mensaje indica: «Tu institución deberá validar tu solicitud de coordinación». Puede solicitar cuenta aunque la institución aún no tenga oferta académica cargada.

registration_request_subjects guarda las materias solicitadas de estudiantes y docentes. El trigger vuelve a comprobar institución, programa, materias y tipo solicitado. Rechaza admin y hr como solicitudes públicas; para coordinador rechaza cualquier selección académica. raw_user_meta_data es transporte no confiable y el trigger elimina los campos de solicitud tras normalizarlos. Enviar role o roles, o editar metadata después, no otorga privilegios.

## Decisiones y aislamiento

Las RPC public.institutional_pending_registration_requests() y public.institutional_decide_registration_request(uuid, boolean) resuelven el rol activo desde PostgreSQL y usan la institución del perfil del actor. El coordinador puede aprobar o rechazar solo student/teacher de su institución; el admin técnico puede aprobar o rechazar solo coordinator de su institución. Nadie puede decidir su propia solicitud ni una de otra institución. Para aprobar se exige correo confirmado, perfil y solicitud pendientes, y vigencia del catálogo académico cuando corresponda.

Solo una aprobación válida inserta el rol solicitado desde public.roles y activa el perfil. Un rechazo deja el perfil inactivo y no concede rol. Los clientes no tienen escritura directa en registration_requests, registration_request_subjects, user_roles ni roles. Las RPC son SECURITY DEFINER propiedad de postgres, con search_path vacío, ejecución revocada a PUBLIC y anon, y concedida a authenticated; sus comprobaciones internas son la autorización real. La migración elimina las antiguas RPC admin de decisión para que no quede una ruta alternativa de aprobación académica. RLS permanece activa.

Aprobar una solicitud no crea student_enrollments ni teaching_assignments: materia y grupo son entidades distintas. La institución debe asignar grupos y periodos reales por su flujo autorizado. Para compatibilidad, altas antiguas sin requested_role conservan el perfil pendiente y el rol student provisional; ese estado no habilita acceso académico. No se migran ni alteran cuentas existentes.

## Recuperación de cuenta

La recuperación se realiza solo mediante el enlace enviado al correo por Supabase Auth. Ningún coordinador ni admin ve contraseñas, las restablece para otras personas o entrega contraseñas temporales. Véase [Auth, perfiles y roles](auth-workflow.md). La suite SQL de coordinación prueba solicitudes, decisiones, aislamiento y permisos dentro de BEGIN … ROLLBACK; las pruebas locales de Auth crean y eliminan exclusivamente sus propios usuarios temporales. No requieren db reset y preservan el escenario QA.
