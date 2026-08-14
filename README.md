# Start Base

Lightweight dashboard to quickly access your websites.

![Screen 1](./assets/screen1.png)

## Features

- 📌 **Bookmark Management** — Organize sites into custom groups
- ⚡ **Drag & Drop** — Reorder sites and groups, long-press to drag sites.
- 🖼️ **Auto Metadata** — Automatically fetch page titles and favicons
- 📱 **Responsive Design** — Works seamlessly on desktop and mobile

## Quick Start

```bash
docker run -d \
  --name startbase \
  -p 5600:5600 \
  -e DATABASE_URL=sqlite:////app/data/db/start_base.db \
  -v "$(pwd)/data:/app/data" \
  harryxu/startbase:latest
```


## Themes

Upload your favorite background image.

![Screen 2](./assets/screen2.png)