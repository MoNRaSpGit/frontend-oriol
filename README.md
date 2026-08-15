# frontend-oriol

POS / facturacion / stock para Agro Insumos (ex-OrioNuevo), portado a SaasPro. Modulo standalone en el backend (sin login, API key unica compartida), no participa del sistema multi-tenant.

## Desarrollo

```bash
npm install
cp .env.example .env
npm run dev
```

## Deploy

```bash
npm run deploy
```

Build con `--mode github-pages` (usa `.env.github-pages`) y publica `dist/` a GitHub Pages via `gh-pages`.
