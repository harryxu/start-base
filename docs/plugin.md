# Start Base Plugin Development & Integration Guide

Start Base supports custom plugins. When creating or editing a site, you can switch to **Plugin Mode**. In Plugin Mode, card dimensions and layout follow the dashboard grid, while the plugin controls the inner content and interaction logic.

---

## Overview & Concepts

Start Base supports two plugin types:

| Plugin Type | Features | Best Suited For |
| :--- | :--- | :--- |
| **Iframe Plugin** | Sandboxed environment, supports any standalone web page without tech stack limits. | Third-party widgets, independent tools, external dashboards. |
| **Web Component Plugin** | Runs in host DOM, supports `<dialog>` modals, Popovers, and inherits DaisyUI theme styles. | Interactive widgets (to-do lists, weather cards, search panels). |

Common features:
- **Grid Sizes**: Supports `1×1`, `2×1`, `1×2`, `2×2`, and custom spans.
- **Drag-and-Drop**: Reorder between groups and ungrouped sections.
- **Context Menu**: Right-click or mobile long-press to edit or delete.

---

## Parameter Passing

Start Base passes two types of parameters to plugins: **System Parameters** and **Custom Parameters**.

### System Parameters

| Parameter Key | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `card-size` | string | Card grid size. | `'1x1'`, `'2x1'`, `'1x2'`, `'2x2'` |
| `title` | string | Configured plugin title. | `'Weather Widget'` |
| `description` | string | Configured description. | `'Real-time forecast'` |
| `theme` | string | Active system theme name. | `'emerald'`, `'dark'`, `'night'`, etc. |
| `theme-mode` | string | Active theme mode. | `'light'` or `'dark'` |

### Custom Parameters

Custom parameters use `key=value` format (one pair per line):

```text
city=London
apiKey=my-secret-key-123
refreshInterval=30
```

- Empty lines and lines starting with `#` are ignored.
- **Iframe Plugins**: Parameters are appended as **URL query strings** (`?card-size=2x1&theme=emerald&city=London...`).
- **Web Component Plugins**: Parameters are passed as **DOM attributes** and as an object to the mount function.

---

## Iframe Plugin Development

An Iframe plugin is a standard web page (HTML/CSS/JS) hosted on any server.

### Parameter Access via Query String

```javascript
const params = new URLSearchParams(window.location.search);
const cardSize = params.get('card-size'); // e.g., '2x1'
const title = params.get('title');
const theme = params.get('theme'); // e.g., 'emerald', 'dark'
const themeMode = params.get('theme-mode'); // 'light' | 'dark'
const city = params.get('city') || 'London';
```

### Example: Live Clock (`clock.html`)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: transparent; color: inherit; }
    .time { font-size: 1.5rem; font-weight: bold; }
  </style>
</head>
<body>
  <div class="time" id="time"></div>
  <div id="title" style="font-size: 0.75rem; opacity: 0.7;"></div>
  <script>
    const params = new URLSearchParams(window.location.search);
    document.getElementById('title').textContent = params.get('title') || 'Clock';
    const update = () => document.getElementById('time').textContent = new Date().toLocaleTimeString();
    setInterval(update, 1000);
    update();
  </script>
</body>
</html>
```

---

## Web Component Plugin Development

Web Component plugins are delivered as **ES Modules (`.js` files)** that run in the host DOM.

### Custom Element Pattern (with `<dialog>` Modal)

```javascript
class WeatherPlugin extends HTMLElement {
  connectedCallback() {
    const city = this.getAttribute('city') || 'London';
    this.innerHTML = `
      <div class="p-3 flex flex-col justify-between h-full select-none">
        <span class="font-bold text-sm">${city}: 22°C</span>
        <button id="open-btn" class="btn btn-xs btn-primary">Forecast</button>
      </div>
      <dialog id="modal" class="modal">
        <div class="modal-box">
          <h3 class="font-bold text-lg">${city} Forecast</h3>
          <p class="py-2 text-sm">Sunny ☀️ | Humidity: 45%</p>
          <button id="close-btn" class="btn btn-sm mt-2">Close</button>
        </div>
      </dialog>
    `;

    const dialog = this.querySelector('#modal');
    this.querySelector('#open-btn').onclick = (e) => { e.stopPropagation(); dialog.showModal(); };
    this.querySelector('#close-btn').onclick = () => dialog.close();
  }
}

export default WeatherPlugin;
```

### Lifecycle Object Pattern

```javascript
export default {
  mount(container, props) {
    container.innerHTML = `
      <div class="p-3 h-full flex flex-col justify-between" data-theme="${props.theme}">
        <span class="font-bold text-sm">${props.title || 'Widget'}</span>
        <span class="text-xs opacity-70">Size: ${props['card-size']} | Theme: ${props.theme} (${props['theme-mode']})</span>
      </div>
    `;
  },
  unmount(container) {
    container.innerHTML = '';
  },
};
```

### Framework Integration (Vue 3 / React + Vite)

Plugins can be built with UI frameworks and bundled into a single `.js` file via Vite:

- **Vue 3 Custom Elements**: [Vue.js Guide - Custom Elements](https://vuejs.org/guide/extras/web-components.html) (`defineCustomElement`)
- **React in Web Components**: [React createRoot API](https://react.dev/reference/react-dom/client/createRoot) (render inside `connectedCallback`)
- **Vite Library Mode**: [Vite Guide - Library Mode](https://vite.dev/guide/build.html#library-mode)

---

### Caching, Upload & Same-Origin Delivery

To prevent CORS issues and support offline or local hosting:

1. **Direct Script Upload**: Upload `.js` / `.mjs` files directly using the upload button next to the Plugin URL input.
2. **Automatic Remote Download**: When a remote URL is entered, the backend downloads and caches the script into `server/data/files/plugins/{hash}-{sanitized_name}.js`.
3. **Deduplication & Hashing**: All plugins are stored using a 16-character SHA-256 hash plus sanitized name (e.g., `a1b2c3d4e5f67890-demo-plugin.js`). Identical files share a single cached copy.
4. **Static Delivery**: The frontend loads plugins from `/static/plugins/{hash}-{sanitized_name}.js`.
5. **Sync**: `POST /api/sites/{id}/sync-plugin` re-fetches remote scripts or re-parses local plugin metadata.
6. **Cleanup**: Unreferenced plugin files are automatically deleted when sites are removed or modified.

---

### Plugin Metadata Annotations

You can declare metadata using comment annotations. The backend parses them on download or upload:

```javascript
/**
 * @name Weather & Homelab Widget
 * @version 1.0.0
 * @author Developer
 * @description Real-time forecast & LAN status
 * @api_urls https://api.weatherapi.com/v1/, https://jsonplaceholder.typicode.com/users, http://192.168.1.100:8123/api/
 */
```

| Directive | Description | Example |
| :--- | :--- | :--- |
| `@api_urls <url1, url2>` | Allowed API URL prefixes for the network proxy. | `@api_urls https://jsonplaceholder.typicode.com/users`<br>`@api_urls https://api.weatherapi.com/v1/, http://192.168.1.100:8123/api/` |
| `@name <name>` | Display name for the plugin. | `@name Weather Widget` |
| `@version <ver>` | Plugin version. | `@version 1.0.0` |
| `@description <desc>` | Plugin description. | `@description Real-time forecast` |
| `@author <author>` | Author name. | `@author Harry` |

> [!NOTE]
> Metadata annotations are optional. Outbound requests through `context.fetch` are allowed only when the target URL matches declared `@api_urls` prefixes.
> 
> Prefix matching applies (no wildcards). For example, `https://jsonplaceholder.typicode.com/users` allows `/users/1`. To allow all endpoints on a host, use `https://jsonplaceholder.typicode.com/`.

---

### Proxy Network API (`context.fetch`)

To avoid CORS restrictions and access external or local APIs, use the proxied `fetch` helper from the plugin context:

#### In Custom Elements:
```javascript
class WeatherPlugin extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = '<span class="loading loading-spinner loading-xs"></span>';

    try {
      const response = await this.context.fetch('https://api.weatherapi.com/v1/current.json?q=London', {
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        this.innerHTML = `<span class="font-bold">${data.location.name}: ${data.current.temp_c}°C</span>`;
      } else {
        this.innerHTML = `<span class="text-error text-xs">Error: ${response.status}</span>`;
      }
    } catch (err) {
      this.innerHTML = `<span class="text-error text-xs">Failed: ${err.message}</span>`;
    }
  }
}

export default WeatherPlugin;
```

#### In Lifecycle Object:
```javascript
export default {
  async mount(container, props, context) {
    container.innerHTML = '<span class="loading loading-spinner"></span>';
    const resp = await context.fetch('https://jsonplaceholder.typicode.com/users');
    const users = await resp.json();
    const count = Array.isArray(users) ? users.length : 0;
    container.innerHTML = `<div class="p-2 text-xs">Users: ${count}</div>`;
  },
  unmount(container) {
    container.innerHTML = '';
  },
};
```

---

### LAN & Homelab Access Control

Outbound proxy requests follow security restrictions:
- **Cloud Metadata**: Requests to link-local metadata endpoints (`169.254.169.254`) and multicast addresses are blocked.
- **LAN Access**: Private IP ranges (`192.168.0.0/16`, `10.0.0.0/8`, `172.16.0.0/12`) are blocked by default.
- **LAN Toggle**: Enable **"Allow LAN / Private Network Access"** in the site form for local devices (e.g., Home Assistant, NAS).

---

### Demo Plugin & Local Testing

A ready-to-run demo plugin is available at [`docs/demo-plugin.js`](./demo-plugin.js).

To serve it locally:

```bash
cd docs
python3 -m http.server 8016
```

In Start Base:
- **Plugin Type**: `Web Component`
- **Plugin URL / Upload**: Enter `http://localhost:8016/demo-plugin.js` or upload `demo-plugin.js` directly.
- **Custom Parameters**:
  ```text
  author=YourName
  greeting=Hello World!
  ```
- **Allow LAN Access**: Enable if testing local endpoints.

---

## Adding Plugins in Start Base

1. Click **"Add Site"** in the top bar or inside any group.
2. Check **`[✓] Plugin Mode`** in the dialog footer.
3. Choose **Plugin Type** (`Web Component` or `iframe`).
4. Set **Plugin URL / Upload**:
   - **Web Component**: Provide a remote URL or click the upload button to choose a `.js` / `.mjs` file.
   - **iframe**: Provide the web URL.
5. Fill in optional fields (**Title**, **Description**, **Group**, **Card Size**, **Custom Parameters**).
6. Enable **Allow LAN Access** if connecting to local network services.
7. Click **"Add site"** to save.


