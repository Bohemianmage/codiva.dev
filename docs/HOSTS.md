# Codiva - hosts y subdominios

| Host | Superficie | Quién |
|------|------------|--------|
| `codiva.dev` | Marketing, cotiza, `/legal/*` | Público |
| `ticket.codiva.dev` | Formulario de tickets (`/`) | Clientes / reportes |
| `career.codiva.dev` | Bolsa de trabajo (`/` listado, `/{slug}` vacante) | Candidatos |
| `ops.codiva.dev` | Staff Ops + vista previa `/p/*` + cotizaciones `/q/*` + partners | Equipo Codiva |
| `portal.codiva.dev` | Portal cliente `/login`, `/proyectos`, `/p/{slug}` | Clientes invitados |

`codiva.dev/empleos` redirige a `career.codiva.dev`.
`codiva.dev/ticket` redirige a `ticket.codiva.dev`.

Sesiones **no se comparten** entre `ops` y `portal` (cookies por host). Por eso:

- **Vista previa staff** → `ops.codiva.dev/p/{slug}` (misma sesión)
- **URL / emails al cliente** → `portal.codiva.dev/p/{slug}` (o `/login` / `/proyectos` si tiene varios)

## Checklist - tu lado (infra)

### 1. DNS
Crear registro para el portal y la bolsa (mismo proyecto Vercel que codiva.dev):

- `portal.codiva.dev` → CNAME a Vercel (`cname.vercel-dns.com` o el que indique el dashboard)
- `career.codiva.dev` → CNAME a Vercel
- `ticket.codiva.dev` → CNAME a Vercel

`ops.codiva.dev` ya debería existir.

### 2. Vercel
En el proyecto de Codiva:

1. **Settings → Domains** → Add `portal.codiva.dev`, `career.codiva.dev` y `ticket.codiva.dev`
2. Esperar SSL / verificación
3. **Environment variables** (Production + Preview si aplica):

```env
NEXT_PUBLIC_APP_URL=https://codiva.dev
NEXT_PUBLIC_OPS_URL=https://ops.codiva.dev
OPS_HOST=ops.codiva.dev
NEXT_PUBLIC_PORTAL_URL=https://portal.codiva.dev
PORTAL_HOST=portal.codiva.dev
NEXT_PUBLIC_CAREER_URL=https://career.codiva.dev
CAREER_HOST=career.codiva.dev
NEXT_PUBLIC_TICKET_URL=https://ticket.codiva.dev
TICKET_HOST=ticket.codiva.dev
```

4. Redeploy tras guardar env.

### 3. Supabase Auth
**Authentication → URL Configuration:**

Redirect URLs (agregar):

- `https://portal.codiva.dev/**`
- `https://portal.codiva.dev/auth/callback`
- Mantener `https://ops.codiva.dev/**` y `https://ops.codiva.dev/auth/callback`

Site URL puede seguir siendo `https://ops.codiva.dev` o `https://codiva.dev`.

La bolsa (`career.codiva.dev`) no usa Auth de candidatos.

### 4. Local (opcional)
En `C:\Windows\System32\drivers\etc\hosts` (o equivalente):

```text
127.0.0.1 ops.localhost
127.0.0.1 portal.localhost
127.0.0.1 career.localhost
127.0.0.1 ticket.localhost
```

Vars locales:

```env
NEXT_PUBLIC_OPS_URL=http://ops.localhost:3000
OPS_HOST=ops.localhost
NEXT_PUBLIC_PORTAL_URL=http://portal.localhost:3000
PORTAL_HOST=portal.localhost
NEXT_PUBLIC_CAREER_URL=http://career.localhost:3000
CAREER_HOST=career.localhost
NEXT_PUBLIC_TICKET_URL=http://ticket.localhost:3000
TICKET_HOST=ticket.localhost
```

### 5. Smoke test
1. Staff: login en `ops.codiva.dev` → Vista previa `/p/nirc`
2. Copiar **URL cliente** → debe ser `portal.codiva.dev/p/nirc`
3. Invitar un email de prueba → el mail apunta a `portal.codiva.dev/.../login`
4. Login cliente en `portal.codiva.dev/login` → `/proyectos` (o directo al proyecto si solo hay uno) → aceptar legales → ver propuesta
5. Recovery password desde portal login (`/login/forgot-password`)
6. Bolsa: `career.codiva.dev` lista vacantes; `codiva.dev/empleos` redirige ahí; postular con un PDF de prueba
7. Tickets: `ticket.codiva.dev` muestra el formulario; `codiva.dev/ticket` redirige ahí

### 6. No olvidar
- Cron retención sigue en el mismo deploy (`/api/ops/cron/...`); no requiere subdominio nuevo
- Cotizaciones públicas `/q/{token}` siguen en **ops** (o marketing si más adelante las mueves)
- Actualizar bookmarks / Notion / OneDrive si tenían links viejos `ops.../p/`
