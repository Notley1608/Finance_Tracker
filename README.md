# Finance Tracker

A personal finance tracking application for recording and visualising expenses by category. It consists of two independent packages:

| Package  | Directory   | Purpose                                        | Stack                                           |
| -------- | ----------- | ---------------------------------------------- | ----------------------------------------------- |
| Backend  | `Backend/`  | REST API, data persistence, authentication     | Bun, Elysia, Drizzle ORM, SQLite (`bun:sqlite`) |
| Frontend | `Frontend/` | Web UI (dashboard, expenses, categories, auth) | Nuxt 4, Vue 3, Pinia, Nuxt UI, Tailwind v4      |

---

## Architecture overview

The frontend is a client-side (SPA-style) Nuxt app that talks to the Elysia REST API over HTTP. There is no shared workspace — each package installs and runs independently. All data lives in a single SQLite database file on the backend.

```
Browser (Nuxt $fetch)  ──HTTP──▶  Elysia API  ──Drizzle──▶  SQLite
   Frontend/                        Backend/                   database.sqlite.db
```

### Backend

- **Framework:** [Elysia](https://elysiajs.com) running on [Bun](https://bun.sh).
- **Data access:** [Drizzle ORM](https://orm.drizzle.team) on the native `bun:sqlite` driver.
- **Layering:** `routes` (HTTP + TypeBox validation) → `controllers` (business logic, throws `HttpError`) → `models` (data access) → `entities` (domain objects with `toObject()`).
- **Auth:** JWT (HS256, 7-day expiry) via `@elysiajs/jwt`. Password hashing uses `Bun.password`. All queries are scoped by the authenticated `user_id` for per-user isolation.
- **Validation:** Elysia's TypeBox (`t`) schemas per route.
- **Docs:** OpenAPI/Swagger UI is enabled at `/swagger`.

### Database schema

Three tables. All primary keys are UUID strings; timestamps/dates are ISO strings; amounts are stored as `REAL`.

- **`users`** — `id`, `email` (unique), `name`, `password_hash`, `created_at`, `updated_at`
- **`categories`** — `id`, `user_id` (FK → users, cascade), `name`, `colour` (optional hex `#RRGGBB`)
- **`expenses`** — `id`, `user_id` (FK → users, cascade), `category_id` (FK → categories, cascade), `amount`, `description`, `date` (`YYYY-MM-DD`)

Relationships: `users 1—N categories`, `users 1—N expenses`, `categories 1—N expenses`. All deletions cascade.

### Frontend

- **Framework:** [Nuxt 4](https://nuxt.com) + Vue 3.
- **UI:** [Nuxt UI v4](https://ui.nuxt.com) + Tailwind CSS v4, icons via `@nuxt/icon` (Heroicons + Lucide).
- **State:** [Pinia](https://pinia.vuejs.org) stores; the user store (token + profile) is persisted to `localStorage` via `pinia-plugin-persistedstate`.
- **Charts:** `nuxt-charts` (BarChart) for the dashboard spend breakdown; rendered client-only.
- **API layer:** a `$fetch` client factory in `app/api/client.ts` that injects the bearer token and globally redirects to `/login` on `401`.
- **Data flow:** Page → store action → API module → backend → store ref → computed → component.

### Key features

- Register / login / logout, profile management (name, email, password), account deletion
- Expense CRUD with search, sort & pagination (client-side)
- Category CRUD (with optional colour)
- Dashboard with stat cards and a monthly spend-by-category bar chart (month navigator)
- Monthly sheet & monthly summary endpoints
- Data export as JSON or CSV

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh) (v1.1+)
- [Node.js](https://nodejs.org) 26.x (frontend `engines` requirement) — used only to satisfy Nuxt tooling
- [SQLite](https://sqlite.org) (bundled with `bun:sqlite`; a `sqlite3` CLI is convenient for inspecting the DB)

> The backend is Bun-native and **must** be run with Bun. The frontend is pnpm/npm can be installed/run with Bun — but pick **one** package manager and stick with it to avoid lockfile drift.

### 1. Backend

```bash
cd Backend
bun install
bun run dev        # starts on http://localhost:3000
```

The backend reads `.env` in `Backend/`:

- `PORT` (default `3000`)
- `JWT_SECRET` (required — the server throws at startup if missing)

Set up the database and seed sample data:

```bash
cd Backend
# 1. generate any pending schema migrations
bun drizzle-kit generate
# 2. apply migrations to the local SQLite DB
bun drizzle-kit migrate
# 3. seed sample users, categories and expenses
bun run seed
```

### 2. Frontend

```bash
cd Frontend
pnpm install
pnpm run dev        # http://localhost:5173 (default)
```

The frontend targets the backend via `runtimeConfig.public.apiBaseUrl` in `Frontend/nuxt.config.ts` (default `http://localhost:3000`). Override it with an env var if needed:

```bash
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000 pnpm run dev
```

> Seeded test login: `test@example.com` / `Test123!`

---

## Project structure

```
Finance_Tracker/
├── Backend/
│   ├── drizzle/                 # Generated SQL migrations + meta snapshots
│   ├── src/
│   │   ├── index.ts             # Entry point (starts Elysia server)
│   │   ├── app.ts               # App assembly: CORS, Swagger, routes, error handler
│   │   ├── db.ts                # SQLite + Drizzle init
│   │   ├── seed.ts              # Idempotent seeding script
│   │   ├── schemas/schema.ts    # Drizzle table definitions
│   │   ├── entities/            # Domain classes (user, category, expense)
│   │   ├── models/              # Data-access layer (Drizzle queries)
│   │   ├── controllers/         # Business logic
│   │   ├── routes/              # Elysia route definitions + validation
│   │   ├── middleware/          # JWT + auth derive/resolve
│   │   ├── plugins/             # DB decoration plugin
│   │   └── utils/               # HttpError, formatting helpers
│   ├── drizzle.config.ts
│   └── database.sqlite.db       # Local SQLite database
│
└── Frontend/
    ├── nuxt.config.ts           # Nuxt config (modules, runtime config)
    └── app/
        ├── api/
        │   ├── client.ts        # $fetch factory (auth header, 401 redirect)
        │   └── modules/         # Per-domain API methods (expenses, categories, users)
        ├── components/
        │   ├── dashboard/       # PageHeader, StatCards, MonthlySpendBreakdown
        │   ├── layout/          # AppHeader, AppSidebar, AppMain, AppFooter
        │   ├── modals/          # ProfileModal
        │   ├── expense/         # ExpenseTable, ExpenseModal
        │   └── category/        # CategoryTable
        ├── composables/         # Table filter/sort/pagination state
        ├── layouts/             # default (app shell), auth (login/register)
        ├── middleware/          # auth route guard
        ├── pages/               # dashboard, expenses, categories, login, register
        ├── plugins/             # pinia-persistedstate
        ├── stores/              # Pinia stores (user, expense, category)
        ├── types/               # TypeScript interfaces (mirror of API shapes)
        ├── consts/              # Shared constants (e.g. month names, colour palette)
        └── utils/               # Formatting helpers
```

---

## API reference (summary)

All endpoints under the backend prefix. Authenticated routes require `Authorization: Bearer <token>`.

| Method & Path                   | Auth | Purpose                                  |
| ------------------------------- | ---- | ---------------------------------------- |
| `GET /`                         | No   | Health check                             |
| `POST /users/register`          | No   | Create user, returns `{ token, user }`   |
| `POST /users/login`             | No   | Authenticate, returns `{ token, user }`  |
| `POST /users/logout`            | No   | Stateless logout (no token invalidation) |
| `GET /users/me`                 | Yes  | Current user profile                     |
| `PATCH /users/me`               | Yes  | Update name/email/password               |
| `DELETE /users/me`              | Yes  | Delete own account                       |
| `POST /categories`              | Yes  | Create category (name + optional colour) |
| `GET /categories`               | Yes  | List categories with expense counts      |
| `GET /categories/:id`           | Yes  | Get a category                           |
| `PATCH /categories/:id`         | Yes  | Rename and/or recolor a category         |
| `DELETE /categories/:id`        | Yes  | Delete a category                        |
| `POST /expenses`                | Yes  | Create expense                           |
| `GET /expenses`                 | Yes  | List all expenses                        |
| `GET /expenses/monthly-sheet`   | Yes  | Expenses for a year/month                |
| `GET /expenses/monthly-summary` | Yes  | Totals + per-category for a year/month   |
| `GET /expenses/export`          | Yes  | Export a month as CSV or JSON            |
| `GET /expenses/:id`             | Yes  | Get an expense                           |
| `PATCH /expenses/:id`           | Yes  | Update an expense                        |
| `DELETE /expenses/:id`          | Yes  | Delete an expense                        |

Full, generated API docs are served by the backend at [`http://localhost:3000/swagger`](http://localhost:3000/swagger).

---

## Common commands

### Backend (`Backend/`)

```bash
bun install            # install dependencies
bun run dev            # dev server with hot reload
bun run build          # bundle to ./dist (Bun target)
bun run start          # run the built bundle
bunx drizzle-kit generate   # generate a new migration from schema changes
bunx drizzle-kit migrate    # apply pending migrations
bun run seed           # seed (idempotent) sample data
bun run test           # run bun:test suite
```

### Frontend (`Frontend/`)

```bash
bun install            # install dependencies (or pnpm install)
bun run dev            # dev server
bun run build          # production build
bun run generate       # prerender static site
bun run preview        # preview the production build
```

---

## Notes & known caveats

- **Naming:** the category colour field is spelled `colour` (British) across the schema, API and frontend types for consistency.
- **Package manager:** the frontend historically has both `bun.lock` and `pnpm-lock.yaml`. Pick one manager and remove the other to avoid lockfile drift.
- **Logout** is stateless (JWT is not revoked) — a cleared/bearer token simply expires.
- **Charts** (`nuxt-charts`) render client-only; a `vue-chrts` Vite `optimizeDeps` WARN is expected under pnpm and is benign (the runtime dependency `@unovis/ts` is already installed).
- The frontend `Category`/other types are hand-maintained mirrors of backend shapes — keep them in sync when changing the API.

```

```
