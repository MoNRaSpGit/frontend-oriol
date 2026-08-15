# frontend-oriol

POS / facturacion / stock para Agro Insumos (ex-OrioNuevo), portado a SaasPro.

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

## Decisiones

- **Modulo standalone** en el backend (`backend/src/modules/oriol`): no participa del sistema multi-tenant real (el que usan agro/alamcen/camiones, con login y `tenant_id`). Es una app de un solo negocio, igual que el original.
- **Sin autenticacion por ahora** (a pedido explicito, 2026-08-15): la API (`/api/v1/oriol/*`) esta completamente abierta, igual que carnet/joker/piloto. El original tenia una API key unica compartida horneada en el bundle publico; se saco para simplificar, con la idea de retomarlo mas adelante si hace falta.
