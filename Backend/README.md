# backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

To seed local db:

1. Delete any old/stale data in `database.sqlite.db`
2. Generate blank canvas
```bash
bun run drizzle-kit generate
```
3. Migrate using config set in `drizzle.config.ts`
```bash
bun run drizzle-kit migrate
```
4. Run seeding script
```bash
bun run seed
```

To run test-suite:

```bash
bun run test
```