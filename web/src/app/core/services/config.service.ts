import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_BASE, ApiService } from '../api/api.service';

import {
  SUPPORTED_THEMES,
  type ThemeName,
} from '../../shared/theme-switcher/theme-switcher.component';
export { SUPPORTED_THEMES };
export type { ThemeName };

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private api = inject(ApiService);
  private titleService = inject(Title);
  private route = inject(ActivatedRoute);

  pageTitle = signal<string>('Start Base');
  theme = signal<string>('emerald');
  bgUrl = signal<string | null>(null);

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

    this.loadConfig();
  }

  async loadConfig(): Promise<void> {
    try {
      const config = await firstValueFrom(this.api.getConfig());
      if (config['page_title']) {
        this.pageTitle.set(config['page_title']);
      }
      if (config['theme']) {
        this.theme.set(config['theme']);
      } else {
        this.theme.set('emerald');
      }

      if (config['bg_url'] !== undefined && !this.route.snapshot.queryParams['nbm']) {
        this.bgUrl.set((config['bg_url'] || '').trim() || null);
      }
    } catch (err) {
      console.error('Failed to load system config:', err);
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
      if (res['bg_url'] !== undefined && !this.route.snapshot.queryParams['nbm']) {
        this.bgUrl.set((res['bg_url'] || '').trim() || null);
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
    }
  }
}
