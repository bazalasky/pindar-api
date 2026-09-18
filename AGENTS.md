# AGENTS.md - pindar-api

Repo-specific guidance for AI coding agents. This file stands alone so a standalone clone of
`pindar-api` still gets the landmines.

**If this repo is checked out inside the Pindar workspace,** the root `AGENTS.md` and
`ROADMAP.md` one level up carry the full project context - working mode, architecture, and the
phase-by-phase design record. Read those first; they win on anything this file doesn't cover.

## Working mode

Pindar is a **mentorship project**. The user writes all implementation code themselves. Give
concept + constraints + acceptance criteria before code is written; review pasted code
afterward like a senior engineer doing a PR review. If asked to "just write it," push back once
and confirm.

**Verify before trusting.** Read the actual file, run the actual command. Nearly every real bug
here surfaced by running code, not reading it.

## Commands

```bash
npx prisma generate            # REQUIRED after clone - see landmine 4
npm run start:dev              # watch mode, port 3000
npm run build && npm run start:prod
npm test                       # jest, rootDir src, *.spec.ts
npx jest src/path/to.spec.ts -t "test name"    # single test
npm run test:e2e               # test/jest-e2e.json
npm run lint                   # eslint --fix
npx prisma validate            # run after every schema edit
npx prisma migrate dev --name <name>
npx prisma migrate deploy      # replays migration files; use for test DB and CI
```

Anything reading `.env` is cwd-sensitive - run it from this directory.

## Architecture

`AppModule` → `AuthModule` → `PrismaModule`. `PrismaModule` owns `PrismaService` and exports
it; consumers import the module. Explicit imports were chosen over `@Global()` so each module's
import list documents what it uses.

**Never list `PrismaService` in another module's `providers`.** Nest instantiates providers
per-module, so a second registration creates a second `PrismaClient` - a second connection pool
against Neon, with `onModuleDestroy` disconnecting only one. Invisible to code review; verify
with a temporary constructor log printing exactly once.

Auth is single-owner JWT via `@nestjs/passport` + `passport-jwt`. Deliberate simplifications,
cheap to expand later: no public `/register` (seed with `scripts/create-user.ts`, reading
`EMAIL`/`PASSWORD`/`NAME` from `.env`), 7-day token expiry, and `JwtStrategy.validate()` trusts
the payload without re-querying the DB.

**Data model.** `Activity` is a shared parent (date, duration, discriminator, notes, ownership,
Strava sync fields) with `LiftActivity` / `RunActivity` children; `LiftActivity` has `Set` rows
referencing a per-user `Exercise`. The `@@unique([source, externalId])` constraint is what makes
the Strava sync idempotent - don't drop it. Field-level reasoning lives in the workspace
ROADMAP.md; read it before proposing schema changes.

## Landmines

Each of these has already cost real debugging time.

1. **`import "dotenv/config"` must be the literal first line of `main.ts`.** Nest doesn't
   auto-load `.env`, and `JwtModule.register()` reads `process.env` synchronously at
   module-load time, so import order matters.
2. **Prisma 7 requires an explicit driver adapter.** Inject `PrismaService`; never construct a
   bare `new PrismaClient()`.
3. **Generator config is load-bearing.** `moduleFormat = "cjs"` and `importFileExtension = ""`.
   Prisma derives the import extension from `tsconfig`'s `module`/`moduleResolution`; left
   alone, `nodenext` emits `./foo.js` specifiers that break under `ts-node` and `ts-jest` while
   still working under `nest build`. Don't reintroduce ESM-ish settings.
4. **`generated/prisma` is gitignored,** so a clean checkout has no Prisma client. `build` is
   `prisma generate && nest build` to cover this - don't reduce it to `nest build`. A
   `postinstall` hook is the wrong fix: the Dockerfile's `npm ci` steps bind-mount only
   `package.json`/`package-lock.json`, so there'd be no schema to generate from, and the deps
   stage omits the `prisma` CLI entirely. Anything running *without* building (`start:dev` on a
   fresh clone) still needs a manual `npx prisma generate`.
5. **`rootDir` is pinned to `"."` in `tsconfig.build.json`,** so the entry point is
   `dist/src/main.js`, not `dist/main.js` - which is why `start:prod` and the Dockerfile `CMD`
   both say `dist/src/main.js`. tsc otherwise infers `rootDir` from whichever files happen to
   exist at the project root, silently relocating the whole build.
6. **`Decimal` is not a JS number.** It doesn't JSON-serialize to `225.5`; the project rule is
   to serialize as a string. Separately, `@db.Date` returns a JS `Date` at UTC midnight -
   formatting it with local-time methods renders the previous day.
7. **zsh appends a trailing `%`** to copy-pasted terminal output that didn't end in a newline.
   Easy to paste into `.env` alongside a token or a Neon connection string without noticing.
8. **Pin `@nestjs/*` satellite packages to match core (v11).** The v12 line of `@nestjs/jwt`,
   `@nestjs/passport` and `@nestjs/config` is **ESM-only** (`"type": "module"`, no `require`
   export condition). This project is CommonJS, and it works in production only because Node
   26 supports `require()` of ESM - but jest's CJS runtime does not, so an unpinned
   `npm install @nestjs/something` breaks the test suite while production stays green. Known
   good: `@nestjs/jwt@^11`, `@nestjs/passport@^11`, and `@nestjs/config@^4` (config has **no**
   v11 - it went `4.0.4` straight to `12.0.0`, realigning with core, so `@^11` finds nothing).
   To audit, scan `node_modules/<dep>/package.json` for `"type": "module"` across direct deps.
9. **E2E tests need `NODE_OPTIONS=--experimental-vm-modules`.** Prisma 7's client engine loads
   its WASM query compiler via a dynamic `import()`, which jest cannot do otherwise. It is set
   in the `test:e2e` script. That syntax is macOS/Linux only; `cross-env` if Windows ever
   matters.
10. **A booting app proves nothing about the database.** Prisma driver adapters connect
    lazily, so `$connect()` in `onModuleInit` opens no socket. Verified directly: the E2E suite
    passed with the test container stopped. This is the same failure that let a missing
    `DATABASE_URL` deploy green to Render. Any test meant to prove DB wiring must issue a real
    query - the bogus-user login returning 401 is the cheapest one.
11. **Never accept an editor auto-import that isn't relative.** `baseUrl: "./"` makes VS Code
    prefer `'src/prisma/prisma.service'` over `'../prisma/prisma.service'`. `tsc` resolves it
    and jest does not, so it typechecks clean and then fails at runtime with `Cannot find
    module`. Hit twice so far. Its cousin is an auto-import of a deep `node_modules/...` path
    instead of the package name. **A clean `tsc --noEmit` says nothing about whether a module
    resolves** - or, separately, about whether it is wired in: unreferenced code compiles fine,
    which is why `ActivitiesModule` typechecked before `AppModule` imported it.
12. **`nest g <thing> <name>` creates a folder named `<name>` inside the target directory.**
    Running it when `src/activities/` already exists produces `src/activities/activities/`,
    which also stops the CLI adding the import to `AppModule`. Check the resulting paths.
13. **prisma.io/docs now serves Prisma 8; this project is on 7.9.1.** v8 documents a chained
    fluent API (`db.orm.public.User.include("posts").all()`) that **does not exist** in the
    generated client here - v7 uses object literals (`prisma.user.findMany({ include: { posts:
    true } })`). There is no version switcher on the site. Two reliable v7 references instead:
    `backend/.claude/skills/prisma-client-api/` (pinned `version: "7.9.1"`, with
    `references/query-options.md` for include/select/orderBy), and the generated types under
    `generated/prisma/`, which are authoritative for exactly what is installed. Do not link
    prisma.io docs without checking which version the page describes.
14. **Editing `schema.prisma` does not change any database.** A migration has to be generated
    *and* applied, per environment. This silently failed for ten days in Phase 2: the entire
    schema revision existed only in `schema.prisma`, while dev, test and prod all still ran the
    Phase 1 schema. The generated client matched the schema, so nothing complained until code
    first queried a drifted column. **After any schema edit, verify with
    `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma`** and expect
    "No difference detected" - against dev (`.env`), test (`DOTENV_CONFIG_PATH=.env.test`) and
    prod (`DATABASE_URL='<prod>'`) separately. Note `--from-url` was removed in v7; use
    `--from-config-datasource`. Generate migrations against the **local container**
    (`DOTENV_CONFIG_PATH=.env.test npx prisma migrate dev --name <name>`): `migrate dev` needs a
    shadow database it can create and drop, which local Postgres allows and Neon's role often
    does not.
15. **`undefined` in a Prisma `where` means "omit this condition", not "match nothing".**
    `count({ where: { id: { in: [1] }, userId: undefined } })` drops the `userId` filter
    entirely and matches the row whoever owns it. Demonstrated 2026-09-18: an undecorated
    `userId` handler parameter (Nest injects nothing into params without a decorator, so it is
    `undefined`) silently disabled the exercise ownership check. `null` is different again - it
    means `IS NULL`. Any security filter built from a value that could be `undefined` needs that
    value guaranteed upstream.

## Deployment

Render, from the multi-stage `Dockerfile` (non-root user, `npm ci`,
`CMD ["node", "dist/src/main.js"]`). Postgres is Neon.

**Neon has two branches and only the environment distinguishes them** - no code is
environment-aware, everything keys off `DATABASE_URL`:

| Branch | Endpoint prefix | Used by |
|---|---|---|
| prod | `ep-lucky-mouse-…` | Render |
| dev | `ep-frosty-shadow-…` | local `.env` |

Roles are **branch-scoped** in Neon: each branch has its own copy of the Postgres role catalog,
so rotating `neondb_owner`'s password on one branch does nothing to the other, and branch
reset/restore can revert role state along with data. Always confirm which branch a connection
string points at before acting on it.

Against prod use `migrate deploy` only - never `migrate dev` or `migrate reset`. Override
per-command rather than editing `.env` (`dotenv` doesn't overwrite already-set variables, so an
inline value wins):

```bash
DATABASE_URL='<prod url>' npx prisma migrate deploy
```

Verify a deploy with a bogus-user login, which sends no real credentials - **401 means the
query reached Postgres**; a fast 500 (~200ms) means it never got there:

```bash
curl -s -w "\nHTTP %{http_code} in %{time_total}s\n" -X POST https://pindar-api.onrender.com/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"nobody@example.invalid","password":"wrong"}'
```

Render's auto-deploy has silently failed to fire before. When a deploy doesn't reflect a
change, check `git log origin/main..HEAD` first - forgetting to push is a recurring mistake.

`README.md` is unmodified NestJS scaffold. Nothing project-specific is in it. Prisma's official
skills are vendored under `.claude/skills` (tracked by `skills-lock.json`) and load
automatically - prefer them over guessing at Prisma 7 API details.
