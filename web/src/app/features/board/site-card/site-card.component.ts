import { CdkContextMenuTrigger, CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input, output, signal, ViewChild } from '@angular/core';
import {
  LucideEllipsis,
  LucideGripVertical,
  LucideGrid2x2,
  LucidePencil,
  LucideRectangleHorizontal,
  LucideRectangleVertical,
  LucideSquare,
  LucideTrash2,
} from '@lucide/angular';
import { LongPressDirective } from '../../../shared/long-press.directive';

import type { Site, SiteViewMode } from '../../../core/models/types';
import { GlobalMenuService } from '../../../core/services/global-menu.service';
import { ConfigService } from '../../../core/services/config.service';
import { BoardService } from '../../../core/services/board.service';
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
    LucideGrid2x2,
    LucidePencil,
    LucideRectangleHorizontal,
    LucideRectangleVertical,
    LucideSquare,
    LucideTrash2,
    SiteBuiltinComponent,
    IframePluginComponent,
    WebcomponentPluginComponent,
  ],
  templateUrl: './site-card.component.html',
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
  boardService = inject(BoardService);
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
    if (this.configService.editMode()) return false;
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

  isCurrentSize(col: number, row: number): boolean {
    return (this.site().col_span || 1) === col && (this.site().row_span || 1) === row;
  }

  onUpdateSize(col: number, row: number): void {
    this.closeMenu();
    if (this.isCurrentSize(col, row)) {
      return;
    }
    this.boardService.updateSite(this.site().id, { col_span: col, row_span: row });
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
