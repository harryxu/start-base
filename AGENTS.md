# Start Base — Agent Guide

> Personal homepage dashboard. A single-page app for bookmarking and organizing websites, inspired by [gethomepage.dev](https://gethomepage.dev).

## Project Structure

```
start-base/
├── .agents/
│   └── session-summary/ ← Session handover summaries
├── server/            ← Python FastAPI backend
│   ├── app/           ← Core application logic (models, database, routers, services)
│   ├── alembic/       ← Database migrations
│   ├── tests/         ← API tests (pytest)
│   └── data/          ← Local data storage (SQLite DB, uploaded files/icons)
└── web/               ← Angular v22 frontend
    └── src/app/
        ├── core/      ← Core services, models/types, interceptors
        ├── layout/    ← App shell & header layout components
        ├── features/  ← Feature domain modules (auth, board, settings)
        └── shared/    ← Generic UI components, directives, dialogs
```

## Tech Stack

| Layer                      | Technology                                                                      |
| -------------------------- | ------------------------------------------------------------------------------- |
| Backend language           | Python 3.13                                                                     |
| Package manager (backend)  | [uv](https://docs.astral.sh/uv/)                                                |
| Web framework              | [FastAPI](https://fastapi.tiangolo.com/)                                        |
| ORM                        | [SQLModel](https://sqlmodel.tiangolo.com/)                                      |
| DB                         | SQLite (`server/data/db/start_base.db`)                                         |
| Migrations                 | [Alembic](https://alembic.sqlalchemy.org/)                                      |
| Frontend framework         | [Angular v22](https://angular.dev/) standalone components                       |
| Package manager (frontend) | pnpm                                                                            |
| CSS                        | Tailwind CSS v4 (light theme)                                                   |
| State management           | Angular Signals                                                                 |
| Server state               | [TanStack Query (`@tanstack/angular-query`)](https://tanstack.com/query/latest) |
| Icons                      | [`@lucide/angular`](https://lucide.dev/guide/angular/)                          |
| Drag and drop              | [Angular CDK Drag Drop](https://angular.dev/guide/drag-drop)                    |

## Development Commands

### Backend
```bash
cd server

# Install dependencies
uv add "fastapi[standard]" sqlmodel alembic httpx beautifulsoup4

# Start dev server (port 8000)
uv run uvicorn main:app --reload

# Database migrations
uv run alembic revision --autogenerate -m "describe change"
uv run alembic upgrade head

# Run tests (using in-memory SQLite)
uv run pytest

# API docs: http://localhost:8000/docs
```

### Frontend

Use `mise exec --` when running node related commands such as `node`, `npm`, `pnpm`, and `npx` to ensure the versions defined in `mise.toml` are used.

```bash
cd web

# Install packages
pnpm install

# Start dev server (port 4200)
pnpm start

# Build for production
pnpm build

# Run targeted unit tests for modified spec file(s)
pnpm ng test --no-watch --include src/app/features/board/site-form/site-form.component.spec.ts

# Run full test suite
pnpm ng test --no-watch
```

## API Documentation

When backend API specifications and schemas are needed, fetch the OpenAPI schema directly from:
- **OpenAPI Schema**: `http://localhost:5600/openapi.json`
- **Interactive Docs**: `http://localhost:5600/docs`


## Frontend Architecture

### Single Interactive Mode & Layout
- **Single Interactive Mode**: Unified mode for both touch and mouse. Click opens URL; long-press (500ms) or right-click opens CDK Context Menu (`Edit`, `Delete`); press-and-drag reorders elements.
- **Layout Computation**: `HomeComponent` computes `LayoutRow[]` from raw sites+groups.
- **Drag and Drop (Angular CDK)**: Outer `cdkDropList` for group row reordering; inner `cdkDropList` for site reordering (connected between sections). Dragging auto-saves sorting position to backend upon drop.
- **State Management**: Angular Signals (`signal`, `computed`, `effect`) for local layout synchronization; TanStack Query for server state.
- **Color System & Theming**: All colors must use DaisyUI semantic color classes and CSS variables.

## Code Conventions

- **Language**: All code, comments, and docs in **English**
- **Components**: Angular standalone components only
- **Signals**: Prefer `signal()`, `computed()`, `input()`, `output()` over `@Input`/`@Output`
- **HTTP**: Use `firstValueFrom(observable)` to convert RxJS → Promise for TanStack Query
- **Icons**: Import from `@lucide/angular`, use as SVG directive: `<svg lucidePencil class="w-4 h-4">`
- **CSS & Styling**:
  - Prefer DaisyUI classes (e.g. `btn`, `card`, `input`, `modal`, `alert`, `kbd`, etc.) combined with minimal Tailwind utility classes in templates to maintain a consistent component design; use component `styles` for complex selectors. Avoid using `!important` in CSS unless absolutely necessary.
  - **Minimalism & Cleanliness**: Only add essential Tailwind utility classes to HTML elements. Do NOT add redundant or useless classes (e.g. default resets like `py-0`, `min-h-0`, `leading-none`, duplicate sizing or flex properties) that clutter the template and make code hard to read and maintain. Rely on DaisyUI's built-in component styles whenever possible.
- **Testing**:
  - Keep tests green across Python backend (`server/tests/`) and Angular frontend (`web/`).
  - Frontend Angular test coverage should focus exclusively on **core business logic and functional workflows** (e.g., state transformations, service interactions, form submissions, event handling).
  - **No tests for purely presentational changes**: Minor UI modifications (e.g., adding/changing icons, CSS/Tailwind styling tweaks, layout adjustments, static labels/templates) do **not** require writing or updating unit tests.
  - When making targeted code changes, pass the `--include` flag to `ng test` (e.g., `pnpm ng test --no-watch --include src/app/path/to/file.spec.ts`) to run unit tests specifically for the modified/added components or services. Only run the full test suite (`pnpm ng test --no-watch`) when changes impact widespread files across the codebase.

## Session Summaries

When compressing and summarizing the current session into a handover document for subsequent sessions to use as context:
- Save the summary document to `.agents/session-summary/`.
- Name the file with the format: `{datetime}-{topic}.md` (e.g. `2026-08-24-plugin-cache-handover.md` or `20260824-011800-plugin-cache.md`).

