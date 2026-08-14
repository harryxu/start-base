# Start Base — Agent Guide

> Personal homepage dashboard. A single-page app for bookmarking and organizing websites, inspired by [gethomepage.dev](https://gethomepage.dev).

## Project Structure

```
start-base/
├── server/            ← Python FastAPI backend
│   ├── app/           ← Core application logic (models, database, routers, services)
│   ├── alembic/       ← Database migrations
│   ├── tests/         ← API tests (pytest)
│   └── data/          ← Local data storage (SQLite DB, uploaded files/icons)
└── web/               ← Angular v22 frontend
    └── src/app/
        ├── core/      ← Core services, models/types, interceptors
        ├── features/  ← Feature components and views
        └── shared/    ← Reusable UI components, directives, dialogs
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
```bash
cd web

# Install packages
pnpm install

# Start dev server (port 4200)
pnpm start

# Build for production
pnpm build

# Run targeted unit tests for modified spec file(s)
pnpm ng test --no-watch --include src/app/features/site-form/site-form.component.spec.ts

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
- **CSS**: Prefer DaisyUI classes (e.g. `btn`, `card`, `input`, `modal`, `alert`, etc.) combined with Tailwind utility classes in templates to maintain a consistent component design; use component `styles` for complex selectors.
- **Testing**:
  - Keep tests green across Python backend (`server/tests/`) and Angular frontend (`web/`).
  - Frontend Angular test coverage should prioritize **business logic and functional workflows** (e.g., state transformations, service interactions, event handling). Purely presentational details (e.g., specific CSS styling classes or static UI prompt messages) do not require exhaustive test assertions.
  - When making targeted code changes, pass the `--include` flag to `ng test` (e.g., `pnpm ng test --no-watch --include src/app/path/to/file.spec.ts`) to run unit tests specifically for the modified/added components or services. Only run the full test suite (`pnpm ng test --no-watch`) when changes impact widespread files across the codebase.
