/**
 * @name Demo Widget
 * @version 1.0.0
 * @author StartBase
 * @description Web Component Plugin with Network Proxy support
 * @allow-host api.github.com
 *
 * Demonstrates:
 * 1. Fixed system parameters: card-size, title, description, theme, theme-mode
 * 2. Custom user parameters: e.g. author, greeting
 * 3. Theme-aware dynamic styling using DaisyUI classes & CSS variables
 * 4. Interactive state with modal dialog (<dialog>)
 * 5. Network Proxy API via this.context.fetch (Zero-CORS external requests)
 */

class StartBaseDemoPlugin extends HTMLElement {
  static get observedAttributes() {
    return ['card-size', 'title', 'description', 'theme', 'theme-mode', 'author', 'greeting'];
  }

  constructor() {
    super();
    this.count = 0;
    this.zenQuote = '';
    this.isLoadingQuote = false;
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  async fetchQuote() {
    if (this.isLoadingQuote) return;
    this.isLoadingQuote = true;
    this.render();

    try {
      if (this.context && typeof this.context.fetch === 'function') {
        const resp = await this.context.fetch('https://api.github.com/zen');
        if (resp.ok) {
          this.zenQuote = await resp.text();
        } else {
          this.zenQuote = `Error: HTTP ${resp.status}`;
        }
      } else {
        this.zenQuote = 'No context.fetch available';
      }
    } catch (err) {
      this.zenQuote = `Fetch failed: ${err.message || err}`;
    } finally {
      this.isLoadingQuote = false;
      this.render();
    }
  }

  render() {
    const cardSize = this.getAttribute('card-size') || '1x1';
    const title = this.getAttribute('title') || 'Demo Widget';
    const desc = this.getAttribute('description') || 'Web Component Plugin';
    const theme = this.getAttribute('theme') || 'emerald';
    const themeMode = this.getAttribute('theme-mode') || 'light';
    const author = this.getAttribute('author') || 'Developer';
    const greeting = this.getAttribute('greeting') || 'Hello!';

    const isCompact = cardSize === '1x1';

    this.innerHTML = `
      <div class="w-full h-full p-3 flex flex-col justify-between select-none box-border font-sans">
        <!-- Header -->
        <div class="flex items-center justify-between gap-1 min-w-0">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-base shrink-0">⚡</span>
            <div class="min-w-0">
              <div class="font-bold text-xs truncate leading-tight">${title}</div>
              ${!isCompact ? `<div class="text-[10px] opacity-60 truncate leading-tight">${desc}</div>` : ''}
            </div>
          </div>
          <span class="badge badge-xs badge-neutral shrink-0 text-[9px] uppercase font-mono">${cardSize}</span>
        </div>

        <!-- Body / Counter & Zen -->
        <div class="flex flex-col gap-1 my-1">
          <div class="flex items-center justify-between bg-base-200/60 rounded-lg p-2 gap-2">
            <div class="text-[11px] leading-tight min-w-0 truncate">
              <div class="font-medium truncate">${greeting}</div>
              <div class="opacity-60 text-[10px] truncate">By ${author}</div>
            </div>
            <button id="counter-btn" type="button" class="btn btn-xs btn-primary shrink-0 shadow-sm">
              <span>Count:</span>
              <span class="font-bold font-mono" id="count-display">${this.count}</span>
            </button>
          </div>

          ${this.zenQuote ? `
            <div class="bg-base-200/40 rounded p-1.5 text-[10px] italic text-base-content/80 truncate">
              "${this.zenQuote}"
            </div>
          ` : ''}
        </div>

        <!-- Footer / Theme & Actions -->
        <div class="flex items-center justify-between text-[10px] opacity-70 pt-0.5">
          <span class="truncate font-mono">${theme} (${themeMode})</span>
          <div class="flex items-center gap-1">
            <button id="fetch-quote-btn" type="button" class="btn btn-ghost btn-xs text-[10px] px-1.5 h-6 min-h-0 font-normal">
              ${this.isLoadingQuote ? 'Loading...' : 'API ⚡'}
            </button>
            <button id="open-modal-btn" type="button" class="btn btn-ghost btn-xs text-[10px] px-1.5 h-6 min-h-0 font-normal">
              Info ↗
            </button>
          </div>
        </div>

        <!-- Native Modal Dialog -->
        <dialog id="demo-modal" class="modal">
          <div class="modal-box p-4 max-w-xs">
            <h3 class="font-bold text-sm flex items-center gap-1.5 mb-2">
              <span>⚡</span> ${title}
            </h3>
            <div class="text-xs space-y-1.5 text-base-content/80">
              <p><strong>Theme:</strong> <code class="badge badge-sm font-mono">${theme}</code> (${themeMode})</p>
              <p><strong>Card Size:</strong> <code class="badge badge-sm font-mono">${cardSize}</code></p>
              <p><strong>Custom Params:</strong></p>
              <ul class="list-disc list-inside text-[11px] opacity-80 font-mono">
                <li>author=${author}</li>
                <li>greeting=${greeting}</li>
              </ul>
              ${this.zenQuote ? `<p><strong>Zen API:</strong> <span class="italic text-[11px]">"${this.zenQuote}"</span></p>` : ''}
            </div>
            <div class="modal-action mt-3">
              <button id="close-modal-btn" type="button" class="btn btn-sm btn-primary w-full">Close</button>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </div>
    `;

    // Counter button interaction
    const counterBtn = this.querySelector('#counter-btn');
    if (counterBtn) {
      counterBtn.onclick = (e) => {
        e.stopPropagation();
        this.count++;
        const countDisplay = this.querySelector('#count-display');
        if (countDisplay) countDisplay.textContent = String(this.count);
      };
    }

    // Proxy API fetch button interaction
    const fetchBtn = this.querySelector('#fetch-quote-btn');
    if (fetchBtn) {
      fetchBtn.onclick = (e) => {
        e.stopPropagation();
        this.fetchQuote();
      };
    }

    // Modal open/close interaction
    const modal = this.querySelector('#demo-modal');
    const openBtn = this.querySelector('#open-modal-btn');
    const closeBtn = this.querySelector('#close-modal-btn');

    if (openBtn && modal) {
      openBtn.onclick = (e) => {
        e.stopPropagation();
        modal.showModal();
      };
    }

    if (closeBtn && modal) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        modal.close();
      };
    }
  }
}

export default StartBaseDemoPlugin;

