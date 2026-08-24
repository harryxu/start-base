import { CdkContextMenuTrigger, CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input, output, signal, ViewChild } from '@angular/core';
import { LucideEllipsis, LucideGripVertical, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { LongPressDirective } from '../long-press.directive';

import type { Site, SiteViewMode } from '../../core/models/types';
import { GlobalMenuService } from '../../core/services/global-menu.service';
import { ConfigService } from '../../core/services/config.service';
import { SiteBuiltinComponent } from './site-builtin.component';
import { IframePluginComponent } from './iframe-plugin.component';
import { WebcomponentPluginComponent } from './webcomponent-plugin.component';

@Component({
  selector: 'app-site-card',
  standalone: true,
  imports: [
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    CdkContextMenuTrigger,
    CdkDragHandle,
    LongPressDirective,
    LucideEllipsis,
    LucideGripVertical,
    LucidePencil,
    LucideTrash2,
    SiteBuiltinComponent,
    IframePluginComponent,
    WebcomponentPluginComponent,
  ],
  template: `
    <div
      class="site-card min-w-2 relative shrink-0 h-full"
      [class]="sizeClass()"
      [class.has-border]="effectiveBorder()"
      [class.is-floating]="!configService.isReadOnly() && isMenuOpen()"
      [class.app-with-bgimg]="configService.bgUrl()"
      [class.app-without-bgimg]="!configService.bgUrl()"
      [class.grouped]="!!site().group_id"
      [class.ungrouped]="!site().group_id"
      [class.is-edit-mode]="configService.editMode()"
      [cdkContextMenuTriggerFor]="canUseContextMenu() ? menu : null"
      [cdkContextMenuDisabled]="!canUseContextMenu()"
      #triggerContextMenu="cdkContextMenuTriggerFor"
      (cdkContextMenuOpened)="onContextMenuOpened()"
      (cdkContextMenuClosed)="onContextMenuClosed()"
      appLongPress
      [disabled]="!canUseContextMenu()"
      (longPress)="openContextMenu($event)"
    >
      <!-- Edit Mode Action Controls: Drag Handle (Left) & Action Menu (Right) -->
      @if (configService.editMode() && !configService.isReadOnly()) {
        <!-- Drag Handle: Top-Left (has protective frosted backdrop for non-builtin plugins) -->
        <div
          cdkDragHandle
          class="drag-handle absolute top-1 left-1 z-30 p-1 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center pointer-events-auto"
          [class.has-backdrop]="isPluginSite()"
          title="Drag to reorder"
        >
          <svg lucideGripVertical class="w-3.5 h-3.5"></svg>
        </div>

        <!-- Action Menu Trigger Button: Top-Right with translucent glass shadow style -->
        <button
          type="button"
          [cdkMenuTriggerFor]="menu"
          #triggerBtnMenu="cdkMenuTriggerFor"
          (cdkMenuOpened)="onContextMenuOpened()"
          (cdkMenuClosed)="onContextMenuClosed()"
          (click)="$event.stopPropagation()"
          class="action-menu-btn absolute top-1 right-1 z-30 p-1 rounded-full cursor-pointer flex items-center justify-center pointer-events-auto"
          title="Card actions"
        >
          <svg lucideEllipsis class="w-3.5 h-3.5"></svg>
        </button>
      }

      <!-- Content -->
      @if (site().site_type === 'iframe') {
        <app-iframe-plugin [site]="site()" [sizeKey]="sizeKey()" />
      } @else if (site().site_type === 'webcomponent') {
        <app-webcomponent-plugin [site]="site()" [sizeKey]="sizeKey()" />
      } @else {
        <app-site-builtin
          [site]="site()"
          [sizeKey]="sizeKey()"
          [view_mode]="view_mode()"
          [isFetching]="isFetching()"
        />
      }

      <!-- CDK Context Menu Template -->
      <ng-template #menu>
        <div
          cdkMenu
          class="menu bg-base-100 border border-base-300 shadow-xl rounded-box p-2 min-w-30 z-50 flex flex-col gap-1"
        >
          <button
            cdkMenuItem
            (click)="onEditSite()"
            class="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-base-200 outline-none focus:outline-none rounded-lg w-full text-base-content font-medium transition-colors"
          >
            <svg lucidePencil class="w-4 h-4"></svg>
            <span>Edit</span>
          </button>
          <button
            cdkMenuItem
            (click)="onDeleteSite()"
            class="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-error/15 text-error outline-none focus:outline-none rounded-lg w-full font-medium transition-colors"
          >
            <svg lucideTrash2 class="w-4 h-4"></svg>
            <span>Delete</span>
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .action-menu-btn,
    .drag-handle.has-backdrop {
      background-color: color-mix(in oklab, var(--color-base-100) 35%, transparent);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: var(--color-base-content);
      box-shadow:
        0 4px 14px color-mix(in oklab, var(--color-base-content) 14%, transparent),
        0 1px 3px color-mix(in oklab, var(--color-base-content) 10%, transparent);

      &:hover {
        background-color: color-mix(in oklab, var(--color-base-100) 85%, transparent);
      }
    }

    .drag-handle:not(.has-backdrop) {
      color: color-mix(in oklab, var(--color-base-content) 55%, transparent);

      &:hover {
        color: var(--color-base-content);
      }
    }

    .site-card {
      &.is-edit-mode {
        border-radius: 10px;
        outline: 1px dashed color-mix(in oklab, var(--color-base-content) 12%, transparent);
        outline-offset: -1px;

        &:hover {
          outline-color: color-mix(in oklab, var(--color-primary) 50%, transparent);
        }
      }

      /* Floating elevation when context menu is open */
      &.is-floating {
        border-radius: 8px;
        box-shadow:
          0 10px 20px rgba(0, 0, 0, 0.15),
          0 3px 6px rgba(0, 0, 0, 0.1);
      }
    }
  `,
})
export class SiteCardComponent {
  configService = inject(ConfigService);
  site = input.required<Site>();
  isFetching = input<boolean>(false);
  view_mode = input<SiteViewMode>('full');
  hasBorder = input<boolean | undefined>(undefined);

  isPluginSite = computed(() => !!this.site().site_type && this.site().site_type !== 'builtin');

  effectiveBorder = computed(() => {
    const custom = this.hasBorder();
    if (custom !== undefined) {
      return custom;
    }
    return this.configService.siteBorder();
  });

  canUseContextMenu = computed(() => {
    if (this.configService.isReadOnly()) return false;
    if (this.configService.editMode()) return true;
    return !this.site().site_type || this.site().site_type === 'builtin';
  });

  editSite = output<Site>();
  deleteSite = output<Site>();

  @ViewChild('triggerContextMenu', { read: CdkContextMenuTrigger })
  triggerContextMenu?: CdkContextMenuTrigger;

  @ViewChild('triggerBtnMenu', { read: CdkMenuTrigger })
  triggerBtnMenu?: CdkMenuTrigger;

  isMenuOpen = signal(false);

  private globalMenuService = inject(GlobalMenuService);

  /** CSS modifier class added to the root element (e.g. 'size_1_1', 'size_2_1'). */
  sizeClass = computed(() => `size_${this.site().col_span || 1}_${this.site().row_span || 1}`);

  /** Key identifying the card dimensions ('1x1', '2x1', etc.). */
  sizeKey = computed(() => `${this.site().col_span || 1}x${this.site().row_span || 1}`);

  openContextMenu(event: PointerEvent): void {
    if (!this.canUseContextMenu()) return;
    this.globalMenuService.registerOpenedMenu(() => this.closeMenu());
    this.triggerContextMenu?.open({ x: event.clientX, y: event.clientY });
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
    this.triggerContextMenu?.close();
    this.triggerBtnMenu?.close();
    this.isMenuOpen.set(false);
  }

  onEditSite(): void {
    this.closeMenu();
    this.editSite.emit(this.site());
  }

  onDeleteSite(): void {
    this.closeMenu();
    this.deleteSite.emit(this.site());
  }
}
