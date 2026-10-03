# Reportes PDF de EvalDoc (Bloque 11)

La descarga se genera en el navegador al pulsar un botón; no existe almacenamiento de informes ni servicio de exportación. El cliente vuelve a pedir los agregados autorizados justo antes de crear el archivo. La identidad visual usa navy `#17365D`, azul `#2563EB`, tarjetas de indicadores, tablas alternadas, barras, encabezado y pie de privacidad en cada página. Los archivos A4 incluyen fecha local, institución, periodo, filtros, numeración y nombre saneado sin UUID.

## Informes y acceso

| Informe | Vista | RPC de origen |
| --- | --- | --- |
| Avance de evaluaciones | Coordinación, RRHH, Administración | `institution_participation` |
| Participación estudiantil | Coordinación, RRHH, Administración | `institution_participation` |
| Resultados por docente | Panel y detalle del propio docente | `teacher_assignment_results`, `teacher_results_history` |
| Comparativo histórico | Histórico docente y paneles institucionales | `teacher_results_history` o `institution_analytics_trend` |
| Ejecutivo institucional | Coordinación, RRHH, Administración | `institution_analytics_overview`, `institution_analytics_trend`; coordinación/RRHH también `institution_analytics_breakdown`, `institution_question_analytics`, `institution_teacher_ranking`; RRHH además `hr_teacher_metrics` |

Los filtros institucionales se resuelven mediante `institutional_filter_options()` y se vuelven a aplicar en PostgreSQL. El histórico incluye todos los periodos para permitir comparación; si hay uno seleccionado en pantalla, el PDF lo etiqueta como **periodo de referencia**, no como restricción de la serie. Los informes ejecutivos muestran un resumen filtrado y una tendencia de todos los periodos dentro de los demás filtros. Administración recibe únicamente los agregados generales permitidos por sus RPC: no hay desglose de reactivos ni ranking docente en su PDF.

El informe docente detallado pertenece al propio docente. No se añadió una RPC para descargar 15 reactivos de un docente ajeno desde coordinación/RRHH; sus informes ejecutivos solo muestran ranking y categorías publicables existentes. Tampoco se creó una migración. Una exportación institucional detallada por docente requeriría una RPC nueva, revisada con el mismo aislamiento y umbral.

## Privacidad y seguridad

Las RPC existentes verifican `auth.uid()`, perfil activo, rol de base de datos e institución. Un alumno, una cuenta pendiente o un docente ajeno no puede obtener los datos mediante el RPC aunque invoque la descarga manualmente desde la consola. Las 18 tablas finales mantienen RLS; no se usan claves privilegiadas, acceso directo a respuestas ni bypass. El PDF se compone solo de columnas agregadas previamente publicables. El modelo no admite `student_id`, nombres/correos estudiantiles, respuestas ni identificadores de evaluación. No se exportan tablas de usuarios de Administración.

El umbral permanece en **cinco evaluaciones completas de 15 reactivos por asignación**. Por debajo, el promedio, favorable y reactivos son protegidos. Si hay varias versiones de plantilla, no se mezcla el desglose. El histórico y los promedios institucionales se construyen con agregados publicables. Los conteos de participación siguen visibles conforme a las RPC previas. El informe de RRHH describe categorías del proyecto, sin automatizar decisiones laborales.

## Implementación y validación

`jspdf@4.2.1` es la única biblioteca de PDF añadida, con versión exacta en el lockfile. Se carga con `import('jspdf')` al generar un informe, fuera del bundle inicial. Tablas y barras se dibujan directamente para evitar otra dependencia y se paginan antes de cada fila. La tipografía PDF es Helvetica estándar para mantener compatibilidad y tamaño razonable; la interfaz sigue usando Inter. Nombres largos se ajustan en las celdas. Los botones muestran progreso, error y bloquean doble clic.

En la compilación de referencia anterior, el JS inicial era **576.21 kB (162.24 kB gzip)**. En esta rama queda en **589.43 kB (166.43 kB gzip)**: +13.22 kB (+4.19 kB gzip) por controles, modelos y orquestación. El chunk principal de jsPDF, cargado bajo demanda, mide **399.03 kB (129.60 kB gzip)**. Vite emite además chunks auxiliares de jsPDF (`index.es` 151.41 kB, `html2canvas` 199.48 kB y `purify.es` 28.08 kB); la ruta de dibujo directo no invoca la conversión HTML. Permanece la advertencia de Vite porque el bundle inicial supera 500 kB.

`npm run test:pdf` verifica estructura, filtros, umbral, privacidad del modelo, histórico, empates, nombre de archivo, MIME y paginación. Las cinco suites SQL de los Bloques 6–10 prueban las reglas de autorización de los RPC reutilizados (242 casos). La revisión visual se realiza con PDFs ficticios temporales y Poppler; se eliminan los archivos de prueba al terminar. No se introduce información mock en la descarga de producción.

Límites: la generación sucede en el navegador y puede consumir memoria para informes muy extensos. El aviso previo sobre inferencias por diferencias temporales entre agregados se mantiene; instantáneas de cohortes cerradas serán una mejora futura. No se incluye Excel en el alcance final.
