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

### 2.2 Custom User Parameters

Users can provide multiline key-value parameters formatted as `key=value` per line:

```text
city=London
apiKey=my-secret-key-123
refreshInterval=30
```

- Empty lines and lines starting with `#` are ignored.
- For **Iframe Plugins**, all parameters are appended as **URL Query Strings** (`?card-size=2x1&city=London...`).
- For **Web Component Plugins**, all parameters are passed as **DOM Attributes** and as a property object on the element or lifecycle context.

---

## 3. Iframe Plugin Development Guide

An Iframe plugin is a standard web page (HTML/CSS/JS) hosted on any web server or static host.

### 3.1 Parameter Access via Query String

```javascript
const params = new URLSearchParams(window.location.search);
const cardSize = params.get('card-size'); // e.g., '2x1'
const title = params.get('title');
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
    container.innerHTML = `
      <div class="p-3 h-full flex flex-col justify-between">
        <span class="font-bold text-sm">${props.title || 'Widget'}</span>
        <span class="text-xs opacity-70">Size: ${props['card-size']}</span>
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
5. **Save**: Click **"Add site"** to render the plugin on the dashboard.
