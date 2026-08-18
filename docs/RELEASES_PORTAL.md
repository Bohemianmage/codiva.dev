# Releases en el centro de trabajo (preview → producción)

## Qué es

Por proyecto, Codiva puede:

1. Mostrar el flujo **preview → aprobación → promote**.
2. Dejar que **admin / PM** creen, aprueben y despachen promote desde Ops.
3. Mostrar al **cliente** solo el historial (solo lectura) en **Portal → Tu sitio**.

El cliente **no** puede solicitar ni ejecutar promote.

Los secretos **no** van en la base: usa `GITHUB_RELEASES_TOKEN` (o `GITHUB_TOKEN`) en el entorno de Codiva (Vercel).

## Setup Ops (proyecto)

1. Proyecto → pestaña Sitio / Releases (solo **admin** o **PM** editan).
2. Bloque **Releases**: activar, owner/repo GitHub, workflow (ej. `promote-production.yml`), ref `main`.
3. Crear solicitud con la URL de preview validada → **Aprobar** → **Despachar promote**.

## Workflow esperado en el repo del cliente (ej. NIRC)

```yaml
# .github/workflows/promote-production.yml
name: Promote production
on:
  workflow_dispatch:
    inputs:
      deployment_url:
        description: Preview deployment URL to promote
        required: true
        type: string
jobs:
  promote:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: npm i -g vercel@39
      - run: vercel promote "${{ inputs.deployment_url }}" --token=${{ secrets.VERCEL_TOKEN }} --yes
```

GitHub Environment `production` con reviewers = gate humano extra (además de Codiva).

## Secretos

### Codiva (Vercel → Environment Variables del proyecto Codiva)

| Variable | Dónde | Valor |
|----------|--------|--------|
| `GITHUB_RELEASES_TOKEN` | Codiva / Vercel | Personal Access Token (classic o fine-grained) con permiso de **Actions: Write** (y acceso al/los repos de clientes a promover). Preferido frente a `GITHUB_TOKEN`. |

Sin este token: el panel sigue sirviendo para auditoría; usa **Marcar promovido a mano** tras promote en Vercel/GitHub.

### Repo del cliente (GitHub → Settings → Secrets and variables → Actions)

| Secret | Dónde | Valor |
|--------|--------|--------|
| `VERCEL_TOKEN` | Repo del cliente (Actions secrets) | Token de Vercel con permiso para `vercel promote` en ese proyecto. |

Opcional: Environment `production` en GitHub con required reviewers.

## Tablas

- `project_release_settings`
- `project_release_requests`

Migración: `supabase/migrations/20260818230000_project_release_pipeline.sql`
