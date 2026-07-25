# Start Base

A lightweight personal homepage dashboard to quickly access and organize your favorite websites.

## Features

- 📌 **Bookmark Management** — Organize sites into custom groups
- 🎨 **Modern UI** — Clean and intuitive interface
- ⚡ **Drag & Drop** — Reorder sites and groups effortlessly
- 🖼️ **Auto Metadata** — Automatically fetch page titles and favicons
- 📱 **Responsive Design** — Works seamlessly on desktop and mobile
- 🔄 **Real-time Sync** — Changes saved instantly

## Quick Start

```bash
docker run -d \
  --name startbase \
  -p 5600:5600 \
  -e DATABASE_URL=sqlite:////app/data/db/start_base.db \
  -v "$(pwd)/data:/app/data" \
  harryxu/startbase:latest
```


## Usage

- **Open Link** — Click a site icon to open its URL
- **Edit/Delete** — Long-press (or right-click) a site to open context menu; click `•••` on group headers to manage groups
- **Reorder** — Drag sites between groups or drag the group handle to reorder groups
- **Auto-save** — All changes are saved automatically

