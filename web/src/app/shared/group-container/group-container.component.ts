import { Component, input, output, signal, ViewChild, inject } from '@angular/core';
import { LucideEllipsis, LucidePencil, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { CdkDropList, CdkDrag, CdkDragPlaceholder, CdkDragDrop } from '@angular/cdk/drag-drop';

import type { Group, Site } from '../../core/models/types';
import { SiteCardComponent } from '../site-card/site-card.component';
import { GlobalMenuService } from '../../core/services/global-menu.service';
import { ConfigService } from '../../core/services/config.service';

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
    LucidePlus,
    LucidePencil,
    LucideTrash2,
  ],
  styles: [
    `
      .site-group {
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
    `,
  ],
  template: `
    <div
      class="site-group collapse collapse-arrow border rounded-xl shadow-sm overflow-hidden border-base-300/60 transition-all duration-200"
      [class.app-with-bgimg]="configService.bgUrl()"
      [class.app-without-bgimg]="!configService.bgUrl()"
      [class.collapse-open]="!collapsed()"
      [class.collapse-close]="collapsed()"
      [class.backdrop-blur-md]="configService.bgUrl()"
      [class.ring-2]="isExternalDragOver()"
      [class.ring-primary]="isExternalDragOver()"
      (dragenter)="onDragEnter($event)"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <!-- Group header -->
      <div
        class="group-header collapse-title flex items-center justify-between min-h-0 py-1.5 pl-9 pr-12 select-none cursor-pointer"
        [class.bg-base-200]="!configService.bgUrl()"
        [class.bg-base-200/70]="configService.bgUrl()"
        [class.backdrop-blur-sm]="configService.bgUrl()"
        (click)="toggleCollapse()"
      >
        <span class="text-sm font-semibold text-base-content flex-1">
          {{ group().name }}
        </span>

        <!-- Quick actions button (•••) positioned to the left of collapse-arrow indicator -->
        @if (!configService.isReadOnly()) {
          <button
            [cdkMenuTriggerFor]="groupMenu"
            (cdkMenuOpened)="onGroupMenuOpened()"
            (click)="$event.stopPropagation()"
            class="btn btn-sm btn-ghost btn-square w-7 h-7 text-base-content/60 hover:text-base-content"
            title="Group actions"
          >
            <svg lucideEllipsis class="w-4 h-4"></svg>
          </button>
        }
      </div>

      <!-- Sites grid inside collapse-content -->
      <div
        class="group-content collapse-content p-0 rounded-b-xl"
        [class.bg-base-100]="!configService.bgUrl()"
        [class.bg-base-100/50]="configService.bgUrl()"
        [class.backdrop-blur-sm]="configService.bgUrl()"
      >
        <div
          cdkDropList
          cdkDropListOrientation="mixed"
          [id]="'group-' + group().id"
          [cdkDropListData]="sites()"
          [cdkDropListConnectedTo]="allSiteDropListIds()"
          (cdkDropListDropped)="siteDropped.emit($event)"
          class="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1 p-3 min-h-20"
        >
          @for (site of sites(); track site.id) {
            <div
              cdkDrag
              [cdkDragData]="site"
              [cdkDragStartDelay]="{ touch: 300, mouse: 150 }"
              [cdkDragDisabled]="configService.isReadOnly()"
              (cdkDragStarted)="siteCard.closeMenu(); siteDragStarted.emit()"
            >
              <div
                *cdkDragPlaceholder
                class="w-18 h-16.5 rounded-lg border-2 border-dashed border-base-content/10 bg-base-200"
              ></div>
              <app-site-card
                #siteCard
                [site]="site"
                [isFetching]="isSiteFetching(site.id)"
                (editSite)="editSite.emit($event)"
                (deleteSite)="deleteSite.emit($event)"
              />
            </div>
          }
          @if (sites().length === 0) {
            <p class="text-xs text-base-content/40 self-center px-2">No sites in this group yet.</p>
          }
        </div>
      </div>

      <!-- CDK Group Menu Template -->
      <ng-template #groupMenu>
        <div
          cdkMenu
          class="menu bg-base-100 border border-base-300 shadow-xl rounded-box p-2 min-w-35 z-50 flex flex-col gap-1"
        >
          <button
            cdkMenuItem
            (click)="addSite.emit({ group_id: group().id })"
            class="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-base-200 outline-none focus:outline-none rounded-lg w-full text-base-content font-medium transition-colors"
          >
            <svg lucidePlus class="w-4 h-4"></svg>
            <span>Add Site</span>
          </button>
          <button
            cdkMenuItem
            (click)="editGroup.emit(group())"
            class="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-base-200 outline-none focus:outline-none rounded-lg w-full text-base-content font-medium transition-colors"
          >
            <svg lucidePencil class="w-4 h-4"></svg>
            <span>Rename</span>
          </button>
          <button
            cdkMenuItem
            (click)="deleteGroup.emit(group())"
            class="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-error/15 text-error outline-none focus:outline-none rounded-lg w-full font-medium transition-colors"
          >
            <svg lucideTrash2 class="w-4 h-4"></svg>
            <span>Delete</span>
          </button>
        </div>
      </ng-template>
    </div>
  `,
})
export class GroupContainerComponent {
  configService = inject(ConfigService);

  group = input.required<Group>();
  sites = input<Site[]>([]);
  allSiteDropListIds = input<string[]>([]);
  fetchingSiteIds = input<Set<number>>(new Set());

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

  collapsed = signal(false);

  toggleCollapse(): void {
    this.collapsed.update((v) => !v);
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
