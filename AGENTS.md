# Start Base — Agent Guide

> Personal homepage dashboard. A single-page app for bookmarking and organizing websites, inspired by [gethomepage.dev](https://gethomepage.dev).

## Project Structure

```
start-base/
├── AGENTS.md          ← You are here
├── server/            ← Python FastAPI backend
│   ├── main.py        ← FastAPI app entry point
│   ├── app/
│   │   ├── models.py      ← SQLModel DB models + Pydantic schemas
│   │   ├── database.py    ← SQLite engine + session factory
│   │   ├── routers/
│   │   │   ├── sites.py   ← Site CRUD + reorder endpoints
│   │   │   └── groups.py  ← Group CRUD + reorder endpoints
│   │   └── services/
│   │       └── metadata.py ← Fetch page title & favicon from URL
│   ├── alembic/       ← DB migrations (Alembic)
│   ├── tests/         ← API tests (pytest)
│   └── start_base.db  ← Local SQLite database
└── web/               ← Angular v22 frontend (pnpm)
    └── src/app/
        ├── core/
        │   ├── models/types.ts     ← TypeScript interfaces
        │   └── api/api.service.ts  ← HTTP service wrapper
        ├── features/home/          ← Main page component
        └── shared/
            ├── site-card/          ← Single site card component
            ├── group-container/    ← Group container component
            └── site-form/          ← Add/edit site modal
```

## Tech Stack

| Layer                      | Technology                                                                      |
| -------------------------- | ------------------------------------------------------------------------------- |
| Backend language           | Python 3.13                                                                     |
| Package manager (backend)  | [uv](https://docs.astral.sh/uv/)                                                |
| Web framework              | [FastAPI](https://fastapi.tiangolo.com/)                                        |
| ORM                        | [SQLModel](https://sqlmodel.tiangolo.com/)                                      |
| DB                         | SQLite (`server/start_base.db`)                                                 |
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
```

## API Contract

### Base URL
`http://localhost:8000`

### Sites
| Method   | Path                 | Description                                           |
| -------- | -------------------- | ----------------------------------------------------- |
| `GET`    | `/api/sites/`        | List all sites (ordered by `sort_order`)              |
| `POST`   | `/api/sites/`        | Create site; missing title/icon fetched in background |
| `PATCH`  | `/api/sites/{id}`    | Update site fields                                    |
| `DELETE` | `/api/sites/{id}`    | Delete site                                           |
| `POST`   | `/api/sites/reorder` | Bulk update `sort_order` + `group_id`                 |

### Groups
| Method   | Path                  | Description                               |
| -------- | --------------------- | ----------------------------------------- |
| `GET`    | `/api/groups/`        | List all groups (ordered by `sort_order`) |
| `POST`   | `/api/groups/`        | Create group                              |
| `PATCH`  | `/api/groups/{id}`    | Update group name/sort_order              |
| `DELETE` | `/api/groups/{id}`    | Delete group (sites become ungrouped)     |
| `POST`   | `/api/groups/reorder` | Bulk update `sort_order`                  |

### Data Models

```typescript
// Site
{ id, url, title, icon_url, description, sort_order, group_id }

// Group
{ id, name, sort_order }
```

**`sort_order`**: Float used globally. Ungrouped sites and groups share the same sort_order space to determine interleaved layout. Within-group site order is local to the group.

## Frontend Architecture

### Single Interactive Mode & Layout
- **Single Interactive Mode**: Unified mode for both touch and mouse. Click opens URL; long-press (500ms) or right-click opens CDK Context Menu (`Edit`, `Delete`); press-and-drag reorders elements.
- **Layout Computation**: `HomeComponent` computes `LayoutRow[]` from raw sites+groups.
- **Drag and Drop (Angular CDK)**: Outer `cdkDropList` for group row reordering; inner `cdkDropList` for site reordering (connected between sections). Dragging auto-saves sorting position to backend upon drop.
- **State Management**: Angular Signals (`signal`, `computed`, `effect`) for local layout synchronization; TanStack Query for server state.

## Code Conventions

- **Language**: All code, comments, and docs in **English**
- **Components**: Angular standalone components only
- **Signals**: Prefer `signal()`, `computed()`, `input()`, `output()` over `@Input`/`@Output`
- **HTTP**: Use `firstValueFrom(observable)` to convert RxJS → Promise for TanStack Query
- **Icons**: Import from `@lucide/angular`, use as SVG directive: `<svg lucidePencil class="w-4 h-4">`
- **CSS**: Prefer DaisyUI classes (e.g. `btn`, `card`, `input`, `modal`, `alert`, etc.) combined with Tailwind utility classes in templates to maintain a consistent component design; use component `styles` for complex selectors.
- **No auth**: Single-user local tool, no authentication needed
- **Testing**: Ensure that test coverage is updated synchronously whenever features are added, modified, or adjusted across both Python backend (`server/tests/`) and Angular frontend (`web/` via `pnpm test` / `ng test`). All tests must be kept green.

## Environment

- Backend CORS allows: `http://localhost:4200`, `http://localhost:3000`, `http://127.0.0.1:4200`
- Frontend API base URL: `http://localhost:8000` (configured in `core/api/api.service.ts`)
- DB file: `server/start_base.db` (SQLite, gitignored)
