# Informe final del proyecto escolar EvalDoc

## 1. Portada / datos del proyecto

**Proyecto:** EvalDoc, evaluación docente multiinstitucional. **Versión de entrega:** Bloque 14, rama `chore/final-school-delivery`. **Repositorio:** `BetoGuzmanBarrera/evaldoc`. **Prototipo aprobado:** `design/evaldoc-prototype-1.pen` y PDF adjunto. Institución académica, materia, integrantes, asesor y fecha de entrega formal: **no constan en el repositorio** y deben completarse por el equipo antes de presentar el informe.

## 2. Resumen

Aplicación web con encuestas estudiantiles de 15 reactivos, escala 0–10, roles institucionales, resultados agregados y reportes PDF. Se ejecuta en localhost con Supabase. El modelo permite varias instituciones, campus, programas, periodos e instalaciones; los resultados históricos no se sobrescriben.

## 3. Introducción

La evaluación docente necesita capturar opiniones de alumnos de manera uniforme y ofrecer retroalimentación útil sin asociar públicamente una respuesta con su autor. EvalDoc separa el registro interno de la participación de los agregados que consultan docentes y autoridades.

## 4. Problemática

Una solución informal puede admitir evaluaciones repetidas, mezclar instituciones o periodos y divulgar identidad por respuestas individuales. El proyecto resuelve estos riesgos con identidad verificada, relaciones académicas, control transaccional de duplicados y permisos en la base.

## 5. Objetivo general

Implementar un prototipo funcional de evaluación docente, escalable a varias instituciones y verificable localmente, con acceso diferenciado y protección de la privacidad estudiantil.

## 6. Objetivos específicos

Registrar perfiles y roles; comprobar elegibilidad académica; recibir 15 respuestas oficiales por evaluación; impedir duplicados RF03; publicar solo agregados autorizados; mostrar tendencias e informes; documentar el modelo, pruebas y despliegue futuro.

## 7. Alcance

Incluye interfaz React para alumno, docente, coordinación, RRHH y administrador; Supabase Auth/PostgreSQL/RLS; correo de confirmación y recuperación en ambiente local; Turnstile; PDF y documentación. No incluye gestión UI completa de la estructura académica, despliegue real, pagos, IA ni aplicación móvil.

## 8. Requerimientos funcionales

Alumno autenticado y activo ve sus obligaciones y envía una encuesta por combinación alumno–docente–materia–periodo. Docente consulta sus resultados e histórico bajo umbral. Coordinación/RRHH/Admin consultan únicamente métricas permitidas en su institución. Se admiten múltiples instituciones, campus, carreras, materias, grupos, periodos y talleres asociados a carreras. Véase la [matriz de rúbrica](final-rubric-audit.md).

## 9. Requerimientos no funcionales

TypeScript estricto, diseño responsive, accesibilidad básica del formulario/captcha/drawer, aislamiento multiinstitución, mínimos privilegios, ausencia de secretos en el cliente, escala 0–10, pruebas automáticas y build reproducible. La privacidad de agregados tiene un umbral mínimo de cinco respuestas completas por asignación.

## 10. Metodología Scrum

El repositorio muestra 13 incrementos integrados mediante PR y revisión del prototipo, pero no conserva actas ni sprints fechados. Se usa un enfoque iterativo observable; no se atribuyen cargos o reuniones sin evidencia. [Registro de Scrum](scrum-delivery.md).

## 11. Arquitectura

React/Vite presenta la interfaz; `supabase-js` gestiona sesión y llama RPC; Supabase Auth mantiene usuarios; PostgreSQL contiene datos, RLS, triggers y funciones de autorización. jsPDF genera informes en navegador a partir de agregados autorizados. No se exponen credenciales de servidor.

## 12. Diseño UI/UX

El diseño aprobado define azul `#2563EB`, navy `#17365D`, tipografía Inter, fondo claro, tarjetas y navegación adaptable. Las imágenes de `design/reference/` y el archivo Pen/PDF son la evidencia visual de 13 pantallas iniciales. Las rutas finales amplían esa base con Auth, estados pending e históricos.

## 13. Base de datos

Ocho migraciones definen 18 tablas públicas y 17 políticas. La migración final incorpora instalaciones/talleres y su relación N:M con programas. El seed contiene siete instituciones de ejemplo, cinco roles y la plantilla oficial de 15 preguntas; no crea usuarios ni datos académicos ficticios. [Esquema](database-schema.md).

## 14. DER

El [DER Mermaid](database-er-diagram.md) muestra identidad, estructura académica, instalaciones, encuestas y respuestas. `auth.users` es externo al esquema público y se une 1:1 a `profiles`.

## 15. Modelo físico

UUID, FK compuestas, UNIQUE, CHECK, tres enums e índices soportan integridad. La separación de entidades sigue la intención de 3FN; `institution_id` y ciertos periodos se repiten físicamente para exigir pertenencia con FK compuestas, una desnormalización controlada que se declara expresamente en el [modelo físico](database-physical-model.md). El [diccionario](data-dictionary.md) enumera las 130 columnas.

## 16. Seguridad

La cuenta nueva solo recibe `student` y estado `pending`, sin elevación por metadata. Password fuerte, confirmación de correo y recuperación usan Supabase Auth. Las funciones elevadas inspeccionadas son propiedad de `postgres`, emplean `search_path = ''` y no conceden `EXECUTE` a `anon` ni `PUBLIC`; las RPC autorizadas a `authenticated` validan rol e institución internamente. [Autorización](rls-authorization.md).

## 17. RLS

RLS está activa en las 18 tablas. Hay 17 políticas SELECT; ninguna concede lectura directa a evaluaciones/respuestas. Las dos políticas nuevas de instalaciones permiten lectura solo a coordinación/admin activos de la institución. No hay escrituras cliente directas para esas tablas.

## 18. Multiinstitución

Las FK compuestas y la resolución de institución desde perfil/rol impiden mezclar tenant en matrículas, grupos, asignaciones, ventanas e instalaciones. Filtros enviados por cliente nunca reemplazan la institución derivada de Auth. Las pruebas SQL usan dos instituciones ficticias y revierten los datos.

## 19. Flujo de evaluación

La RPC verifica perfil activo, inscripción, docente/asignación, periodo y ventana vigentes, plantilla y exactamente 15 respuestas válidas. Guarda envío y respuestas en una transacción. UNIQUE y trigger cubren RF03 incluso entre ventanas y grupos. [Flujo detallado](student-evaluation-flow.md).

## 20. Anonimato

`student_id` se guarda solo para elegibilidad/integridad. Docentes y responsables reciben resultados por RPC agregadas, nunca respuestas individuales ni la identidad del evaluador. Cinco evaluaciones completas por asignación son requisito para publicar puntuaciones. El umbral no elimina inferencias por diferencias temporales; requiere una política adicional de publicación para uso real.

## 21. Analíticas

La plataforma presenta promedios, participación, dimensiones, preguntas, comparativos e históricos según permisos. Se calcula en escala 0–10 desde respuestas completas; las 15 preguntas tienen peso uniforme en el cálculo actual. No hay pesos configurables ni puntuaciones sobre cinco. [Fórmulas](institutional-analytics.md).

## 22. Reportes PDF

Docente e institucional descargan PDF generado en navegador desde RPC autorizadas. El modelo de informe no incluye nombres de alumnos, `student_id` ni respuestas crudas. La revisión visual previa verificó acentos, 15 reactivos y saltos de página; las pruebas automáticas comprueban privacidad y paginación. [Permisos y límites](pdf-reports.md).

## 23. Auth

Registro, login, cierre real de sesión, restauración al recargar, confirmación y reset se apoyan en Supabase Auth. El perfil académico permanece `pending` tras confirmar email; un proceso administrativo separado debe activarlo. [Seguridad de cuenta](account-security.md).

## 24. Turnstile

Los tres formularios públicos de Auth exigen token Turnstile que Supabase Auth valida en servidor. La site key es pública; la secret se mantiene solo en configuración Auth. Las claves locales de prueba no sirven para producción. [Configuración](turnstile-antibot.md).

## 25. Pruebas

Las suites SQL cubren RLS, evaluación, docente, institución, analíticas e instalaciones con transacciones reversibles. Las suites Node cubren Auth, recuperación, Turnstile y PDF. La [validación final](final-validation.md) registra comandos, conteos, reset, build y limitaciones de la inspección visual.

## 26. Resultados

El esquema local reproduce las ocho migraciones y el seed; la interfaz se puede abrir en localhost. Las pruebas y conteos finales se documentan en [validación](final-validation.md), sin confundir el seed de ejemplo con resultados académicos reales. No se han medido adopción ni rendimiento en producción.

## 27. Limitaciones

No hay despliegue, usuarios institucionales reales ni flujo UI para cargar campus/programas/matrículas/talleres. Un grupo pequeño y comparaciones temporales pueden facilitar inferencias. El peso de los reactivos es uniforme. La generación PDF depende de memoria del navegador. Algunas entradas de navegación no implementadas están deshabilitadas.

## 28. Trabajo futuro

Tras aprobación: aprovisionamiento administrativo, auditoría operacional, publicación por cohortes cerradas, configuración de pesos solo si la rúbrica académica lo exige, optimización del bundle inicial, staging con Turnstile y correo reales, backups y monitoreo. Ninguno se incluye como funcionalidad nueva en esta entrega.

## 29. Conclusiones

EvalDoc satisface el flujo evaluativo y el modelo escolar comprobables en local, con aislamiento y resultados agregados. La nueva relación carrera–instalación cierra el faltante identificado de la rúbrica sin ampliar la UI. La operación con datos reales queda condicionada al runbook, a decisiones institucionales de privacidad y a una revisión humana de esta rama antes de cualquier commit o despliegue.
