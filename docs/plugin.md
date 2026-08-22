# Start Base 插件开发与集成指南

Start Base 提供了轻量级、灵活的插件扩展机制。在添加或编辑站点时，您可以将站点切换为**插件模式**。在插件模式下，卡片的尺寸仍由系统的网格布局统一管理，而卡片内部的内容、逻辑与交互则完全由插件自主决定。

---

## 目录

- [一、插件机制简介](#一插件机制简介)
- [二、参数传递规范](#二参数传递规范)
- [三、Iframe 插件开发指南](#三iframe-插件开发指南)
- [四、Web Component 插件开发指南](#四web-component-插件开发指南)
  - [1. 原生 Custom Element 形式](#1-原生-custom-element-形式)
  - [2. 通用生命周期挂载形式 (Universal Mount)](#2-通用生命周期挂载形式-universal-mount)
  - [3. 使用 Vue 3 / React 开发与打包](#3-使用-vue-3--react-开发与打包)
- [五、在 Start Base 中添加与配置插件](#五在-start-base-中添加与配置插件)

---

## 一、插件机制简介

Start Base 支持两种形式的插件：

| 插件形式 | 特点与优势 | 适用场景 |
| :--- | :--- | :--- |
| **Iframe 插件** | 严格沙箱隔离，零技术栈限制，支持任何独立部署的静态 HTML / Web 应用 | 第三方外部小组件、独立微应用、内网监控仪表盘等 |
| **Web Component 插件** | 原生融入 DOM，支持使用 `<dialog>` 弹窗、Popover、Drawer 等任意高级交互，自动继承系统主题与 DaisyUI 类名 | 深度交互小组件（如待办列表、天气弹窗预报、搜索交互面板等） |

无论是哪种形式，卡片外层都享有 Start Base 的统一特性：
- **网格尺寸自适应**：支持 `1×1`、`2×1`、`1×2`、`2×2` 等卡片尺寸。
- **拖拽排序**：支持在不同分组或无分组区间自由拖拽。
- **右键菜单**：支持长按或右键呼出编辑、删除操作。

---

## 二、参数传递规范

系统在渲染插件时，会自动向插件注入两类参数：**固定系统参数** 和 **用户自定义参数**。

### 1. 固定系统参数
| 参数名 | 类型 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| `card-size` | string | 当前卡片在网格中所占的尺寸 | `'1x1'`, `'2x1'`, `'1x2'`, `'2x2'` |
| `title` | string | 插件的标题（未填时为空字符串） | `'天气小组件'` |
| `description` | string | 插件的描述文本（未填时为空字符串） | `'实时显示当前城市温度'` |

### 2. 用户自定义参数
在添加/编辑表单中，可通过多行文本输入框配置参数，格式为每行一个 `key=value`：
```text
city=Beijing
apiKey=my-secret-key-123
refreshInterval=30
```
- 空行以及以 `#` 开头的行会被自动忽略。
- 在 **Iframe 模式** 下，所有参数将作为 **URL Query String** 拼接到插件 URL 之后。
- 在 **Web Component 模式** 下，所有参数将作为 **DOM 属性 (Attribute)** 以及参数对象传递给插件实例。

---

## 三、Iframe 插件开发指南

Iframe 插件是一个标准的网页（HTML/CSS/JS）。您可以使用任意框架或纯静态 HTML 编写，并部署到任何静态服务器、Nginx、CDN 或内网地址。

### 1. 如何读取传入参数
在页面 JavaScript 中，通过 `URLSearchParams` 获取系统参数与自定义参数：

```javascript
const urlParams = new URLSearchParams(window.location.search);
const cardSize = urlParams.get('card-size'); // 例如 '2x1'
const title = urlParams.get('title');
const city = urlParams.get('city') || 'Beijing';
const apiKey = urlParams.get('apiKey');
```

### 2. 完整示例：自适应实时时钟与状态插件 (`clock.html`)

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: transparent;
      color: inherit;
    }
    .time { font-size: 1.5rem; font-weight: bold; font-variant-numeric: tabular-nums; }
    .date { font-size: 0.75rem; opacity: 0.65; margin-top: 2px; }
    .custom-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 9999px;
      background: rgba(125, 125, 125, 0.15);
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="time" id="time">00:00:00</div>
  <div class="date" id="date">2026/01/01</div>
  <div class="custom-badge" id="badge"></div>

  <script>
    const params = new URLSearchParams(window.location.search);
    const label = params.get('label') || params.get('title') || 'Clock';
    document.getElementById('badge').textContent = label;

    function updateTime() {
      const now = new Date();
      document.getElementById('time').textContent = now.toLocaleTimeString();
      document.getElementById('date').textContent = now.toLocaleDateString();
    }
    setInterval(updateTime, 1000);
    updateTime();
  </script>
</body>
</html>
```

---

## 四、Web Component 插件开发指南

Web Component 插件以 **ES Module (JavaScript 脚本)** 形式提供。它直接在宿主 DOM 中渲染，具有极高的灵活性，支持使用浏览器原生 `<dialog>` 唤起全屏居中弹窗、抽屉及复杂表单。

### 1. 原生 Custom Element 形式

插件定义并注册一个标准的 Custom Element，或直接 `export default` 继承自 `HTMLElement` 的类：

```javascript
// weather-plugin.js
class WeatherPlugin extends HTMLElement {
  connectedCallback() {
    const cardSize = this.getAttribute('card-size') || '1x1';
    const title = this.getAttribute('title') || '天气';
    const city = this.getAttribute('city') || '北京';

    this.innerHTML = `
      <div class="w-full h-full p-3 flex flex-col justify-between select-none">
        <div class="flex items-center justify-between">
          <span class="text-xs opacity-60">${city}</span>
          <span class="badge badge-sm badge-primary">26°C</span>
        </div>
        <div class="text-sm font-bold truncate">晴天 ☀️</div>
        <button id="detail-btn" class="btn btn-xs btn-outline btn-block">
          查看详情
        </button>
      </div>

      <!-- 原生弹窗：使用 HTML5 标准 <dialog> 标签 -->
      <dialog id="detail-dialog" class="modal modal-bottom sm:modal-middle">
        <div class="modal-box">
          <h3 class="font-bold text-lg">${city} 天气详情</h3>
          <p class="py-4 text-sm opacity-80">
            湿度: 45% | 风向: 东北风 2级 | 空气质量: 优 (28)
          </p>
          <div class="modal-action">
            <button id="close-btn" class="btn btn-sm">关闭</button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    `;

    const dialog = this.querySelector('#detail-dialog');
    this.querySelector('#detail-btn').onclick = (e) => {
      e.stopPropagation();
      dialog.showModal(); // 原生顶级弹窗，突破卡片尺寸限制
    };
    this.querySelector('#close-btn').onclick = () => {
      dialog.close();
    };
  }

  disconnectedCallback() {
    // 组件卸载时清理资源
  }
}

// 导出为默认类
export default WeatherPlugin;
```

---

### 2. 通用生命周期挂载形式 (Universal Mount)

如果您不想定义 Custom Element 标签名，只需 `export default` 一个包含 `mount` 和 `unmount` 钩子的对象：

```javascript
// quick-note.js
export default {
  mount(container, props) {
    // props: { 'card-size': '2x1', title: '速记', apiKey: '...', ... }
    container.innerHTML = `
      <div class="w-full h-full p-2.5 flex flex-col">
        <div class="text-xs font-semibold mb-1 opacity-70">${props.title || '便签'}</div>
        <textarea id="note-text" class="textarea textarea-bordered textarea-xs w-full flex-1 resize-none" placeholder="输入待办..."></textarea>
      </div>
    `;

    const textarea = container.querySelector('#note-text');
    textarea.value = localStorage.getItem('start-base-note') || '';
    textarea.oninput = () => localStorage.setItem('start-base-note', textarea.value);
  },

  unmount(container) {
    container.innerHTML = '';
  }
};
```

---

### 3. 使用 Vue 3 / React 开发与打包

可以使用现代前端工具链（如 **Vite**）将带有 Vue 或 React 的完整小组件打包为单个 `.js` 文件。

#### Vue 3 示例 (`vite.config.js`):
```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: './src/index.js',
      name: 'MyPlugin',
      fileName: () => 'plugin.js',
      formats: ['es'],
    },
  },
});
```

```javascript
// src/index.js
import { createApp } from 'vue';
import App from './App.vue';

export default {
  mount(container, props) {
    const app = createApp(App, { props });
    app.mount(container);
    container._vueApp = app;
  },
  unmount(container) {
    container._vueApp?.unmount();
  },
};
```

执行 `vite build` 即可生成单个 `dist/plugin.js` 供 Start Base 引用。

---

## 五、在 Start Base 中添加与配置插件

1. **打开添加窗口**：
   在 Start Base 首页导航栏或任意分组的操作菜单中点击 **“Add Site” (添加站点)**。

2. **切换为插件模式**：
   在弹出的模态框底部操作栏左侧，勾选 **`[✓] Plugin Mode`** 复选框。

3. **填写插件基本配置**：
   - **Plugin URL**（必填）：输入插件的访问 URL（例如 `https://example.com/clock.html` 或 `https://example.com/widget.js`）。
   - **Plugin Type**：选择插件类型（`Web Component` 或 `iframe`）。
   - **Title**（可选）：设置插件标题。
   - **Description**（可选）：设置描述信息。
   - **Group**（可选）：选择归属的分组或设为未分组。
   - **Card Size**：选择卡片显示尺寸（`1×1`、`2×1`、`1×2`、`2×2`）。

4. **配置自定义参数 (Plugin Parameters)**：
   在多行输入框中按 `key=value` 格式输入自定义参数，例如：
   ```text
   city=Shenzhen
   theme=auto
   refresh=60
   ```

5. **保存与查看**：
   点击 **“Add site”** 提交。插件将立即按照所选尺寸在仪表盘上渲染并开始运行。通过长按或右键卡片，可随时再次打开编辑或删除插件。
