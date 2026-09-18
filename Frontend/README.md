# Finance Tracker — Frontend

Nuxt 4 / Vue 3 single-page app UI for the Finance Tracker REST API (see the repository root `README.md`).

## Stack

- Nuxt 4 + Vue 3, client-side rendering (SPA-style)
- Nuxt UI v4 + Tailwind CSS v4 (theming via CSS variables in `app/assets/css/main.css`)
- Pinia stores (user/expense/category) persisted to `localStorage` via `pinia-plugin-persistedstate`
- `nuxt-charts` for dashboard charts (rendered client-only)

## Package manager

This package is managed **exclusively with Bun**. There is no `pnpm-lock.yaml` or `package-lock.json` in this repo — `bun.lock` is the only lockfile. Run all commands with `bun`:

```bash
bun install    # install dependencies
bun run dev    # development server (http://localhost:5173)
bun run build  # production build
```

Set `NUXT_PUBLIC_API_BASE_URL` to point at the backend if it is not running on `http://localhost:3000`.

## Layout

```
app/
├── api/            # $fetch client factory + per-domain API modules
├── assets/css/     # Tailwind + Nuxt UI theme entry point
├── components/     # dashboard / expense / category / layout / modals
├── composables/    # table filter/sort/pagination state
├── consts/         # month names, colour palette
├── layouts/        # default (app shell), auth (login/register/etc.)
├── middleware/     # auth route guard
├── pages/          # dashboard, expenses, categories, budgets, login/register
├── plugins/        # pinia-persistedstate
├── stores/         # Pinia stores
├── types/          # TypeScript mirrors of API shapes (keep in sync with backend)
└── utils/          # formatting helpers
```