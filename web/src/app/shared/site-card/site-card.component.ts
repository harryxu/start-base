import { CdkContextMenuTrigger, CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import { Component, computed, inject, input, output, signal, ViewChild } from '@angular/core';
import { LucideGlobe, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { LongPressDirective } from '../long-press.directive';

import { API_BASE } from '../../core/api/api.service';
import type { Site } from '../../core/models/types';
import { GlobalMenuService } from '../../core/services/global-menu.service';

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
      class="site-card"
      [class.is-floating]="isMenuOpen()"
      [cdkContextMenuTriggerFor]="menu"
      #trigger="cdkContextMenuTriggerFor"
      (cdkContextMenuOpened)="onContextMenuOpened()"
      (cdkContextMenuClosed)="onContextMenuClosed()"
      appLongPress
      (longPress)="openContextMenu($event)"
    >
      <a
        [href]="site().url"
        target="_blank"
        rel="noopener noreferrer"
        class="site-link"
        [title]="site().title || displayTitle()"
      >
        @if (showSkeleton()) {
          <div class="skeleton w-8 h-8 rounded-[7px] shrink-0"></div>
        } @else if (hasIcon()) {
          <img
            [src]="iconUrl()"
            [alt]="displayTitle()"
            class="site-icon"
            width="32"
            height="32"
            (error)="onIconError()"
          />
        } @else {
          <div
            class="w-8 h-8 rounded-[7px] bg-base-200 flex items-center justify-center text-base-content/60 shrink-0"
          >
            <svg lucideGlobe class="w-5 h-5"></svg>
          </div>
        }
        <span class="site-title">{{ displayTitle() }}</span>
      </a>

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
        position: relative;
        width: 72px;
        flex-shrink: 0;

        &.is-floating {
          border-radius: 8px;
          box-shadow:
            0 10px 20px rgba(0, 0, 0, 0.15),
            0 3px 6px rgba(0, 0, 0, 0.1);

          .site-link:hover {
            background: none;
          }
        }

        .site-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
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

          &:hover {
            background: var(--color-base-200);
          }

          .site-icon {
            width: 32px;
            height: 32px;
            border-radius: 7px;
            object-fit: contain;
            flex-shrink: 0;
          }

          .site-title {
            font-size: 14px;
            line-height: 1.3;
            color: var(--color-base-content);
            max-width: 70px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    `,
  ],
})
export class SiteCardComponent {
  site = input.required<Site>();
  isFetching = input<boolean>(false);

  editSite = output<Site>();
  deleteSite = output<Site>();

  @ViewChild(CdkContextMenuTrigger) triggerMenu?: CdkContextMenuTrigger;

  isMenuOpen = signal(false);

  private globalMenuService = inject(GlobalMenuService);

  openContextMenu(event: PointerEvent): void {
    this.globalMenuService.registerOpenedMenu(() => this.closeMenu());
    this.triggerMenu?.open({ x: event.clientX, y: event.clientY });
  }

  onContextMenuOpened(): void {
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

  onIconError(): void {
    if (!this.iconFailed()) {
      this.iconFailed.set(true);
    }
  }
}
