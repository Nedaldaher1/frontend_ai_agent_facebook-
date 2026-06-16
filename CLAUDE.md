# CLAUDE.md — Masa Fashion Admin Panel

This file is the source of truth for how to work in this repository. Read it fully before making changes. Rules marked **IMPORTANT** or **YOU MUST** are non-negotiable.

---

## 1. Project overview (what you are building and why)

**Masa Fashion** is a Jordanian abaya brand that sells on its Facebook page. The brand runs an **AI sales agent** that answers customers on Facebook Messenger in Arabic: a customer sends a message (often a screenshot of an abaya), and the agent identifies the product, answers questions, and sends back matching items.

High-level architecture of the wider system:

```
Customer (Facebook Messenger)
      │
   ManyChat            ← messaging layer: forwards messages in, renders galleries out
      │  (HTTPS External Request)
      ▼
  Agent backend        ← NestJS + Fastify + Bun + Drizzle + PostgreSQL + Mastra + Claude API
      │                  - product retrieval cascade:
      │                    1) ad_ref lookup (which ad the customer came from, zero AI cost)
      │                    2) Claude Vision extracts structured attributes from the customer's
      │                       image using Structured Outputs + a CLOSED enum vocabulary
      │                    3) SQL filtering against the product catalog
      │                  - Phase 2: CLIP image embeddings (pgvector, vector(512)) as a fast matcher
      ▼
  PostgreSQL (product catalog)
      ▲
      │  reads & writes
**THIS REPO → Admin Panel**   ← the "source of truth" UI where staff manage the catalog
```

**THIS repository is the admin panel.** It is a separate frontend app that staff use to manage the product catalog that feeds the AI agent.

> **IMPORTANT:** This admin panel is the **source of truth** for the agent. Every product field a human enters or approves here directly shapes what the AI agent says to real customers. Data accuracy is a customer-facing concern, not just an internal one. Treat correctness of the data model and the review/approval flow as high-stakes.

### What this admin must do (current phase scope — product management only)
- **Product list**: searchable / filterable / paginated table of products.
- **Add / edit product**: form with image upload.
- **Vision-attribute review & approval**: show the structured attributes that Claude Vision extracted for a product, let a human review, correct, and approve them before the product is published.
- **Closed-enum dropdowns**: structured attributes (e.g. `color_family`) are selected from a fixed enum, never free-typed.
- **`is_published` toggle**: controls whether the agent may surface the product.
- **Embedding status indicator**: shows whether a product has CLIP embeddings. Display-only for now; this is a **Phase 2** feature.

Anything outside this scope (orders, customers, analytics, agent configuration) is **not** in the current phase. Do not build it unless explicitly asked.

---

## 2. Tech stack

**This repo (frontend / admin):**
- **Refine** (`@refinedev/core`) — headless admin framework: data fetching, routing, CRUD logic.
- **React + TypeScript + Vite**.
- **shadcn/ui** — the ONLY UI component library (see §5).
- **Tailwind CSS** for styling.
- **React Router** via `@refinedev/react-router`.
- Data provider: **`@refinedev/rest`** — `createSimpleRestDataProvider` from `@refinedev/rest/simple-rest`, configured in `src/providers/data.ts` and pointed at the agent backend's admin API.

> **Note:** the package is `@refinedev/rest` (the newer REST provider), not the older `@refinedev/simple-rest`. Both are in `package.json`, but `src/providers/data.ts` uses `@refinedev/rest`. Use that one.

**Auth (mock — to be wired to the real backend later):**
- `src/providers/auth.ts` is a **localStorage stub** (`TOKEN_KEY` from `src/providers/constants.ts`); pages exist under `src/pages/{login,register,forgotPassword}`.
- `App.tsx` does **not** yet gate routes with `<Authenticated>` — it currently renders only `WelcomePage`. Wiring real auth + protected routes is a TODO.

**Backend (separate repo — context only, do not edit from here):**
- NestJS + Fastify, running on **Bun**.
- **Drizzle ORM** + **PostgreSQL**.
- **Mastra** + **Claude API** for the agent and Vision attribute extraction.

> **Note:** the backend uses **Drizzle**, not `@nestjsx/crud`. That is why this repo uses the generic simple-rest data provider (not `@refinedev/nestjsx-crud`). See §6 for the API contract.

---

## 3. Repository structure

```
.
├── CLAUDE.md                  # you are here
├── README.md
├── .claude/
│   ├── settings.json          # permissions + the git-enforcement Stop hook
│   ├── hooks/
│   │   └── ensure-committed.sh # blocks finishing while the tree is dirty
│   └── commands/
│       ├── commit.md          # /commit  — conventional commit helper
│       └── new-resource.md    # /new-resource <name> — scaffold a resource
├── components.json            # shadcn/ui config (style: new-york, css: src/App.css)
├── vite.config.ts             # Vite + @tailwindcss/vite + "@" → ./src alias
├── index.html                 # NOTE: still lang="en", no dir — RTL not set up yet (see §7)
├── src/
│   ├── index.tsx              # app entry (referenced by index.html)
│   ├── App.tsx                # Refine setup: dataProvider, authProvider, router; renders WelcomePage (no resources yet)
│   ├── App.css                # Tailwind v4 (@import "tailwindcss") + @theme tokens + fonts. NO tailwind.config.ts
│   ├── lib/utils.ts           # cn() helper
│   ├── hooks/                 # e.g. use-mobile.ts
│   ├── providers/
│   │   ├── data.ts            # createSimpleRestDataProvider (@refinedev/rest/simple-rest)
│   │   ├── auth.ts            # mock localStorage auth provider
│   │   └── constants.ts       # API_URL (placeholder!) + TOKEN_KEY
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives (added via CLI)
│   │   └── refine-ui/         # Refine's shadcn kit: data-table, views, buttons, layout, theme, notification — REUSE these (§5)
│   └── pages/
│       ├── login/  register/  forgotPassword/   # auth pages (mock)
│       └── products/         # TODO — not scaffolded yet; the intended golden path. Use /new-resource products
```

> **No `.env.example`, no `tailwind.config.ts`, no `src/main.tsx`, no `src/index.css`** exist — those references in older notes are stale.

---

## 4. Development commands

The project targets **Bun** (the backend uses it too); npm also works.

```bash
bun install                 # install dependencies
bun run dev                 # refine dev — start the dev server
bun run build               # tsc && refine build — type-check + production build
bun run start               # refine start — serve the production build (there is NO `preview` script)
npx shadcn@latest add <c>   # add a shadcn/ui component (e.g. table, input, select, switch)
```

> **API URL is not env-wired yet.** It is hardcoded in `src/providers/constants.ts` as `API_URL`, currently pointing at the placeholder `https://api.fake-rest.refine.dev`. Repoint it at the real admin API. Moving it to `VITE_API_URL` (+ adding a `.env.example`) is a TODO.

---

## 5. UI: shadcn/ui (MANDATORY)

> **YOU MUST** build all UI from **shadcn/ui**. Do not introduce Material UI, Ant Design, Chakra, Bootstrap, or any other component library. Do not hand-roll bespoke components when a shadcn primitive exists.

- Add components with the CLI, never by guessing the source:
  ```bash
  npx shadcn@latest add button input select switch table form dialog badge sonner
  ```
  Added components land in `src/components/ui/`.
- Compose primitives; keep page-level components in `src/pages/`.
- **Reuse Refine's shadcn kit** under `src/components/refine-ui/` (e.g. `DataTable`, list/create/edit/show views, CRUD buttons, layout, theme, notification) for resource pages instead of hand-building them.
- Use the `cn()` helper from `src/lib/utils.ts` to merge class names.
- Use lucide-react for icons.
- The visual theme is driven by CSS variables in **`src/App.css`** (Tailwind v4, `@theme` block). Change colors and fonts there, not inline and not in a `tailwind.config.ts` (there isn't one). shadcn config is `new-york` style, `neutral` base.

---

## 6. Data layer (Refine + the backend API)

UI data flows through Refine's data provider, defined in `src/providers/data.ts` and wired into Refine in `src/App.tsx`. The simple-rest provider expects this from the backend admin API:

- **List** (`GET /products?_start=0&_end=10&_sort=created_at&_order=desc`): responds with a **JSON array** body and a **`x-total-count`** response header for pagination.
- **One** (`GET /products/:id`), **create** (`POST /products`), **update** (`PATCH /products/:id`), **delete** (`DELETE /products/:id`).

> **IMPORTANT:** if the backend cannot match the `simple-rest` contract above (array body + `x-total-count`), do not hack around it in components. Either align the backend endpoints, or write a small custom data provider in `src/providers/` that maps Refine's interface to the real API. Keep data-shape logic in the provider, never scattered across pages.

### Product data model (the part the agent depends on)
- `id`, `title`, `price`, `images[]`, `is_published` (boolean).
- **`color_family`** — a **closed enum** (e.g. `red`, `black`, `navy`, `beige`, ...). Always a `<Select>`; never free text. This must match the backend's enum and the agent's Structured Outputs vocabulary exactly.
- **`color_shade`** — free text (e.g. "burgundy", "wine").
- Color normalization (synonyms) is handled server-side via a `color_synonyms` table — **do not** reimplement it in the UI.
- **Vision attributes** — structured fields Claude Vision extracted from the product image. The UI shows them for **human review and approval** before publish. Approval state gates `is_published`.
- **Embedding status** — whether the product has a CLIP embedding (pgvector). Display-only, Phase 2.

When in doubt about Refine v5 APIs, trust the official docs over this file: https://refine.dev/docs and https://ui.shadcn.com .

---

## 7. RTL & Arabic (CRITICAL)

The brand and its customers are Arabic-speaking. The admin must be **right-to-left**.

> **⚠️ RTL IS REQUIRED BUT NOT YET IMPLEMENTED.** As of now the scaffold is LTR/English: `index.html` is `lang="en"` with **no `dir`**, the font is Geist (via `--font-sans` in `src/App.css`), and the shadcn + `refine-ui` components ship with physical classes. Setting this up is outstanding work — do not assume it is done.

> **YOU MUST** keep the app RTL-correct as you build. The document must be `dir="rtl" lang="ar"` (set this in `index.html`).

- **UI strings are in Arabic.** Buttons, labels, table headers, toasts, validation messages → Arabic.
- **Code is in English.** Identifiers, variable/function/file names, types, API fields, commit messages, comments → English. (Arabic text only ever appears as string literals shown to users.)
- **Use Tailwind LOGICAL properties, never physical ones**, so layout mirrors correctly:
  - margins/padding: `ms-*` / `me-*` / `ps-*` / `pe-*` (NOT `ml-*`/`mr-*`/`pl-*`/`pr-*`)
  - position/alignment: `start-*` / `end-*`, `text-start` / `text-end` (NOT `left-*`/`right-*`, `text-left`/`text-right`)
- **shadcn/ui components ship with physical classes by default.** When you add or edit a component, convert physical → logical classes so it works in RTL.
- **Directional icons must flip** (chevrons, arrows, "back"/"next"). Flip with `rtl:-scale-x-100` or by swapping the icon.
- **Switch to an Arabic-friendly font.** It is configured via `--font-sans` in the `@theme` block of **`src/App.css`** (currently Geist) — change it there, not in a `tailwind.config.ts`.

---

## 8. Git workflow (CRITICAL — every change must be committed)

> **YOU MUST commit every change you make.** Do not leave the working tree dirty when you finish a turn. A Stop hook (`.claude/hooks/ensure-committed.sh`) enforces this: if there are uncommitted changes when you try to finish, it will block you and ask you to commit. The block clears automatically once everything is committed.

Rules:
1. **Commit in logical units.** One coherent change per commit. Never bundle unrelated changes.
2. **Conventional Commits** for every message: `type(scope): summary`
   - types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`, `build`, `ci`
   - reference the active Linear ticket: `feat(products): add publish toggle (MASA-123)`
   - imperative mood, English, summary under ~72 chars.
3. **Branch naming:** `feature/<LINEAR-ID>-short-description` (e.g. `feature/MASA-123-product-review-flow`). Replace `MASA` with this project's actual Linear prefix if it differs.
4. **Never `git push`** and never `git reset --hard` without the user explicitly asking. (`git push` is denied in `.claude/settings.json`.)
5. Use the **`/commit`** slash command to do all of the above quickly.
6. If the user explicitly says *don't commit yet*, respect that — say so and stop instead of committing. (You can temporarily disable hooks with `"disableAllHooks": true` in settings if truly needed.)

---

## 9. Coding conventions
- TypeScript strict mode. No `any` unless unavoidable and commented.
- Functional components + hooks. Prefer Refine hooks for data; React state for local UI.
- Keep components small and composable. Co-locate a resource's pages under `src/pages/<resource>/`.
- Validate forms before submit; surface errors in Arabic.
- Don't add dependencies casually. shadcn primitives + Refine + lucide cover most needs.

## 10. Definition of done (before you finish a task)
- [ ] Type-checks (`bun run build` or `tsc --noEmit`).
- [ ] RTL-correct (logical classes, Arabic UI strings, flipped directional icons).
- [ ] UI built from shadcn/ui only.
- [ ] Data logic lives in the data provider, not scattered in components.
- [ ] All changes committed with Conventional Commit messages referencing the Linear ticket. Nothing left uncommitted.
