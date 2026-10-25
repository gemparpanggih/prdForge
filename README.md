# PRD Forge

**From a rough idea to an execution-ready product blueprint.**

PRD Forge is a local-first web application that turns a short product brief into a professional PRD, an editable product flow, low-fidelity wireframes, a dependency-ordered execution plan, and a validated Markdown bundle for an AI coding agent.

It is designed for a single developer or product engineer working on one machine. There is no account system, no cloud sync, and no telemetry.

---

## What it does

1. **Discovery interview** — asks focused questions across 12 dimensions, tracks coverage, and records skipped answers as explicit assumptions instead of hidden guesses.
2. **PRD synthesis** — produces a structured document with problem, goals, personas, journeys, scope, functional requirements, non-functional requirements, technical baseline, risks, release plan, and QA strategy.
3. **Visual product flow** — a React Flow canvas with editable nodes and edges, requirement links, auto-layout, and a validation path for missing or unlinked screens.
4. **Low-fidelity wireframes** — screen nodes carry editable layout blocks and render as a clickable wireframe gallery.
5. **Task planning** — requirements map to foundation, feature, test, and documentation tasks with dependencies, acceptance criteria, test plans, Definition of Done, and self-contained agent prompts.
6. **Readiness review** — checks acceptance criteria, traceability, dependency cycles, flow coverage, NFR targets, blocking questions, and vague language.
7. **Export bundle** — `PRD.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `API_SPEC.md`, `TASKS.md`, `TASKS.json`, `prd.json`, `AGENTS.md`, Mermaid diagrams, and a manifest, packaged as a ZIP.

The PRD is the source of truth. Canvas edits can be applied back to the PRD through an explicit versioned action, so the document is never silently overwritten.

---

## Tech Stack

| Layer | Choice |
| --- | --- |
| Application | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, custom design tokens |
| Database | Embedded PostgreSQL via PGlite |
| ORM | Drizzle ORM with versioned SQL migrations |
| Canvas | React Flow (`@xyflow/react`) |
| Validation | Zod |
| AI | Direct provider adapters for OpenAI-compatible, Anthropic, Google Gemini, and Ollama Cloud APIs |
| Export | JSZip, pure Markdown renderers |
| Tests | Vitest |

PGlite keeps the local setup to `npm install && npm run dev` while preserving PostgreSQL semantics and Drizzle support. The schema is standard PostgreSQL.

---

## Quick Start

Requirements: **Node.js 24+** and npm.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

The first request creates the local database. The encryption key is created the first time you save a provider key, unless `APP_ENCRYPTION_KEY` is supplied.

### AI provider

Open **Settings**, choose a provider, and save:

- OpenAI (or an OpenAI-compatible endpoint)
- OpenRouter
- Anthropic
- Google Gemini
- Ollama (local, no key required)
- Ollama Cloud (API key required)
- Any custom OpenAI-compatible endpoint

The model name and base URL are editable. Use the exact model identifier accepted by the provider.

For **Ollama Cloud**, PRD Forge uses the OpenAI-compatible endpoint `https://ollama.com/v1` and sends your API key as a Bearer token. Create a key at [ollama.com/settings/keys](https://ollama.com/settings/keys), then enter a cloud model ID such as `gemma4:31b`. Cloud model IDs can be browsed at [ollama.com/search?c=cloud](https://ollama.com/search?c=cloud).

Without a provider, the deterministic local engine produces a complete blueprint. It is useful for demos, offline work, and testing. When a provider is configured but a stage fails, PRD Forge falls back to the local engine and records a warning instead of losing the project.

### Tech stack presets

Every project can choose how the technical blueprint is produced:

- **Auto** — the AI chooses the most appropriate stack. The local engine uses a project-type heuristic: web products default to Next.js + PostgreSQL; mobile products default to React Native + Supabase.
- **Preset** — choose a popular stack and environment: Next.js + PostgreSQL, MERN + Docker, Laravel + MySQL, Django + PostgreSQL, FastAPI + React, Rails + PostgreSQL, Spring Boot + PostgreSQL, React Native + Supabase, Flutter + Firebase, Serverless AWS, or Astro + Headless CMS.
- **Custom** — describe your own stack and deployment environment in free text.

The selection is a project-level constraint. It is applied to the local engine and passed to the AI as a hard requirement, so the PRD, architecture, requirements, flow, and task prompts stay aligned. The selected stack is shown in the project header and can be inspected in the Technical section of the PRD. Manual technical edits are still possible, but regenerating the blueprint applies the project constraint again.

Provider keys are encrypted with AES-256-GCM before they are written to the database. The raw key is never returned to the browser. If `APP_ENCRYPTION_KEY` is not set, a 32-byte key is generated at `.data/master.key` with mode `0600`.

### Theme and language

Use the control at the bottom of the sidebar, or the **Appearance & language** card in Settings, to switch between the dark and light themes and between English and Bahasa Indonesia.

The defaults are the dark theme and English. Preferences are stored in local cookies (`prd_theme` and `prd_language`) and applied during server rendering, so the selected theme and language survive reloads without a flash.

The interface is bilingual. Generated PRD content, requirements, task prompts, and export files remain in English so they stay consistent for AI coding agents; the UI language does not change the generated document language.

### Local data

```text
.data/
  pglite/       # embedded PostgreSQL data
  master.key    # generated encryption key
```

Back up both paths together. Losing `master.key` makes stored provider keys unreadable. To reset the local workspace, stop the server and delete `.data/`.

Environment overrides are documented in `.env.example`.

---

## Commands

```bash
npm run dev        # local development
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint
npm run typecheck  # TypeScript, no emit
npm test           # Vitest unit suite
npm run check      # lint + typecheck + tests
npm run smoke      # end-to-end local-engine smoke test in a temp data directory
```

`npm run smoke` creates a project, completes the interview, generates a blueprint, runs readiness, and creates an export bundle. It does not require an AI key.

---

## Export bundle

```text
<project>-prd-v<version>.zip
  README.md
  PRD.md
  ARCHITECTURE.md
  DATA_MODEL.md
  API_SPEC.md
  TASKS.md
  TASKS.json
  prd.json
  AGENTS.md
  OPEN_ISSUES.md        # present when the export gate is overridden
  diagrams/
    product-flow.mmd
    task-flow.mmd
  manifest.json
```

`AGENTS.md` defines the execution protocol for a coding agent: read order, dependency discipline, quality gates, scope control, and the report format. `TASKS.md` is ordered by dependencies, not just numeric IDs.

The export gate blocks download while a blocker remains. The UI can override the gate and includes `OPEN_ISSUES.md` in the bundle.

---

## Architecture notes

```text
src/
  app/                  # pages and route handlers
  components/           # dashboard, interview, PRD, flow, tasks, review, export, settings
  lib/                  # types, schemas, draft engine, readiness, Markdown, crypto
  server/
    ai.ts               # provider adapters and structured-output repair loop
    blueprint.ts        # local/AI generation pipeline
    interview.ts        # adaptive question state and coverage
    projects.ts         # persistence and traceability services
    export.ts           # bundle assembly and export history
    db/                 # Drizzle schema and PGlite bootstrap
```

Generation pipeline:

1. Resolve the configured provider and model.
2. Generate a structured PRD; validate with Zod; retry once with the validation error.
3. Generate a task graph; validate IDs, dependencies, cycles, and FR coverage.
4. Generate the product flow and wireframes; validate endpoints and requirement links.
5. If any AI stage fails, fall back to the deterministic local blueprint for the whole generation so the document, tasks, and flow remain consistent.
6. Save a new immutable PRD version, replace the task list, replace the flow, and recalculate readiness.

Flow node and edge IDs are namespaced per project because they are persisted as primary keys. Task IDs remain stable within a project; each task also has a unique database row ID.

---

## Scope and limitations

This is a focused local application, not a full no-code builder.

- Single user; no authentication or collaboration.
- The canvas models requirements and screens; it does not render or execute the resulting application.
- No code scaffolding or deployment automation.
- No GitHub/Linear/Jira sync.
- PGlite is embedded PostgreSQL, not a separate database server.
- Model availability and rate limits depend on the configured provider.
- The local engine is deterministic and intentionally generic; use an AI provider for domain-specific synthesis.

---

## Security

- Local-only by default; the Next.js server binds to `127.0.0.1`.
- API keys are encrypted at rest and masked in the UI.
- Markdown is rendered with React Markdown; raw HTML is not enabled by default.
- Export files are generated in memory and only returned for known manifest paths.
- No outbound telemetry. Network requests go only to the configured AI provider.

Do not expose the development server to an untrusted network without adding authentication and a reverse proxy.
