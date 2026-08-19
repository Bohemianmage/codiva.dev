# Releases: GitHub CI → preview Vercel → QA Codiva → producción

## Flujo (ya está en Codiva)

1. Push / PR en una rama **distinta de `main`** en el repo del cliente.
2. GitHub Actions corre tests.
3. Si pasa, preview en Vercel (el auto-deploy Git de Vercel está apagado).
4. En paralelo, Codiva lista ese deploy READY en **Ops → Proyecto → Releases** (no hace falta un PR abierto).
5. Ops prueba la URL. El badge muestra el CI.
6. Admin / PM: **Aceptar y mandar a producción** (mismo artefacto, sin rebuild).

El cliente en **Portal → Tu sitio** solo ve historial.

## Lo que Codiva ya hace

- Panel Ops (solo admin/PM) y historial de solo lectura en el portal.
- Lista previews READY desde Vercel (o GitHub), con commit y estado de CI. Un PR abierto se asocia si coincide; no es un requisito para ver el preview.
- Promote por API de Vercel, o workflow de GitHub como respaldo.
- Migraciones de tablas `project_release_settings` y `project_release_requests`.
- Plantillas: `docs/workflows/preview.yml` y `docs/workflows/promote-production.yml`.

## Lo que debes hacer tú

### 1. SQL en Supabase (editor)

La primera migración ya es **idempotente**. Vuelve a correr, en este orden:

1. `supabase/migrations/20260818230000_project_release_pipeline.sql`
2. `supabase/migrations/20260819093000_release_vercel_previews.sql`
3. `supabase/migrations/20260819101500_nirc_enable_releases.sql` (activa NIRC)

### 2. Secretos en Vercel del proyecto **Codiva**

`GITHUB_RELEASES_TOKEN` ya está (Production + Preview).

Si el listado de CI/previews falla, el PAT necesita: **Actions Write**, **Deployments Read**, **Contents Read**, **Checks Read**.

**`VERCEL_RELEASES_TOKEN`:** el CLI de Vercel no puede crear tokens (403). Tú:

1. [https://vercel.com/account/tokens](https://vercel.com/account/tokens) → Create
2. Nombre `codiva-releases`, scope team **Codiva**
3. `vercel env add VERCEL_RELEASES_TOKEN production preview development` en el proyecto **codiva-dev**
4. Redeploy Codiva

### 3. Repo NIRC (ya preparado en el working copy)

Archivos:

- `.github/workflows/ci.yml` — CI y, si no es `main`, preview en Vercel
- `.github/workflows/promote-production.yml` — respaldo de promote

Commit + push. Luego secrets de Actions en `Codiva-dev/nirc`:

| Secret | Valor |
|--------|--------|
| `VERCEL_TOKEN` | El mismo token de Vercel (o uno nuevo) |
| `VERCEL_ORG_ID` | `codiva-dev` |
| `VERCEL_PROJECT_ID` | `prj_GGlesi8OSxDAxabWGHH53coejcRC` |

### 4. Vercel del sitio NIRC

No auto-deploy a **Production** en `main`. Producción solo desde Codiva.

NIRC Vercel: `prj_GGlesi8OSxDAxabWGHH53coejcRC` · team slug `codiva-dev` · root `apps/web`.

Para abrir el preview **sin login de Vercel**, activa **Protection Bypass for Automation** en ese proyecto. Codiva lee `VERCEL_AUTOMATION_BYPASS_SECRET` y arma `?x-vercel-protection-bypass=…&x-vercel-set-bypass-cookie=true` en Ops (Abrir / copiar). La protección sigue activa para quien no tenga ese enlace.

### 5. Probar

1. Push a una rama ≠ `main` (o un PR).
2. CI verde → job `preview` en Vercel.
3. En Codiva Ops → Releases, el preview aparece aunque el PR ya se haya cerrado.
4. Abrir URL, probar, **Aceptar y mandar a producción**.
