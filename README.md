# HeySalad OS

> Turn your OpenClaw into a company.

HeySalad OS now uses the **v0-generated Next.js visual office twin** as its primary frontend base.
The previous custom React/Vite frontend has been archived in `archive/web-vite-legacy/` for reference and rollback.

## Repo layout

- `apps/web` — Next.js static-export frontend (globe + office interiors + HR directory)
- `archive/web-vite-legacy` — previous Vite-based HeySalad OS frontend
- `apps/api` — Hono Worker API stub suitable for Cloudflare Workers/D1 evolution
- `packages/domain` — HeySalad product types + realistic demo dataset
- `packages/openclaw-adapter` — runtime normalization + mission view-model shaping

## Branding

The imported v0 UI has been rebranded back to HeySalad OS using the existing launcher icon assets:

- `apps/web/public/heysalad-launchericon.jpg`
- `apps/web/public/heysalad-launchericon-transparent.png`

## Local development

From `heysalad-os/`:

```bash
npm install
npm run dev:web
npm run dev:api
```

Useful checks:

```bash
npm run typecheck
npm run build:web
npm run build:api
```

Enterprise D1 workflow:

```bash
npm --workspace @heysalad-os/api run d1:migrate:local
npm --workspace @heysalad-os/api run seed:enterprise:sql
npm --workspace @heysalad-os/api run d1:seed:local
```

For remote Cloudflare D1:

```bash
npm --workspace @heysalad-os/api run d1:migrate:remote
npm --workspace @heysalad-os/api run d1:seed:remote
```

## Deployment shape

### Web

The web app is now a **static-exported Next.js app** rather than Vite.

- Build with `npm run build:web`
- Deploy `apps/web/out` to Cloudflare Pages
- Local preview can also be served from the exported output if needed

This keeps the deployment target simple and compatible with the existing Cloudflare Pages setup while allowing the new Next.js UI to be used as the complete frontend replacement.

### API

- Deploy `apps/api/src/index.ts` with Wrangler to Cloudflare Workers
- Add D1 once the demo data is ready to become persisted mission metadata / approvals mirror / notes / audit tables

## Caveats

- The imported visual frontend is fully client-side and currently exports statically; there are no server-rendered Next features in use.
- The 3D globe still attempts to load a remote Earth texture at runtime and falls back to a procedural texture if that request fails.
- Type checking for the Next/R3F frontend is intentionally skipped in CI-style verification for now because the upstream v0 scene code relies on JSX/runtime combinations that compile correctly in Next but are noisy in standalone `tsc`.
