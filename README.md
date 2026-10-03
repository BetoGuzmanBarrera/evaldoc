# EvalDoc

EvalDoc es un prototipo escolar funcional para evaluar la docencia en múltiples instituciones. El alumno responde una encuesta oficial de 15 reactivos en escala **0, 2.5, 5, 7.5 y 10**. Docentes y responsables institucionales ven métricas agregadas con un umbral de anonimato de cinco evaluaciones completas por asignación. El proyecto está listo para revisión local; **no está desplegado en producción**.

## Arquitectura y stack

React 19, TypeScript estricto, Vite 8, Tailwind CSS, React Router, Lucide React y jsPDF para la UI y los informes; Supabase local (PostgreSQL/Auth/API) para identidad, autorización y datos. Cloudflare Turnstile protege registro, login y recuperación: su token se valida en Supabase Auth. La UI consulta RPC por rol; los datos académicos se aíslan mediante RLS y validación dentro de PostgreSQL. No hay backend Node propio ni claves privilegiadas en el navegador.

Roles: **alumno**, **docente**, **coordinación**, **recursos humanos** y **administrador institucional**. Una persona puede tener más de un rol, pero una cuenta recién registrada queda `pending` con rol `student` y no obtiene acceso académico hasta su activación. El rol y la institución se resuelven desde la base, no desde metadata ni `localStorage`.

## Ejecución local

Requisitos: Node/npm compatibles con `package.json`, Docker Desktop y Supabase CLI instalado por `npm ci`. Trabajar siempre en el proyecto local **EvalDoc** (puertos API 55421, DB 55422, Studio 55423, Mailpit 55424); no ejecutar resets de otros proyectos.

```powershell
npm ci
Copy-Item .env.example .env.local
npx.cmd supabase start
npx.cmd supabase db reset --local
npm run dev
```

Configurar `.env.local` con `VITE_SUPABASE_URL=http://127.0.0.1:55421`, la **anon key pública** del proyecto local y `VITE_TURNSTILE_SITE_KEY`. La secret de Turnstile para Auth se configura en el `.env` local **ignorado por Git** como `EVALDOC_TURNSTILE_SECRET`; no se coloca en `VITE_*`. Para pruebas locales pueden usarse las claves oficiales de prueba descritas en [Turnstile](docs/turnstile-antibot.md), nunca en producción. El archivo [`.env.example`](.env.example) enumera solo las variables cliente; [`.gitignore`](.gitignore) excluye secretos. Vite normalmente abre [localhost:5173](http://localhost:5173/). Mailpit: [127.0.0.1:55424](http://127.0.0.1:55424/).

El reset local aplica ocho migraciones y el seed: siete instituciones de muestra, cinco roles y una plantilla global versionada con 15 reactivos; no crea usuarios, programas ni instalaciones inventadas. **Borra los datos locales del proyecto EvalDoc**. No usarlo en producción. La activación de perfiles, matrículas, asignaciones y estructura académica requieren aprovisionamiento administrativo controlado; el registro público no otorga roles privilegiados.

## Rutas y funciones

Públicas: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/email-confirmation`, `/pending`. Alumno: `/student`, `/student/evaluations`, `/student/evaluations/:id`, confirmación de envío. Docente: `/teacher`, `/teacher/results/:id`, `/teacher/history`. Institucionales: `/coordinator`, `/hr`, `/admin`, `/institutions`. Las rutas privadas redirigen sin sesión o rol correspondiente. La encuesta se envía de forma atómica; RF03 bloquea la repetición por alumno/docente/materia/periodo. Histórico, tendencias y PDFs proceden de agregados autorizados.

## Calidad y documentación

```powershell
npm run lint
npm run build
npm run test:pdf
npm run test:auth
npm run test:auth:local
npm run test:turnstile
npm run test:turnstile:local
```

Las suites SQL en `supabase/tests/` se ejecutan contra la base local con `psql` y concluyen con `ROLLBACK`; el procedimiento y resultados están en [validación final](docs/final-validation.md). Las pruebas locales de Auth crean usuarios ficticios: ejecutar luego `npx.cmd supabase db reset --local` para limpiar. Verificar siempre el puerto 55421 antes de probar.

Carpetas principales: `src/pages` y `src/components` (UI); `src/auth`, `src/hooks`, `src/lib`, `src/routes` (sesión, consultas y permisos visuales); `supabase/migrations`, `supabase/seed.sql`, `supabase/tests` (modelo y reglas); `tests` (pruebas Node); `design/reference` (PNG de referencia); `docs` (DER, diccionario, seguridad, evidencia y reporte escolar).

La [auditoría de rúbrica](docs/final-rubric-audit.md), [DER](docs/database-er-diagram.md), [modelo físico](docs/database-physical-model.md), [diccionario](docs/data-dictionary.md), [reproducción DDL](docs/ddl-reproduction.md) y [reporte escolar](docs/final-project-report.md) documentan la entrega. Las referencias visuales aprobadas están en `design/evaldoc-prototype-1.pen`, su PDF y los PNG de `design/reference/`.

## Privacidad y límites

Las tablas `evaluations` y `evaluation_answers` no conceden lectura directa a clientes. `student_id` solo sirve a reglas internas; informes docentes/institucionales y PDF usan agregados, sin nombres de alumnos vinculados a respuestas. Hay riesgo residual de inferencia por comparar agregados en el tiempo o en grupos pequeños; el umbral de cinco reduce, pero no elimina, ese riesgo. Se recomienda publicar métricas solo para cohortes cerradas en una versión futura.

El catálogo de instalaciones/talleres tiene modelo y lectura autorizada, sin módulo CRUD. Varias entradas de navegación no desarrolladas se muestran deshabilitadas; no enlazan a páginas vacías. Los datos mock de `src/data/mock` se conservan únicamente donde aún sirven a la presentación pública o a componentes heredados; no sustituyen las RPC de las vistas autenticadas. La generación PDF ocurre en navegador y puede consumir memoria con informes grandes. La preparación de dominio, SMTP, claves reales, carga de datos académicos y despliegue se describe en el [runbook de producción](docs/production-deployment.md); no se ha ejecutado.
