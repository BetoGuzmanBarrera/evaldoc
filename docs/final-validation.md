# Validación final local — Bloque 14

**Alcance:** rama `chore/final-school-delivery`, proyecto Supabase local `evaldoc` (Auth 55421), Vite `http://localhost:5173/`. No se consultó ni modificó Supabase remoto; no se hizo commit, push ni PR. El precheck inicial encontró working tree limpio, origin `BetoGuzmanBarrera/evaldoc`, PR #13 integrado y siete migraciones previas. Esta entrega añade la octava migración.

## Pruebas ejecutadas

| Suite | Resultado |
| --- | ---: |
| SQL `multiinstitution_rls.sql` | 66/66 |
| SQL `student_real_evaluations.sql` | 30/30 |
| SQL `teacher_real_results.sql` | 32/32 |
| SQL `institutional_real_dashboards.sql` | 65/65 |
| SQL `institutional_analytics.sql` | 49/49 |
| `npm run test:pdf` | 20/20 |
| `npm run test:auth` | 15/15 |
| `npm run test:auth:local` | 15/15 |
| `npm run test:turnstile` | 4/4 |
| `npm run test:turnstile:local` con clave oficial de paso | 7/7 |
| `npm run test:turnstile:local` con clave oficial de fallo, `EVALDOC_EXPECT_CAPTCHA_REJECTION=1` | 1/1 |
| SQL nuevo `program_facilities.sql` | 27/27 |

**Regresión anterior: 304/304. Nueva funcionalidad: 27/27. Total único: 331/331.** Las suites SQL usan transacciones que terminan con `ROLLBACK`. La prueba local de Auth verificó confirmación por Mailpit, rechazo de contraseña débil, perfil `pending`, recuperación, cambio de contraseña y cierre de sesión. Turnstile rechazó solicitudes sin token; la clave oficial de fallo rechazó un challenge inválido. La secret local se restauró y Auth se reinició; la prueba de paso volvió a ejecutarse con 7/7. Los tests de PDF verificaron agregado, filtro, umbral, anonimato, 15 reactivos y paginación.

La suite nueva comprueba institución A/B, campus compatible, unicidad de enlaces/nombres, protección ante movimiento de programa/instalación, coordinador/admin activos, student/pending sin acceso, ausencia de escrituras cliente y permisos `EXECUTE` de triggers. El seed no inventa instalaciones; los ejemplos Centro de Cómputo, Laboratorio de Materiales y Cocina Experimental son **fixtures revertidos**.

## Reset y catálogo final

`npx.cmd supabase db reset --local` terminó con código 0 y aplicó las ocho migraciones y `supabase/seed.sql`. Consulta posterior al catálogo:

| Indicador | Valor |
| --- | ---: |
| Migraciones aplicadas | 8 |
| Tablas públicas | 18 |
| Tablas públicas con RLS | 18 |
| Políticas RLS | 17 |
| Políticas `USING (true)` inseguras | 0 |
| Instituciones | 7 |
| Roles | 5 |
| Plantillas | 1 |
| Reactivos oficiales | 15 |
| Instalaciones/enlaces permanentes | 0/0 |
| `auth.users`, `profiles`, `evaluations`, `evaluation_answers` | 0/0/0/0 |
| Grants de escritura cliente a instalaciones | 0 |
| Grants de SELECT cliente a evaluaciones/respuestas | 0 |

Los 15 textos y su orden 1–15 coinciden con la lista oficial autorizada. El reset eliminó la cuenta multirrol temporal creada solo para QA visual y los usuarios creados por las suites Auth. `profiles.id` sigue referenciando `auth.users.id ON DELETE CASCADE`; ninguna tabla de respuestas se expuso.

Se ejecutó además el comando documentado `supabase db dump --local --schema public,app_private` hacia un archivo temporal: produjo **18 `CREATE TABLE`, 39 definiciones de función, 17 `CREATE POLICY` y 18 habilitaciones RLS** (128,021 bytes). El archivo generado se borró; las migraciones siguen siendo la única fuente versionada de DDL.

## Seguridad y privacidad

El catálogo mostró las funciones `SECURITY DEFINER` con owner `postgres`, `search_path = ''` y sin `EXECUTE` para `PUBLIC`/`anon`. Las que aceptan `authenticated` validan internamente identidad, rol y tenant; triggers privados no son ejecutables por clientes. Las funciones nuevas de instalaciones son `SECURITY INVOKER` y su ejecución directa está revocada. No se añadieron políticas de evaluación ni `USING (true)`.

RF03 queda cubierto por UNIQUE alumno/asignación/periodo y trigger para alumno/docente/materia/periodo entre ventanas/grupos; el envío es atómico. La lectura docente, institucional y PDF usa agregados de asignaciones con al menos cinco evaluaciones completas de 15 reactivos. `student_id` sigue interno y no se proyecta en resultados. Las pruebas anteriores cubren aislamiento A/B y filtrado de UUID ajenos. El riesgo residual de diferencias temporales y cohortes pequeñas sigue documentado.

Se revisaron referencias de `service_role`, `SUPABASE_SERVICE`, `TURNSTILE_SECRET`, `password=`, `access_token`, `secret=` y JWT secret en archivos versionados sin imprimir valores. Las coincidencias son documentación, nombres de variables, código de recuperación o fixtures ficticios; no apareció una clave real versionada ni lógica cliente de elevación. Solo `.env.example` está versionado; `.env` y `.env.local` están ignorados. `src/` y migraciones no contienen `TODO`, `FIXME`, `console.log` ni `debugger`; tampoco se hallaron archivos temporales/backup en el árbol de fuente. Los datos mock conservados son la lista pública de instituciones, la vista previa ilustrativa de landing y la lista oficial de reactivos no usada por el flujo autenticado. El botón Google muestra explícitamente que esa opción pertenece a una versión futura; no inicia OAuth.

## Revisión de interfaz

El navegador local abrió `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/pending` y las ocho rutas privadas principales. Sin sesión, `/pending`, `/student`, `/student/evaluations`, `/teacher`, `/teacher/history`, `/coordinator`, `/hr`, `/admin` e `/institutions` redirigieron a `/login`. Con una cuenta **ficticia y temporal** de cinco roles se confirmaron los encabezados de las ocho vistas; el registro ficticio se eliminó en el reset final. La ruta `/reset-password` sin token mostró enlace inválido/expirado, como corresponde.

En viewports **375, 768 y 1440 px**, el ancho de documento de las rutas públicas y privadas inspeccionadas no superó el viewport. Se observó el drawer móvil y las pantallas vacías sin datos académicos; no se reprodujo en esta pasada visual la encuesta con matrícula real ni un informe con datos. Los tests SQL y PDF cubren esos flujos y la revisión visual previa verificó PDFs de 3 y 5 páginas, encabezados, acentos, 15 reactivos y paginación. `tab.dev.logs` no reportó errores ni warnings para las rutas inspeccionadas. Los enlaces de sidebar aún no desarrollados son elementos deshabilitados, no destinos rotos.

## Build y límites

`npm run lint`: **0**, sin hallazgos. `npm run build`: **0** (se repitió con permiso de escritura de temporales del workspace tras un primer `EPERM` del sandbox, sin cambio de código). `git diff --check`: **0**. JS inicial: **602.21 kB / 170.03 kB gzip**; CSS **60.44 kB / 11.59 kB gzip**. Chunks bajo demanda de jsPDF: `jspdf.es.min` **399.03 kB / 129.60 kB gzip**; auxiliares `html2canvas` **199.48 kB**, `index.es` **151.41 kB**, `purify.es` **28.08 kB**. Persiste el aviso de Vite por superar 500 kB en el bundle inicial. Una división mayor de rutas/bibliotecas requeriría refactorización fuera de esta entrega; medir en producción antes de cambiarla.

No se efectuó carga, benchmark ni entrega de correo de producción. La revisión visual con usuario de QA usó vistas sin estructura académica permanente; por ello no demuestra aspecto final de gráficas con datos reales en las tres anchuras. El despliegue, SMTP, Turnstile real y la carga administrativa están [documentados](production-deployment.md), pendientes de autorización.
