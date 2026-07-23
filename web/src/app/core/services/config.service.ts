import { Injectable, inject, signal, effect } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../api/api.service';

export type ThemeMode = 'system' | 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private api = inject(ApiService);
  private titleService = inject(Title);

  pageTitle = signal<string>('Start Base');
  theme = signal<ThemeMode>('system');

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

    // Listen for system theme changes when in system mode
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.theme() === 'system') {
          this.applyTheme('system');
        }
      });
    }

    this.loadConfig();
  }

  async loadConfig(): Promise<void> {
    try {
      const config = await firstValueFrom(this.api.getConfig());
      if (config['page_title']) {
        this.pageTitle.set(config['page_title']);
      }
      if (config['theme']) {
        this.theme.set(config['theme'] as ThemeMode);
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
        this.theme.set(res['theme'] as ThemeMode);
      }
    } catch (err) {
      console.error('Failed to update system config:', err);
      throw err;
    }
  }

  private applyTheme(mode: ThemeMode): void {
    if (typeof document === 'undefined') return;

    let targetTheme = mode;
    if (mode === 'system') {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      targetTheme = isDark ? 'dark' : 'light';
    }

    const htmlEl = document.documentElement;
    htmlEl.setAttribute('data-theme', targetTheme);
    if (targetTheme === 'dark') {
      htmlEl.classList.add('dark');
    } else {
      htmlEl.classList.remove('dark');
    }
  }
}
