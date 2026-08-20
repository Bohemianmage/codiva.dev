# Releases: GitHub CI → preview Vercel → QA Codiva → producción

## Flujo

1. Código en rama **`preview/*`** (o PR), nunca promover desde un deploy dirty de `main`.
2. GitHub Actions: lint/typecheck/test; si la rama ≠ `main`, job `preview` en Vercel + alias `*-git-*`.
3. Codiva Ops → Proyecto → **Releases** lista previews READY (sin dirty, un ítem por SHA, sin ya promovidos).
4. Ops prueba la URL (bypass de protección si aplica).
5. Admin/PM: **Aceptar y mandar a producción** (rebuild con env Production). El preview de origen se borra de Vercel/Incoming.
6. El cliente en Portal → Tu sitio solo ve historial.

### Atajos en Ops

| Acción | Qué hace |
|--------|----------|
| **Preparar release** | Apunta `preview/ops-release` al tip de `main` → CI genera preview limpio |
| **Limpiar basura** | Borra dirty (`cursor-cli` / `gitDirty`) y previews >7 días |
| **Descartar** | Borra un preview concreto en Vercel |

## Convención de ramas

- `main` — integración; CI **no** despliega preview.
- `preview/ops-release` — staging de QA que Ops prepara desde Codiva.
- Otras `preview/*` o PRs — trabajo en curso.

No desplegar working trees sucios a Vercel (deploys con `gitDirty` / actor `cursor-cli` se ocultan y se pueden limpiar).

## Lo que Codiva ya hace

- Panel Ops (admin/PM) + historial de solo lectura en el portal.
- Lista previews READY desde Vercel (filtros dirty/dedupe/promovidos) o GitHub.
- Promote por API de Vercel (borra el preview de origen) o workflow GitHub de respaldo.
- Tablas `project_release_settings` / `project_release_requests`.
- Plantillas: `docs/workflows/preview.yml` y `docs/workflows/promote-production.yml`.

## Setup

### 1. SQL en Supabase (editor)

1. `supabase/migrations/20260818230000_project_release_pipeline.sql`
2. `supabase/migrations/20260819093000_release_vercel_previews.sql`
3. `supabase/migrations/20260819101500_nirc_enable_releases.sql` (activa NIRC)

### 2. Secretos en Vercel del proyecto **Codiva**

`GITHUB_RELEASES_TOKEN` (Production + Preview): **Actions Write**, **Deployments Read**, **Contents Read/Write** (para Preparar release), **Checks Read**, **Pull requests Read/Write**.

**`VERCEL_RELEASES_TOKEN`:** [https://vercel.com/account/tokens](https://vercel.com/account/tokens) → Create → scope team **Codiva** → `vercel env add VERCEL_RELEASES_TOKEN production preview development` en **codiva-dev** → redeploy.

### 3. Repo del cliente (ej. NIRC)

- `.github/workflows/ci.yml` — CI; preview solo si ≠ `main`
- `.github/workflows/promote-production.yml` — respaldo promote
- Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### 4. Vercel del sitio cliente

Sin auto-deploy a **Production** en `main`. Producción solo desde Codiva.

NIRC: `prj_GGlesi8OSxDAxabWGHH53coejcRC` · team `codiva-dev` · root `apps/web`.

**Protection Bypass for Automation** en el proyecto cliente → Codiva arma el enlace con `?x-vercel-protection-bypass=…` en Ops.

### 5. Probar

1. En Ops: **Preparar release** (o push a `preview/*`).
2. CI verde → preview con alias git.
3. Abrir, QA, **A producción**.
4. Incoming ya no muestra ese preview.
