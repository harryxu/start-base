import { CdkContextMenuTrigger, CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import { Component, computed, inject, input, output, signal, ViewChild } from '@angular/core';
import { LucideGlobe, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { LongPressDirective } from '../long-press.directive';

import { API_BASE } from '../../core/api/api.service';
import type { Site, SiteViewMode } from '../../core/models/types';
import { GlobalMenuService } from '../../core/services/global-menu.service';
import { ConfigService } from '../../core/services/config.service';

@Component({
  selector: 'app-site-card',
  standalone: true,
  imports: [
    CdkMenu,
    CdkMenuItem,
    CdkContextMenuTrigger,
    LongPressDirective,
    LucideGlobe,
    LucidePencil,
    LucideTrash2,
  ],
  template: `
    <div
      class="site-card min-w-2 relative shrink-0 h-full"
      [class.is-floating]="!configService.isReadOnly() && isMenuOpen()"
      [class.app-with-bgimg]="configService.bgUrl()"
      [class.app-without-bgimg]="!configService.bgUrl()"
      [class.grouped]="!!site().group_id"
      [class.ungrouped]="!site().group_id"
      [cdkContextMenuTriggerFor]="configService.isReadOnly() ? null : menu"
      [cdkContextMenuDisabled]="configService.isReadOnly()"
      #trigger="cdkContextMenuTriggerFor"
      (cdkContextMenuOpened)="onContextMenuOpened()"
      (cdkContextMenuClosed)="onContextMenuClosed()"
      appLongPress
      [disabled]="configService.isReadOnly()"
      (longPress)="openContextMenu($event)"
    >
      <!-- 1×1 layout (default): vertical icon + title -->
      @if (sizeKey() === '1x1') {
        <a
          [href]="site().url"
          tabindex="0"
          target="_blank"
          rel="noopener noreferrer"
          class="site-link flex flex-col items-center justify-center gap-2.5 rounded-[10px] w-full text-center relative cursor-pointer py-3 hover:bg-base-200"
          [class.select-none]="!configService.isReadOnly()"
          [class.[-webkit-touch-callout:none]]="!configService.isReadOnly()"
          [class.[-webkit-user-drag:none]]="!configService.isReadOnly()"
          [title]="tooltip()"
        >
          @if (view_mode() !== 'text') {
            <div class="w-12 h-12 flex items-center justify-center">
              @if (showSkeleton()) {
                <div class="skeleton w-12 h-12 rounded-[7px] shrink-0"></div>
              } @else if (hasIcon()) {
                <img
                  [src]="iconUrl()"
                  [alt]="displayTitle()"
                  class="site-icon w-12 object-contain shrink-0"
                  (error)="onIconError()"
                />
              } @else {
                <svg lucideGlobe class="w-12 h-12 text-base-content/60"></svg>
              }
            </div>
          }
          @if (view_mode() !== 'icon') {
            <span
              class="site-title lg:text-sm sm:text-xs text-[11px] text-base-content max-w-full line-clamp-2 break-all px-1 text-center leading-tight"
              >{{ displayTitle() }}</span
            >
          }
        </a>
      }

      <!-- 2×1 layout: horizontal icon-left + title/desc-right -->
      @if (sizeKey() === '2x1') {
        <a
          [href]="site().url"
          tabindex="0"
          target="_blank"
          rel="noopener noreferrer"
          class="site-link flex items-center gap-3 rounded-[10px] w-full h-full relative cursor-pointer px-3 py-3 hover:bg-base-200"
          [class.select-none]="!configService.isReadOnly()"
          [class.[-webkit-touch-callout:none]]="!configService.isReadOnly()"
          [class.[-webkit-user-drag:none]]="!configService.isReadOnly()"
          [title]="tooltip()"
        >
          @if (view_mode() !== 'text') {
            <div class="w-12 h-12 flex items-center justify-center shrink-0">
              @if (showSkeleton()) {
                <div class="skeleton w-12 h-12 rounded-[7px] shrink-0"></div>
              } @else if (hasIcon()) {
                <img
                  [src]="iconUrl()"
                  [alt]="displayTitle()"
                  class="site-icon w-12 object-contain shrink-0"
                  (error)="onIconError()"
                />
              } @else {
                <svg lucideGlobe class="w-12 h-12 text-base-content/60"></svg>
              }
            </div>
          }
          @if (view_mode() !== 'icon') {
            <div class="flex flex-col gap-0.5 min-w-0">
              <span class="site-title text-sm text-base-content font-medium truncate">{{ displayTitle() }}</span>
              @if (site().description) {
                <span class="text-xs text-base-content/50 line-clamp-2 break-all leading-tight">{{ site().description }}</span>
              }
            </div>
          }
        </a>
      }

      <!-- 1×2 layout: vertical with larger icon + title + description -->
      @if (sizeKey() === '1x2') {
        <a
          [href]="site().url"
          tabindex="0"
          target="_blank"
          rel="noopener noreferrer"
          class="site-link flex flex-col items-center justify-center gap-2 rounded-[10px] w-full h-full text-center relative cursor-pointer px-2 py-4 hover:bg-base-200"
          [class.select-none]="!configService.isReadOnly()"
          [class.[-webkit-touch-callout:none]]="!configService.isReadOnly()"
          [class.[-webkit-user-drag:none]]="!configService.isReadOnly()"
          [title]="tooltip()"
        >
          @if (view_mode() !== 'text') {
            <div class="w-14 h-14 flex items-center justify-center">
              @if (showSkeleton()) {
                <div class="skeleton w-14 h-14 rounded-[7px] shrink-0"></div>
              } @else if (hasIcon()) {
                <img
                  [src]="iconUrl()"
                  [alt]="displayTitle()"
                  class="site-icon w-14 object-contain shrink-0"
                  (error)="onIconError()"
                />
              } @else {
                <svg lucideGlobe class="w-14 h-14 text-base-content/60"></svg>
              }
            </div>
          }
          @if (view_mode() !== 'icon') {
            <span class="site-title text-sm text-base-content font-medium max-w-full line-clamp-2 break-all leading-tight">{{ displayTitle() }}</span>
            @if (site().description) {
              <span class="text-xs text-base-content/50 max-w-full line-clamp-3 break-all leading-tight px-1">{{ site().description }}</span>
            }
          }
        </a>
      }

      <!-- 2×2 layout: large centered icon + title + description -->
      @if (sizeKey() === '2x2') {
        <a
          [href]="site().url"
          tabindex="0"
          target="_blank"
          rel="noopener noreferrer"
          class="site-link flex flex-col items-center justify-center gap-3 rounded-[10px] w-full h-full text-center relative cursor-pointer p-4 hover:bg-base-200"
          [class.select-none]="!configService.isReadOnly()"
          [class.[-webkit-touch-callout:none]]="!configService.isReadOnly()"
          [class.[-webkit-user-drag:none]]="!configService.isReadOnly()"
          [title]="tooltip()"
        >
          @if (view_mode() !== 'text') {
            <div class="w-16 h-16 flex items-center justify-center">
              @if (showSkeleton()) {
                <div class="skeleton w-16 h-16 rounded-[7px] shrink-0"></div>
              } @else if (hasIcon()) {
                <img
                  [src]="iconUrl()"
                  [alt]="displayTitle()"
                  class="site-icon w-16 object-contain shrink-0"
                  (error)="onIconError()"
                />
              } @else {
                <svg lucideGlobe class="w-16 h-16 text-base-content/60"></svg>
              }
            </div>
          }
          @if (view_mode() !== 'icon') {
            <span class="site-title text-base text-base-content font-medium max-w-full line-clamp-2 break-all leading-tight">{{ displayTitle() }}</span>
            @if (site().description) {
              <span class="text-sm text-base-content/50 max-w-full line-clamp-3 break-all leading-tight">{{ site().description }}</span>
            }
          }
        </a>
      }

      <!-- CDK Context Menu Template -->
      <ng-template #menu>
        <div
          cdkMenu
          class="menu bg-base-100 border border-base-300 shadow-xl rounded-box p-2 min-w-30 z-50 flex flex-col gap-1"
        >
          <button
            cdkMenuItem
            (click)="editSite.emit(site())"
            class="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-base-200 outline-none focus:outline-none rounded-lg w-full text-base-content font-medium transition-colors"
          >
            <svg lucidePencil class="w-4 h-4"></svg>
            <span>Edit</span>
          </button>
          <button
            cdkMenuItem
            (click)="deleteSite.emit(site())"
            class="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-error/15 text-error outline-none focus:outline-none rounded-lg w-full font-medium transition-colors"
          >
            <svg lucideTrash2 class="w-4 h-4"></svg>
            <span>Delete</span>
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .site-card {
        .site-link {
          outline: none;

          &:focus-visible {
            outline: 2px solid var(--color-primary);
            outline-offset: 2px;
          }
        }

        &.is-floating {
          border-radius: 8px;
          box-shadow:
            0 10px 20px rgba(0, 0, 0, 0.15),
            0 3px 6px rgba(0, 0, 0, 0.1);

          .site-link:hover {
            background: none;
          }
        }

        &.app-with-bgimg.ungrouped {
          .site-link {
            .site-title {
              text-shadow:
                -1px -1px 5px color-mix(in oklab, var(--color-base-100) 50%, transparent),
                1px 1px 5px color-mix(in oklab, var(--color-base-100) 50%, transparent),
                0 0 10px color-mix(in oklab, var(--color-base-100) 90%, transparent);
            }
          }
        }
      }
    `,
  ],
})
export class SiteCardComponent {
  configService = inject(ConfigService);
  site = input.required<Site>();
  isFetching = input<boolean>(false);
  view_mode = input<SiteViewMode>('full');

  editSite = output<Site>();
  deleteSite = output<Site>();

  @ViewChild(CdkContextMenuTrigger) triggerMenu?: CdkContextMenuTrigger;

  isMenuOpen = signal(false);

  private globalMenuService = inject(GlobalMenuService);

  /** Computed size key from site's col_span and row_span. */
  sizeKey = computed(() => {
    const col = this.site().col_span ?? 1;
    const row = this.site().row_span ?? 1;
    return `${col}x${row}`;
  });

  openContextMenu(event: PointerEvent): void {
    if (this.configService.isReadOnly()) return;
    this.globalMenuService.registerOpenedMenu(() => this.closeMenu());
    this.triggerMenu?.open({ x: event.clientX, y: event.clientY });
  }

  onContextMenuOpened(): void {
    if (this.configService.isReadOnly()) return;
    this.globalMenuService.registerOpenedMenu(() => this.closeMenu());
    this.isMenuOpen.set(true);
  }

  onContextMenuClosed(): void {
    this.isMenuOpen.set(false);
  }

  closeMenu(): void {
    this.triggerMenu?.close();
  }

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

  onIconError(): void {
    if (!this.iconFailed()) {
      this.iconFailed.set(true);
    }
  }
}
