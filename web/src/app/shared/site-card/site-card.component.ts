import { Component, computed, input, output, signal, ViewChild, inject, HostListener } from '@angular/core';
import { LucidePencil, LucideTrash2 } from '@lucide/angular';
import { CdkMenu, CdkMenuItem, CdkContextMenuTrigger } from '@angular/cdk/menu';
import { LongPressDirective } from '../long-press.directive';

import type { Site } from '../../core/models/types';
import { API_BASE } from '../../core/api/api.service';
import { GlobalMenuService } from '../../core/services/global-menu.service';

@Component({
  selector: 'app-site-card',
  standalone: true,
  imports: [
    CdkMenu,
    CdkMenuItem,
    CdkContextMenuTrigger,
    LongPressDirective,
    LucidePencil,
    LucideTrash2,
  ],
  template: `
    <div
      class="site-card"
      [cdkContextMenuTriggerFor]="menu"
      #trigger="cdkContextMenuTriggerFor"
      (cdkContextMenuOpened)="onContextMenuOpened()"
      appLongPress
      (longPress)="openContextMenu($event)"
    >
      <a
        [href]="site().url"
        target="_blank"
        rel="noopener noreferrer"
        class="site-link"
        [title]="site().url"
      >
        <img
          [src]="iconUrl()"
          [alt]="displayTitle()"
          class="site-icon"
          width="32"
          height="32"
          (error)="onIconError()"
        />
        <span class="site-title">{{ displayTitle() }}</span>
      </a>

      <!-- CDK Context Menu Template -->
      <ng-template #menu>
        <div
          cdkMenu
          class="menu bg-base-100 border border-base-300 shadow-xl rounded-box p-2 min-w-[120px] z-50 flex flex-col gap-1"
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
        position: relative;
        width: 72px;
        flex-shrink: 0;
      }

      .site-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 8px 4px 6px;
        border-radius: 10px;
        text-decoration: none;
        width: 100%;
        text-align: center;
        position: relative;
        cursor: pointer;
        -webkit-touch-callout: none; /* iOS Safari link popup */
        -webkit-user-drag: none; /* Prevent iOS/Safari drag ghosting */
        user-select: none; /* Prevent text selection */
      }

      .site-link:hover {
        background: #f3f4f6;
      }

      .site-icon {
        width: 32px;
        height: 32px;
        border-radius: 7px;
        object-fit: contain;
        flex-shrink: 0;
      }

      .site-title {
        font-size: 11px;
        line-height: 1.3;
        color: #6b7280;
        max-width: 66px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ],
})
export class SiteCardComponent {
  site = input.required<Site>();

  editSite = output<Site>();
  deleteSite = output<Site>();

  @ViewChild(CdkContextMenuTrigger) triggerMenu?: CdkContextMenuTrigger;

  private globalMenuService = inject(GlobalMenuService);

  openContextMenu(event: PointerEvent): void {
    this.globalMenuService.registerOpenedMenu(() => this.closeMenu());
    this.triggerMenu?.open({ x: event.clientX, y: event.clientY });
  }

  onContextMenuOpened(): void {
    this.globalMenuService.registerOpenedMenu(() => this.closeMenu());
  }

  closeMenu(): void {
    this.triggerMenu?.close();
  }

  private iconFailed = signal(false);

  iconUrl = computed(() => {
    if (this.iconFailed()) {
      return this.googleFavicon();
    }
    const url = this.site().icon_url;
    if (!url) return this.googleFavicon();
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

  private googleFavicon(): string {
    try {
      const { hostname } = new URL(this.site().url);
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch {
      return '';
    }
  }

  onIconError(): void {
    if (!this.iconFailed()) {
      this.iconFailed.set(true);
    }
  }
}
