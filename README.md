# Start Base

Lightweight dashboard to quickly access your websites.

![Screen 1](./docs/assets/screen1.png)


<p align="center">
  <a href="https://startbase-demo.onrender.com">
    <strong>Live Demo</strong>
  </a> •
  <a href="https://www.youtube.com/watch?v=5lDdiElmCYU">
    <strong> Screencast</strong>
  </a> •
  <a href="https://github.com/harryxu/start-base/blob/master/docs/plugin.md">
    <strong>Plugin System </strong>
  </a> 
</p>

## Features

- **Intuitive UI** — Manage all settings and sites directly in the UI without editing configuration files
- **Grouped Sites** — Organize sites into custom groups
- **Drag & Drop** — Reorder sites and groups, long-press to drag sites
- **Auto Metadata** — Automatically fetch page titles and favicons
- **Responsive Design** — Works seamlessly on desktop and mobile
- **Extensible** — Use the [plugin system](./docs/plugin.md) to add more functionality
- **PWA Support** — Install as a [Progressive Web App](https://web.dev/learn/pwa/progressive-web-apps).

## Quick Start

```bash
docker run -p 5600:5600 -v "$(pwd)/data:/app/data" harryxu/startbase:latest
```

## Themes

Upload your favorite background image.

![Screen 2](./docs/assets/screen2.png)
