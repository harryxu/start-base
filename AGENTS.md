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
│   └── alembic/       ← DB migrations (Alembic)
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

| Layer | Technology |
|-------|-----------|
| Backend language | Python 3.13 |
| Package manager (backend) | [uv](https://docs.astral.sh/uv/) |
| Web framework | [FastAPI](https://fastapi.tiangolo.com/) |
| ORM | [SQLModel](https://sqlmodel.tiangolo.com/) |
| DB | SQLite (`server/start_base.db`) |
| Migrations | [Alembic](https://alembic.sqlalchemy.org/) |
| Frontend framework | [Angular v22](https://angular.dev/) standalone components |
| Package manager (frontend) | pnpm |
| CSS | Tailwind CSS v4 (light theme) |
| State management | Angular Signals |
| Server state | [TanStack Query (`@tanstack/angular-query`)](https://tanstack.com/query/latest) |
| Icons | [`@lucide/angular`](https://lucide.dev/guide/angular/) |
| Drag and drop | [Angular CDK Drag Drop](https://angular.dev/guide/drag-drop) |

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
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/sites/` | List all sites (ordered by `sort_order`) |
| `POST` | `/api/sites/` | Create site; missing title/icon fetched in background |
| `PATCH` | `/api/sites/{id}` | Update site fields |
| `DELETE` | `/api/sites/{id}` | Delete site |
| `POST` | `/api/sites/reorder` | Bulk update `sort_order` + `group_id` |

### Groups
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/groups/` | List all groups (ordered by `sort_order`) |
| `POST` | `/api/groups/` | Create group |
| `PATCH` | `/api/groups/{id}` | Update group name/sort_order |
| `DELETE` | `/api/groups/{id}` | Delete group (sites become ungrouped) |
| `POST` | `/api/groups/reorder` | Bulk update `sort_order` |

### Data Models

```typescript
// Site
{ id, url, title, icon_url, description, sort_order, group_id }

// Group
{ id, name, sort_order }
```

**`sort_order`**: Float used globally. Ungrouped sites and groups share the same sort_order space to determine interleaved layout. Within-group site order is local to the group.

## Frontend Architecture

### Page Modes
- **View mode** (default): Read-only. Click site to open URL. Groups collapsible.
- **Edit mode**: Drag-and-drop reordering. Hover controls (edit/delete). Save commits all changes.

### Layout Computation
The `HomeComponent` computes `LayoutRow[]` from raw sites+groups:
- Sort groups and ungrouped sites by `sort_order` together
- Merge consecutive ungrouped sites into a single "ungrouped row"
- Groups render as bordered containers with their grouped sites inside

### Drag and Drop (Angular CDK)
- Outer `cdkDropList` for row (section) reordering — group rows are `cdkDrag` with grip handle
- Inner `cdkDropList` per section for site reordering (connected between sections)
- Sites can be transferred between groups and ungrouped areas
- On Save: compute new `sort_order` values and POST to reorder endpoints

### State Management
- `editMode` signal: controls view/edit mode
- `localRows` signal: mutable layout copy used during edit mode
- TanStack Query: server state (sites, groups) with cache invalidation on mutation

## Code Conventions

- **Language**: All code, comments, and docs in **English**
- **Components**: Angular standalone components only
- **Signals**: Prefer `signal()`, `computed()`, `input()`, `output()` over `@Input`/`@Output`
- **HTTP**: Use `firstValueFrom(observable)` to convert RxJS → Promise for TanStack Query
- **Icons**: Import from `@lucide/angular`, use as SVG directive: `<svg lucidePencil class="w-4 h-4">`
- **CSS**: Tailwind utility classes in templates; component `styles` for complex selectors
- **No auth**: Single-user local tool, no authentication needed

## Environment

- Backend CORS allows: `http://localhost:4200`, `http://localhost:3000`, `http://127.0.0.1:4200`
- Frontend API base URL: `http://localhost:8000` (configured in `core/api/api.service.ts`)
- DB file: `server/start_base.db` (SQLite, gitignored)
