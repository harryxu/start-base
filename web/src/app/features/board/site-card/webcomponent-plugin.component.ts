import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import type { Site } from '../../../core/models/types';
import { ConfigService } from '../../../core/services/config.service';
import {
  PluginProxyFetchOptions,
  buildIframeUrl,
  buildPluginParams,
  pluginProxyFetch,
} from '../../../core/utils/plugin.utils';

export interface PluginContext {
  siteId: number;
  fetch: (url: string, options?: PluginProxyFetchOptions) => Promise<Response>;
}

export interface PluginLifecycle {
  mount(container: HTMLElement, props: Record<string, string>, context?: PluginContext): void;
  unmount?(container: HTMLElement): void;
  update?(container: HTMLElement, props: Record<string, string>, context?: PluginContext): void;
}

@Component({
  selector: 'app-webcomponent-plugin',
  standalone: true,
  template: `
    <div
      class="plugin-container w-full h-full relative rounded-[10px] overflow-hidden bg-base-100 flex flex-col"
    >
      @if (errorMessage()) {
        <div
          class="w-full h-full flex flex-col items-center justify-center p-3 text-center text-error gap-1"
        >
          <svg LucideCircleAlert class="w-5 h-5 opacity-80"></svg>
          <span class="text-xs font-medium">{{ errorMessage() }}</span>
          <span class="text-[10px] opacity-60 max-w-full truncate">{{ site().url }}</span>
        </div>
      } @else if (isLoading()) {
        <div class="w-full h-full flex items-center justify-center">
          <span class="loading loading-spinner loading-xs text-base-content/40"></span>
        </div>
      }
      <div
        #mountPoint
        class="w-full h-full flex-1 min-h-0"
        [class.hidden]="isLoading() || errorMessage()"
      ></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    :host-context(.has-border) .plugin-container {
      border: 1px solid color-mix(in oklab, var(--color-base-content) 15%, transparent);
    }
  `,
})
export class WebcomponentPluginComponent implements OnDestroy {
  private configService = inject(ConfigService);

  site = input.required<Site>();
  sizeKey = input.required<string>();

  @ViewChild('mountPoint', { static: true }) mountPoint!: ElementRef<HTMLDivElement>;

  isLoading = signal(true);
  errorMessage = signal<string>('');

  private currentModule: any = null;
  private currentElement: HTMLElement | null = null;

  params = computed(() => {
    const theme = this.configService.theme();
    const themeMode = this.configService.themeMode();
    return buildPluginParams(this.site(), this.sizeKey(), theme, themeMode);
  });

  resolvedUrl = computed(() => {
    const s = this.site();
    const targetUrl = s.plugin_cached_url || s.url;
    const params = this.params();
    return buildIframeUrl(targetUrl, params);
  });

  constructor() {
    effect(() => {
      const url = this.resolvedUrl();
      const params = this.params();
      this.loadAndMountPlugin(url, params);
    });
  }

  ngOnDestroy(): void {
    this.cleanupCurrentPlugin();
  }

  private cleanupCurrentPlugin(): void {
    if (this.currentModule?.default?.unmount && this.mountPoint?.nativeElement) {
      try {
        this.currentModule.default.unmount(this.mountPoint.nativeElement);
      } catch (err) {
        console.warn('Error during plugin unmount:', err);
      }
    }
    if (this.mountPoint?.nativeElement) {
      this.mountPoint.nativeElement.innerHTML = '';
    }
    this.currentModule = null;
    this.currentElement = null;
  }

  private async loadAndMountPlugin(url: string, params: Record<string, string>): Promise<void> {
    if (!url) {
      this.errorMessage.set('Plugin URL is empty');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      this.cleanupCurrentPlugin();

      // Dynamically import the ES module
      const module = await import(/* @vite-ignore */ url);
      this.currentModule = module;

      const container = this.mountPoint.nativeElement;
      const context: PluginContext = {
        siteId: this.site().id,
        fetch: (targetUrl: string, options?: PluginProxyFetchOptions) =>
          pluginProxyFetch(this.site().id, targetUrl, options),
      };

      // Case 1: Universal Lifecycle Object (export default { mount, unmount })
      if (module.default && typeof module.default.mount === 'function') {
        module.default.mount(container, params, context);
        this.isLoading.set(false);
        return;
      }

      // Case 2: Custom Element / Web Component
      let tagName = module.tagName;

      // If module default is a CustomElement class
      if (
        !tagName &&
        typeof module.default === 'function' &&
        module.default.prototype instanceof HTMLElement
      ) {
        tagName = `start-base-plugin-${this.site().id}`;
        if (!customElements.get(tagName)) {
          customElements.define(tagName, module.default);
        }
      }

      // Fallback: If tagName is specified in module or default export
      if (tagName) {
        const el = document.createElement(tagName);
        for (const [key, value] of Object.entries(params)) {
          el.setAttribute(key, value);
        }
        (el as any).params = params;
        (el as any).context = context;
        this.currentElement = el;
        container.appendChild(el);
        this.isLoading.set(false);
        return;
      }

      // Case 3: Script has mounted itself or exported nothing specific
      this.isLoading.set(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load plugin module';
      this.errorMessage.set(msg);
      this.isLoading.set(false);
    }
  }
}
