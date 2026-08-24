# Start Base Plugin Development & Integration Guide

Start Base provides a lightweight and flexible plugin extension mechanism. When creating or editing a site entry, you can switch to **Plugin Mode**. In Plugin Mode, the dimensions and layout of the card remain governed by the dashboard's responsive grid system, while the inner content, rendering, and interaction logic are entirely controlled by the plugin.

---

## 1. Overview & Concepts

Start Base supports two types of plugins:

| Plugin Type | Features & Advantages | Best Suited For |
| :--- | :--- | :--- |
| **Iframe Plugin** | Complete sandbox isolation, zero technology stack constraints, supports any standalone HTML/Web page. | Third-party widgets, independent micro-apps, internal monitoring dashboards. |
| **Web Component Plugin** | Native DOM integration, supports native `<dialog>` modals, Popovers, Drawers, and inherits DaisyUI classes and system theme tokens. | Highly interactive widgets (to-do lists, weather detail popups, interactive search panels). |

Unified container features for all plugins:
- **Grid Size Adaptability**: Supports `1×1`, `2×1`, `1×2`, `2×2`, and custom grid spans.
- **Drag-and-Drop Reordering**: Smooth drag-and-drop between groups and ungrouped sections.
- **Context Menu & Long-Press**: Native right-click or mobile long-press triggers the CDK context menu for editing or deleting.

---

## 2. Parameter Passing Specification

When rendering a plugin, Start Base automatically injects two sets of parameters: **Fixed System Parameters** and **Custom User Parameters**.

### 2.1 Fixed System Parameters

| Parameter Key | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `card-size` | string | Dimension key of the card within the grid. | `'1x1'`, `'2x1'`, `'1x2'`, `'2x2'` |
| `title` | string | Configured title of the plugin. | `'Weather Widget'` |
| `description` | string | Optional description text. | `'Real-time forecast'` |
| `theme` | string | Currently active system theme name. | `'emerald'`, `'dark'`, `'night'`, `'corporate'`, etc. |
| `theme-mode` | string | Currently active theme mode. | `'light'` or `'dark'` |

### 2.2 Custom User Parameters

Users can provide multiline key-value parameters formatted as `key=value` per line:

```text
city=London
apiKey=my-secret-key-123
refreshInterval=30
```

- Empty lines and lines starting with `#` are ignored.
- For **Iframe Plugins**, all parameters are appended as **URL Query Strings** (`?card-size=2x1&theme=emerald&theme-mode=light&city=London...`).
- For **Web Component Plugins**, all parameters are passed as **DOM Attributes** and as a property object on the element or lifecycle context.

---

## 3. Iframe Plugin Development Guide

An Iframe plugin is a standard web page (HTML/CSS/JS) hosted on any web server or static host.

### 3.1 Parameter Access via Query String

```javascript
const params = new URLSearchParams(window.location.search);
const cardSize = params.get('card-size'); // e.g., '2x1'
const title = params.get('title');
const theme = params.get('theme'); // e.g., 'emerald', 'dark', 'dracula'
const themeMode = params.get('theme-mode'); // 'light' | 'dark'
const city = params.get('city') || 'London';
```

### 3.2 Example: Live Clock (`clock.html`)

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

## 4. Web Component Plugin Development Guide

Web Component plugins are delivered as **ES Modules (JavaScript files)**. They run directly inside the host DOM, offering maximal flexibility for rich interactivity (such as native `<dialog>` modals).

### 4.1 Standard Custom Element Pattern (with `<dialog>` Modal)

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

### 4.2 Universal Mount Lifecycle Pattern

```javascript
export default {
  mount(container, props) {
    const isDark = props['theme-mode'] === 'dark';
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

### 4.3 Framework Integration (Vue 3 / React + Vite)

You can write plugins using modern frameworks and bundle them into a single `.js` file via Vite:

- **Vue 3 Custom Elements**: [Vue.js Official Guide - Building Custom Elements](https://vuejs.org/guide/extras/web-components.html) (using `defineCustomElement`)
- **React Components in Web Components**: [React createRoot API](https://react.dev/reference/react-dom/client/createRoot) (render React trees inside `connectedCallback`)
- **Vite Library Mode (Single JS Bundle)**: [Vite Guide - Library Mode](https://vite.dev/guide/build.html#library-mode)

### 4.4 Server-Side Caching & Zero-CORS Architecture

To ensure 100% reliability, offline resilience, and eliminate browser CORS issues across domains or ports:

1. **Automatic Server-Side Download**: When a `Web Component` site is saved or updated, the Start Base backend automatically fetches the remote JS file via `httpx` and caches it into `server/data/files/plugins/{hash}-{sanitized_name}.js`.
2. **Deterministic Deduplication**: The filename is derived from a 16-character SHA-256 hash of the normalized URL plus the original script name (e.g. `a1b2c3d4e5f67890-demo-plugin.js`). If multiple cards reference the exact same plugin URL, they share a single copy on disk and in browser module cache.
3. **Same-Origin Static Delivery**: The frontend loads the plugin via `/static/plugins/{hash}-{sanitized_name}.js`, completely bypassing third-party CORS limitations.
4. **On-Demand Synchronization**: Triggering `POST /api/sites/{id}/sync-plugin` forces the server to re-fetch the latest script from the remote URL and update the local cached snapshot.
5. **Automatic Cleanup (GC)**: When a site is deleted or changes its URL, unreferenced plugin cache files are automatically purged from disk.

### 4.5 Plugin Metadata Annotations

You can declare metadata for your plugin using standard comment blocks (similar to JSDoc or Userscript headers). When the plugin script is downloaded or synced, Start Base automatically parses these annotations and persists them as JSON in the database:

```javascript
/**
 * @name Weather & Homelab Widget
 * @version 1.0.0
 * @author Developer
 * @description Real-time forecast & LAN status
 * @allow-host api.weatherapi.com
 * @allow-host *.openstreetmap.org
 * @allow-host 192.168.1.100:8123
 * @allow-hosts api.github.com, cdn.jsdelivr.net
 */
```

| Directive | Description | Example |
| :--- | :--- | :--- |
| `@allow-host <host>` | Declares an authorized external host, IP, or wildcard pattern for the network proxy. | `@allow-host api.weatherapi.com`<br>`@allow-host 192.168.1.100:8123`<br>`@allow-host *.github.com` |
| `@allow-hosts <h1, h2>` | Comma-separated list of authorized hosts. | `@allow-hosts api.github.com, cdn.weather.com` |
| `@name <name>` | Optional human-readable name for the plugin. | `@name Weather Widget` |
| `@version <ver>` | Optional semver version. | `@version 1.0.0` |
| `@description <desc>` | Optional description text. | `@description Real-time forecast` |
| `@author <author>` | Optional author name or handle. | `@author Harry` |

> [!NOTE]
> Plugins without metadata annotations remain 100% valid and run normally. However, any outbound network requests made through the proxy will be blocked unless authorized hosts are declared via `@allow-host`.

---

### 4.6 Zero-CORS Plugin Proxy Network API (`context.fetch`)

To eliminate browser CORS restrictions and securely query external or internal APIs, Start Base provides a proxied `fetch` helper injected directly into the plugin context:

#### Usage in Custom Elements:
```javascript
class WeatherPlugin extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = '<span class="loading loading-spinner loading-xs"></span>';

    try {
      // Use the injected context.fetch to query the declared host
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

#### Usage in Universal Lifecycle Pattern:
```javascript
export default {
  async mount(container, props, context) {
    container.innerHTML = '<span class="loading loading-spinner"></span>';
    const resp = await context.fetch('https://api.github.com/zen');
    const text = await resp.text();
    container.innerHTML = `<div class="p-2 italic text-xs">"${text}"</div>`;
  },
  unmount(container) {
    container.innerHTML = '';
  },
};
```

---

### 4.7 LAN & Homelab Access Control

For security reasons, Start Base restricts outbound proxy requests:
- **Cloud Metadata Interception**: Requests to AWS/GCP/Azure link-local metadata endpoints (`169.254.169.254`) and multicast ranges are strictly forbidden and always blocked.
- **LAN / Private Network Access**: Private network ranges (`192.168.0.0/16`, `10.0.0.0/8`, `172.16.0.0/12`) are blocked by default to prevent SSRF.
- **Homelab User Toggle**: Users can enable **"Allow LAN / Private Network Access"** in the plugin settings form for individual self-hosted widgets (e.g. Home Assistant, Pi-hole, NAS monitoring). Note that LAN access can only be enabled by the user in the UI, never by the plugin script itself.

---

### 4.8 Ready-to-use Demo & Local Testing

A complete ready-to-run demo Web Component plugin is located at [`docs/demo-plugin.js`](./demo-plugin.js).

To test locally, launch any standard HTTP server:

```bash
# Start server in docs directory (or use python3 docs/serve.py 8016)
cd docs
python3 -m http.server 8016
```

Then in Start Base:
- **Plugin URL**: `http://localhost:8016/demo-plugin.js`
- **Plugin Type**: `Web Component`
- **Custom Parameters**:
  ```text
  author=YourName
  greeting=Hello World!
  ```
- **Allow LAN Access**: Toggle if testing private IP endpoints.

---

## 5. Adding and Configuring Plugins in Start Base

1. **Open the Add Dialog**: Click **"Add Site"** in the top bar or inside any group.
2. **Toggle Plugin Mode**: Check the **`[✓] Plugin Mode`** checkbox in the modal footer.
3. **Fill in Plugin Details**:
   - **Plugin URL** *(required)*: The URL of the plugin HTML or JS module.
   - **Plugin Type**: Select `Web Component` or `iframe`.
   - **Title & Description** *(optional)*.
   - **Group & Card Size** (`1×1`, `2×1`, `1×2`, `2×2`).
4. **Set Custom Parameters (Optional)**: Input multiline `key=value` pairs in the parameters box.
5. **Review Declared Hosts & LAN Toggle**:
   - If the plugin script declared `@allow-host`, the declared hosts are displayed in the form.
   - Check **"Allow LAN / Private Network Access"** if connecting to Homelab/local devices.
6. **Save**: Click **"Add site"** to render the plugin on the dashboard.

