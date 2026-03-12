# @heysalad-os/web

This is the new HeySalad OS frontend.

- Base: imported from `v0-react-visual-asset-generation`
- Runtime: Next.js app router
- Output: static export for Cloudflare Pages (`apps/web/out`)

## Commands

```bash
npm run dev
npm run build
```

## Notes

The old Vite frontend was intentionally replaced and archived in `../../archive/web-vite-legacy/`.

The web app now consumes enterprise org APIs:

- `GET /api/org/offices`
- `GET /api/org/workforce`
- `GET /api/org/filters`
- `GET /api/org/summary`
