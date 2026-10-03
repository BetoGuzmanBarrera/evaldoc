# Reproducción del DDL final

La fuente única del DDL son las **ocho migraciones versionadas** en `supabase/migrations/`, aplicadas por orden de nombre, seguidas del catálogo en `supabase/seed.sql`. No se conserva una copia de `CREATE TABLE` en `docs/` porque duplicaría la fuente de verdad y podría omitir funciones, triggers, grants y RLS.

En un entorno **local y desechable** con Docker activo:

```powershell
npm install
npx.cmd supabase start
npx.cmd supabase db reset --local
npx.cmd supabase db dump --local --schema public,app_private --file "$env:TEMP\evaldoc-schema-local.sql"
```

El último archivo es un artefacto **generado**, no se versiona ni se usa como migración. Incluye los esquemas propios `public` y `app_private`, con funciones, triggers y políticas pertinentes; revísese antes de compartir. Para ver la fuente revisable, leer las migraciones 1–8, en particular la migración 4 de RLS y la 8 de instalaciones. `auth.users` y otros objetos administrados por Supabase no forman parte del DDL propio de EvalDoc. El seed puede reproducirse con el reset local; nunca debe ejecutarse sin revisar su idempotencia y el estado del proyecto de destino.

Para un proyecto remoto, seguir [el runbook de producción](production-deployment.md) y un proceso de revisión/aprobación separado. Esta entrega no enlaza ni modifica ningún proyecto remoto.
