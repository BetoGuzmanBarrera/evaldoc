# EvalDoc · Prototipo 1, bloque alumno

Interfaz local basada en `design/evaldoc-prototype-1.pen`. Implementa la portada, el acceso y registro visuales, el panel del alumno y el flujo de evaluación docente.

## Ejecutar

```bash
npm install
npm run dev
```

Vite muestra la URL local al iniciar, normalmente `http://localhost:5173/`. Para verificar el código:

```bash
npm run lint
npm run build
```

## Rutas

| Ruta | Vista |
| --- | --- |
| `/` | Portada |
| `/login` | Inicio de sesión demo |
| `/register` | Registro demo |
| `/student` | Panel del alumno |
| `/student/evaluations` | Mis evaluaciones |
| `/student/evaluations/:id` | Encuesta de 15 preguntas |
| `/student/evaluations/:id/success` | Confirmación de envío |

El acceso y el registro llevan al panel demo sin crear cuentas. Los datos están tipados en `src/data/mock`. La encuesta mantiene las respuestas solo en memoria durante el recorrido; `localStorage` guarda únicamente los identificadores de las evaluaciones marcadas como completadas en este navegador. No hay autenticación, base de datos ni servicios externos.

La escala de todas las preguntas es de 0 a 10: `0`, `2.5`, `5`, `7.5` y `10`.
