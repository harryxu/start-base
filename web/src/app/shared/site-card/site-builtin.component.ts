import { Component, computed, inject, input, signal } from '@angular/core';
import { LucideGlobe } from '@lucide/angular';

import { API_BASE } from '../../core/api/api.service';
import type { Site, SiteViewMode } from '../../core/models/types';
import { ConfigService } from '../../core/services/config.service';

@Component({
  selector: 'app-site-builtin',
  standalone: true,
  imports: [LucideGlobe],
  template: `
    <a
      [href]="site().url"
      tabindex="0"
      target="_blank"
      rel="noopener noreferrer"
      class="site-link flex rounded-[10px] w-full relative cursor-pointer hover:bg-base-200"
      [class.select-none]="!configService.isReadOnly()"
      [class.[-webkit-touch-callout:none]]="!configService.isReadOnly()"
      [class.[-webkit-user-drag:none]]="!configService.isReadOnly()"
      [title]="tooltip()"
    >
      @if (view_mode() !== 'text') {
        <div class="icon-wrapper flex items-center justify-center shrink-0">
          @if (showSkeleton()) {
            <div class="skeleton w-full h-full rounded-[7px] shrink-0"></div>
          } @else if (hasIcon()) {
            <img
              [src]="iconUrl()"
              [alt]="displayTitle()"
              class="site-icon w-full h-full object-contain shrink-0"
              (error)="onIconError()"
            />
          } @else {
            <svg lucideGlobe class="w-full h-full text-base-content/60"></svg>
          }
        </div>
      }

      @if (view_mode() !== 'icon') {
        <div class="site-text flex flex-col min-w-0">
          <span class="site-title text-base-content leading-tight">
            {{ displayTitle() }}
          </span>
          @if (showDescription()) {
            <span class="site-description text-base-content/50 leading-tight">
              {{ site().description }}
            </span>
          }
        </div>
      }
    </a>
  `,
  styleUrl: './site-builtin.component.css',
})
export class SiteBuiltinComponent {
  configService = inject(ConfigService);

  site = input.required<Site>();
  sizeKey = input<string>('1x1');
  view_mode = input<SiteViewMode>('full');
  isFetching = input<boolean>(false);

  private iconFailed = signal(false);

  showSkeleton = computed(() => {
    return this.isFetching();
  });

  hasIcon = computed(() => {
    if (this.showSkeleton()) return false;
    if (this.iconFailed()) return false;
    const url = this.site().icon_url;
    return !!url && url.trim().length > 0;
  });

  iconUrl = computed(() => {
    const url = this.site().icon_url;
    if (!url) return '';
    if (url.startsWith('/')) {
      return `${API_BASE}${url}`;
    }
    return url;
  });

  displayTitle = computed(() => {
    if (this.site().title) return this.site().title!;
    try {
      return new URL(this.site().url).hostname.replace(/^www\./, '');
    } catch {
      return this.site().url;
    }
  });

  tooltip = computed(() => {
    const title = this.displayTitle();
    const desc = this.site().description?.trim();
    return desc ? `${title}\n${desc}` : title;
  });

  showDescription = computed(() => {
    return this.sizeKey() !== '1x1' && !!this.site().description?.trim();
  });

  onIconError(): void {
    if (!this.iconFailed()) {
      this.iconFailed.set(true);
    }
  }
}
