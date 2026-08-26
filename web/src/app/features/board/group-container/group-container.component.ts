import { Component, input, output, signal, computed, ViewChild, inject } from '@angular/core';
import {
  LucideEllipsis,
  LucideFolder,
  LucideGalleryThumbnails,
  LucideMinus,
  LucidePencil,
  LucidePlus,
  LucideSquare,
  LucideTrash2,
} from '@lucide/angular';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { CdkDropList, CdkDrag, CdkDragPlaceholder, CdkDragDrop } from '@angular/cdk/drag-drop';

import type { Group, Site, SiteViewMode } from '../../../core/models/types';
import { SiteCardComponent } from '../site-card/site-card.component';
import { GlobalMenuService } from '../../../core/services/global-menu.service';
import { ConfigService } from '../../../core/services/config.service';
import { GroupCollapseService } from '../../../core/services/group-collapse.service';
import { BoardService } from '../../../core/services/board.service';
import { API_BASE } from '../../../core/api/api.service';

@Component({
  selector: 'app-group-container',
  standalone: true,
  imports: [
    SiteCardComponent,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    LucideEllipsis,
    LucideFolder,
    LucidePlus,
    LucidePencil,
    LucideTrash2,
    LucideGalleryThumbnails,
    LucideSquare,
    LucideMinus,
  ],
  styles: [
    `
      .site-group {
        .group-header {
          position: relative;
          z-index: 1;
          box-shadow:
            0 1px 3px color-mix(in oklab, var(--color-base-content) 6%, transparent),
            0 1px 2px color-mix(in oklab, var(--color-base-content) 4%, transparent);

          &::after {
            color: color-mix(in oklab, var(--color-base-content) 40%, transparent);
            opacity: 0.5;
          }
        }

        &.app-without-bgimg {
          .group-content {
            background-color: color-mix(
              in oklab,
              var(--color-base-100) 93%,
              var(--color-base-content)
            );
          }
        }
      }

      .site-grid {
        grid-auto-flow: dense;
        grid-auto-rows: var(--site-row-height, 7rem);

        &.view-mode-icon {
          --site-row-height: 4.5rem;
        }

        &.view-mode-text {
          --site-row-height: 2.75rem;
        }

        &.has-border {
          gap: 0.75rem;
        }
      }

      /* Invert item order when opening above so menu items maintain a consistent distance to the cursor/finger whether opening upwards or downwards */
      ::ng-deep .cdk-overlay-pane.menu-opens-above .menu {
        flex-direction: column-reverse;
      }
    `,
  ],
  templateUrl: './group-container.component.html',
})
export class GroupContainerComponent {
  configService = inject(ConfigService);
  private boardService = inject(BoardService);

  /**
   * Preferred positions for the group header menu: opens upward from the trigger.
   */
  readonly groupMenuPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      panelClass: 'menu-opens-above',
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      panelClass: 'menu-opens-above',
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      panelClass: 'menu-opens-below',
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      panelClass: 'menu-opens-below',
    },
  ];

  group = input.required<Group>();
  sites = input<Site[]>([]);
  view_mode = input<SiteViewMode>('full');
  allSiteDropListIds = input<string[]>([]);
  fetchingSiteIds = input<Set<number>>(new Set());

  effectiveViewMode = computed<SiteViewMode>(() => {
    const groupMode = this.group().site_view_mode?.trim() as SiteViewMode | '';
    if (groupMode) {
      return groupMode;
    }
    return this.view_mode();
  });

  effectiveSiteBorder = computed<boolean>(() => {
    const border = this.group().site_border?.trim();
    if (border === '1') {
      return true;
    }
    if (border === '0') {
      return false;
    }
    return this.configService.siteBorder();
  });

  dragStartDelay = computed(() =>
    this.configService.editMode() ? 0 : { touch: 300, mouse: 150 },
  );

  addSite = output<Partial<Site>>();
  editGroup = output<Group>();
  deleteGroup = output<Group>();
  editSite = output<Site>();
  deleteSite = output<Site>();
  siteDropped = output<CdkDragDrop<Site[]>>();
  siteDragStarted = output<void>();
  externalSiteDropped = output<Partial<Site>>();

  @ViewChild(CdkMenuTrigger) triggerMenu?: CdkMenuTrigger;

  private globalMenuService = inject(GlobalMenuService);

  isExternalDragOver = signal(false);
  private dragCounter = 0;

  onGroupMenuOpened(): void {
    this.globalMenuService.registerOpenedMenu(() => this.closeMenu());
  }

  closeMenu(): void {
    this.triggerMenu?.close();
  }

  setSiteViewMode(mode: SiteViewMode): void {
    this.boardService.updateGroup(this.group().id, { site_view_mode: mode });
    this.closeMenu();
  }

  iconFailed = signal(false);

  fullIconUrl = computed(() => {
    const url = this.group().icon_url;
    if (!url) return '';
    return url.startsWith('/') ? `${API_BASE}${url}` : url;
  });

  onIconError(): void {
    this.iconFailed.set(true);
  }

  private groupCollapseService = inject(GroupCollapseService);

  collapsed = computed(() => this.groupCollapseService.isCollapsed(this.group().id));

  toggleCollapse(): void {
    this.groupCollapseService.toggleCollapsed(this.group().id);
  }

  isSiteFetching(siteId: number): boolean {
    return this.fetchingSiteIds().has(siteId);
  }

  // ---- HTML5 External Drag & Drop Handlers ----

  onDragEnter(event: DragEvent): void {
    if (this.configService.isReadOnly()) return;
    const types = event.dataTransfer?.types;
    const hasUrlOrFiles =
      types &&
      (types.includes('text/uri-list') || types.includes('Files') || types.includes('text/plain'));
    if (!hasUrlOrFiles) return;

    event.preventDefault();
    this.dragCounter++;
    if (this.dragCounter === 1) {
      this.isExternalDragOver.set(true);
    }
  }

  onDragOver(event: DragEvent): void {
    if (this.configService.isReadOnly()) return;
    const types = event.dataTransfer?.types;
    const hasUrlOrFiles =
      types &&
      (types.includes('text/uri-list') || types.includes('Files') || types.includes('text/plain'));
    if (!hasUrlOrFiles) return;

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDragLeave(event: DragEvent): void {
    if (this.configService.isReadOnly()) return;
    event.preventDefault();
    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.dragCounter = 0;
      this.isExternalDragOver.set(false);
    }
  }

  onDrop(event: DragEvent): void {
    if (this.configService.isReadOnly()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter = 0;
    this.isExternalDragOver.set(false);

    const url =
      event.dataTransfer?.getData('text/uri-list') ||
      event.dataTransfer?.getData('text/plain') ||
      '';
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      this.externalSiteDropped.emit({ url, group_id: this.group().id });
    }
  }
}
