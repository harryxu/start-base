# Start Base

> A lightweight personal homepage dashboard to quickly access and organize your favorite websites.

![TypeScript](https://img.shields.io/badge/TypeScript-61.5%25-blue) ![Python](https://img.shields.io/badge/Python-29.3%25-green)

## ✨ Features

- 📌 **Bookmark Management** — Organize sites into custom groups
- 🎨 **Modern UI** — Clean and intuitive interface
- ⚡ **Drag & Drop** — Reorder sites and groups effortlessly
- 🖼️ **Auto Metadata** — Automatically fetch page titles and favicons
- 📱 **Responsive Design** — Works seamlessly on desktop and mobile
- 🔄 **Real-time Sync** — Changes saved instantly

## 🚀 Quick Start

### Backend
```bash
cd server
uv run uvicorn main:app --reload
```
Access API docs at http://localhost:8000/docs

### Frontend
```bash
cd web
pnpm install
pnpm start
```
Open http://localhost:4200 in your browser

## 🎯 How to Use

- **Open Link** — Click a site icon to open its URL
- **Edit/Delete** — Long-press (or right-click) a site to open context menu; click `•••` on group headers to manage groups
- **Reorder** — Drag sites between groups or drag the group handle to reorder groups
- **Auto-save** — All changes are saved automatically

## 📚 Documentation

- [Backend Guide](./server/README.md) — FastAPI development
- [Frontend Guide](./web/README.md) — Angular development
- [Agent Guide](./AGENTS.md) — Architecture overview

## 📄 License

MIT License

---

Questions? Open an [Issue](https://github.com/harryxu/start-base/issues)!
