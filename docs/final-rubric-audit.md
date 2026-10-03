# Auditoría final contra la rúbrica

Estado verificado en la rama `chore/final-school-delivery`. **Cumplido con implementación equivalente** significa que la conducta solicitada existe, aunque la forma física no sea idéntica al ejemplo de la rúbrica. Los resultados de ejecución final se registran en [final-validation.md](final-validation.md).

| Requisito | Implementación | Archivo/tabla | Estado | Evidencia |
| --- | --- | --- | --- | --- |
| DER adaptable a cualquier institución | Institución raíz con relaciones académicas por tenant; DER Mermaid | [DER](database-er-diagram.md), `institutions` | Cumplido | 18 entidades y vínculos documentados |
| Múltiples campus | Campus ligado a institución, programas y facilities de campus opcional | `campuses`, `programs`, `facilities` | Cumplido | FK compuestas de institución/campus |
| Carreras/programas | Catálogo de programas por institución/campus | `programs` | Cumplido | PK y UNIQUE institucionales |
| Materias | Materias del programa y grupos de periodo | `subjects`, `groups` | Cumplido | FK compuestas y RLS |
| Ciclos y conservación histórica | Periodos/ventanas independientes, plantilla versionada | `academic_periods`, `evaluation_windows`, `survey_templates` | Cumplido | Triggers impiden modificar plantillas usadas |
| Modelo físico PostgreSQL en 3FN | Entidades separadas y unión N:M; columnas tenant/periodo repetidas para FK de seguridad | [Modelo físico](database-physical-model.md), migraciones | Cumplido con implementación equivalente | Se documenta la desnormalización física controlada; no se afirma 3FN estricta universal |
| RF03 alumno + docente + materia + ciclo | UNIQUE alumno/asignación/periodo y trigger que resuelve docente/materia incluso entre ventanas/grupos | `evaluations_student_assignment_period_key`, `app_private.prevent_duplicate_obligation()` | Cumplido con implementación equivalente | Suite `student_real_evaluations.sql` |
| 15 reactivos oficiales | Plantilla global v1 con 15 textos, posiciones y escala 0/2.5/5/7.5/10 | `supabase/seed.sql`, `survey_questions` | Cumplido | Conteo seed y RPC `submit_evaluation` |
| Reactivos ponderados | Promedio aritmético de 15 reactivos con peso igual de 1/15; no hay pesos configurables | RPC de agregación | Cumplido con implementación equivalente | Fórmulas documentadas en [analíticas](institutional-analytics.md); si se exige peso desigual, queda pendiente |
| Instalaciones/talleres por carrera | Catálogo y relación N:M mínima | `facilities`, `program_facilities` | Cumplido | Migración 8 y 27 pruebas transaccionales |
| Diccionario de datos | 130 columnas de 18 tablas desde catálogo real | [Diccionario](data-dictionary.md) | Cumplido | Tabla, campo, tipo, nulabilidad, restricciones y descripción |
| Script DDL | Ocho migraciones reproducibles y comando de dump local | [Reproducción](ddl-reproduction.md) | Cumplido con implementación equivalente | No se duplica SQL generado como segunda fuente |
| RLS y multiinstitución | 18 tablas con RLS; 17 políticas; RPC comprueban rol/tenant | `supabase/migrations/`, [RLS](rls-authorization.md) | Cumplido | SQL de autorización y consulta de catálogo |
| Registro, login y recuperación | Supabase Auth, confirmación de correo, contraseña fuerte, reset y pending | `src/auth/`, `src/pages/public/`, `supabase/config.toml` | Cumplido | Suites Auth; [flujo](account-security.md) |
| Protección antiabuso | Turnstile en registro, login y recuperación, validado por Auth | `src/components/security/TurnstileWidget.tsx`, config | Cumplido | Suites Turnstile; [documento](turnstile-antibot.md) |
| Roles institucionales | Alumno, docente, coordinación, RRHH, admin, obtenidos de BD | `roles`, `user_roles`, `RequireRole.tsx` | Cumplido | RLS y suites SQL multirol |
| Evaluación real y anonimato | Envío atómico; lectura agregada con umbral de 5 por asignación | `evaluations`, `evaluation_answers`, RPC docentes/institucionales | Cumplido | Suites SQL de alumno, docente e institucional |
| Dashboards, histórico y PDF | Vistas por rol, tendencias reales y descarga de agregados | `src/pages/`, `src/lib/`, `src/lib/renderPdfReport.ts` | Cumplido | Suites analíticas/PDF y revisión visual previa |
| Responsive | Drawer móvil, tarjetas y filtros adaptativos | `src/styles/`, `design/reference/` | Cumplido con limitación | Comprobación de 375/768/1440 en [validación](final-validation.md); accesos privados requieren cuenta de prueba activa |
| Despliegue en producción | Runbook y variables, sin infraestructura remota creada | [Producción](production-deployment.md) | Pendiente | Requiere credenciales y autorización explícita |
| Gestión UI de instalaciones | Solo modelo/consulta autorizada, sin CRUD administrativo | Migración 8 | No aplica | La rúbrica pide el modelo; no se amplió el alcance a un módulo nuevo |

Las siete instituciones del seed son un catálogo de demostración. No prueban integración ni afiliación con esas instituciones. No hay usuarios académicos permanentes ni instalaciones ficticias en el seed.
