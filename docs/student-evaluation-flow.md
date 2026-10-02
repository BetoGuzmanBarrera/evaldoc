# Flujo de evaluación del alumno

1. El alumno inicia sesión. `RequireRole` exige rol visual `student`; RLS y las RPC comprueban de nuevo el rol y estado en PostgreSQL.
2. `/student` y `/student/evaluations` consultan `my_student_evaluations()`. El catálogo devuelve una obligación por docente, materia y periodo, con estado pendiente o completado. No carga respuestas individuales.
3. La página de encuesta busca el ID de ruta solo entre las obligaciones del alumno y carga las 15 preguntas de la plantilla elegible mediante RLS. Si no existe, está cerrada o el cuestionario no está disponible, no muestra el formulario.
4. El alumno elige 0, 2.5, 5, 7.5 o 10 para cada reactivo. El botón final abre el modal existente. Mientras la RPC responde se bloquea un segundo clic.
5. `submit_evaluation` vuelve a validar en base identidad, rol, institución, matrícula, docente, periodo, ventana, plantilla, preguntas y escala. Evalúa y guarda evaluación más 15 respuestas de forma atómica. La base rechaza un segundo envío de la misma obligación RF03 aun con otra ventana o grupo.
6. Solo tras la respuesta exitosa de la RPC se navega a `/success`. Esa página vuelve a consultar el catálogo y presenta éxito únicamente si la evaluación figura como completada. La lista e historial muestran materia, docente, periodo, estado y fecha de envío, nunca respuestas individuales.

Los 15 rótulos del seed provienen de la lista oficial autorizada por el usuario de `Proyecto_DYGS_Revision2.pdf`; no son preguntas inventadas. La escala oficial es 0 Muy Deficiente, 2.5 Deficiente, 5 Regular, 7.5 Bueno y 10 Excelente. Una nueva versión de plantilla debe usar filas nuevas: las versiones ya contestadas permanecen inmutables.

El seed instala catálogo, plantilla y preguntas, pero ninguna matrícula ni usuario real. Para probar visualmente un envío local se requieren usuarios y datos académicos de prueba que luego se eliminen; la suite SQL crea esos fixtures en una transacción con `ROLLBACK`. `npx.cmd supabase db reset --local` reconstruye la base limpia. No se conecta Supabase remoto. Los resultados de docentes y analíticas agregadas quedan para el siguiente bloque.
