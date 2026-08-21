import { Service, computed, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_BASE, ApiService } from '../api/api.service';
import { AuthService } from './auth.service';
import {
  SUPPORTED_THEMES,
  type SiteViewMode,
  type ThemeName,
} from '../models/types';
export { SUPPORTED_THEMES };
export type { ThemeName };

@Service()
export class ConfigService {
  private api = inject(ApiService);
  private titleService = inject(Title);
  private route = inject(ActivatedRoute, { optional: true });
  private authService = inject(AuthService);

  pageTitle = signal<string>('Start Base');
  theme = signal<string>('emerald');
  bgUrl = signal<string | null>(null);
  accessMode = signal<string>('none_guard');
  siteViewMode = signal<SiteViewMode>('full');
  siteBorder = signal<boolean>(false);
  isDemo = signal<boolean>(false);
  demoMsg = signal<string>('');

  /** In-flight Promise deduplication for concurrent loadConfig calls. */
  private inFlightLoadPromise: Promise<void> | null = null;

  /**
   * True when write operations should be hidden/disabled.
   * In guarded modes (write_guard / full_guard), only authenticated users can write.
   */
  isReadOnly = computed(
    () => this.accessMode() !== 'none_guard' && this.authService.currentUser() === null,
  );

  fullBgUrl = computed(() => {
    const url = this.bgUrl();
    if (!url) return '';
    return url.startsWith('/') ? `${API_BASE}${url}` : url;
  });

  constructor() {
    // Title effect
    effect(() => {
      const currentTitle = this.pageTitle();
      if (currentTitle) {
        this.titleService.setTitle(currentTitle);
      }
    });

    // Theme effect
    effect(() => {
      const currentTheme = this.theme();
      this.applyTheme(currentTheme);
    });

    this.loadConfig().catch((err) => {
      console.error('Initial loadConfig failed:', err);
    });
  }

  async loadConfig(force = false): Promise<void> {
    if (this.inFlightLoadPromise && !force) {
      return this.inFlightLoadPromise;
    }

    this.inFlightLoadPromise = (async () => {
      const config = await firstValueFrom(this.api.getConfig());
      if (config['page_title']) {
        this.pageTitle.set(config['page_title']);
      }
      if (config['theme']) {
        this.theme.set(config['theme']);
      } else {
        this.theme.set('emerald');
      }

      if (config['access_mode']) {
        this.accessMode.set(config['access_mode']);
      }

      if (config['site_view_mode']) {
        this.siteViewMode.set(config['site_view_mode'] as SiteViewMode);
      } else {
        this.siteViewMode.set('full');
      }

      const borderVal = config['site-border'] ?? config['site_border'];
      if (borderVal !== undefined) {
        this.siteBorder.set(borderVal === '1' || borderVal === 1 || borderVal === true);
      } else {
        this.siteBorder.set(false);
      }

      if (config['bg_url'] !== undefined && !this.route?.snapshot?.queryParams?.['nbm']) {
        this.bgUrl.set((config['bg_url'] || '').trim() || null);
      }

      if (config['demo'] !== undefined) {
        this.isDemo.set(Boolean(config['demo']));
      } else {
        this.isDemo.set(false);
      }
      if (config['demo_msg']) {
        this.demoMsg.set(String(config['demo_msg']));
      } else {
        this.demoMsg.set('');
      }
    })();

    try {
      await this.inFlightLoadPromise;
    } finally {
      this.inFlightLoadPromise = null;
    }
  }

  async updateConfig(updates: Record<string, any>): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.updateConfig(updates));
      if (res['page_title']) {
        this.pageTitle.set(res['page_title']);
      }
      if (res['theme']) {
        this.theme.set(res['theme']);
      }
      if (res['access_mode']) {
        this.accessMode.set(res['access_mode']);
      }
      if (res['site_view_mode']) {
        this.siteViewMode.set(res['site_view_mode'] as SiteViewMode);
      }
      const borderVal = res['site-border'] ?? res['site_border'];
      if (borderVal !== undefined) {
        this.siteBorder.set(borderVal === '1' || borderVal === 1 || borderVal === true);
      }
      if (res['bg_url'] !== undefined && !this.route?.snapshot?.queryParams?.['nbm']) {
        this.bgUrl.set((res['bg_url'] || '').trim() || null);
      }
      if (res['demo'] !== undefined) {
        this.isDemo.set(Boolean(res['demo']));
      }
      if (res['demo_msg']) {
        this.demoMsg.set(String(res['demo_msg']));
      }
    } catch (err) {
      console.error('Failed to update system config:', err);
      throw err;
    }
  }

  async selectTheme(themeName: string): Promise<void> {
    this.theme.set(themeName);
    await this.updateConfig({ theme: themeName });
  }

  private applyTheme(targetTheme: string): void {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', targetTheme || 'emerald');
      this.updateThemeColorMeta();
    }
  }

  private updateThemeColorMeta(): void {
    if (typeof document === 'undefined') return;

    const applyColor = () => {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
      }

      const headerEl = document.querySelector('header.navbar') as HTMLElement | null;
      let color = '';
      if (headerEl) {
        const headerBg = getComputedStyle(headerEl).backgroundColor;
        if (headerBg && headerBg !== 'rgba(0, 0, 0, 0)' && headerBg !== 'transparent') {
          color = headerBg;
        }
      }

      if (!color) {
        color = getComputedStyle(document.documentElement).getPropertyValue('--color-base-100').trim();
      }

      if (!color) {
        const bodyBg = getComputedStyle(document.body).backgroundColor;
        if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') {
          color = bodyBg;
        }
      }

      if (color) {
        meta.setAttribute('content', color);
      }
    };

    applyColor();
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(applyColor);
    }
  }
}
