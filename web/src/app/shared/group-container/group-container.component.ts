import { Component, input, output, signal, ViewChild, inject } from '@angular/core';
import { LucideMoreHorizontal, LucidePencil, LucideTrash2 } from '@lucide/angular';
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
    LucideMoreHorizontal,
    LucidePencil,
    LucideTrash2,
  ],
  template: `
    <div
      class="collapse collapse-arrow border rounded-xl shadow-sm overflow-hidden"
      [class.collapse-open]="!collapsed()"
      [class.collapse-close]="collapsed()"
      [class.border-base-300]="!configService.bgUrl()"
      [class.border-base-300/50]="configService.bgUrl()"
      [class.backdrop-blur-md]="configService.bgUrl()"
    >
      <!-- Group header -->
      <div
        class="collapse-title flex items-center justify-between min-h-0 py-2.5 pl-9 pr-12 select-none cursor-pointer"
        [class.bg-base-200]="!configService.bgUrl()"
        [class.bg-base-200/60]="configService.bgUrl()"
        [class.backdrop-blur-sm]="configService.bgUrl()"
        (click)="toggleCollapse()"
      >
        <span class="text-sm font-semibold text-base-content flex-1">
          {{ group().name }}
        </span>

        <!-- Quick actions button (•••) positioned to the left of collapse-arrow indicator -->
        <button
          [cdkMenuTriggerFor]="groupMenu"
          (cdkMenuOpened)="onGroupMenuOpened()"
          (click)="$event.stopPropagation()"
          class="btn btn-sm btn-ghost btn-square w-7 h-7 text-base-content/60 hover:text-base-content"
          title="Group actions"
        >
          <svg lucideMoreHorizontal class="w-4 h-4"></svg>
        </button>
      </div>

      <!-- Sites grid inside collapse-content -->
      <div
        class="collapse-content p-0 rounded-b-xl"
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
          class="flex flex-wrap gap-1 p-3 min-h-20"
        >
          @for (site of sites(); track site.id) {
            <div
              cdkDrag
              [cdkDragData]="site"
              [cdkDragStartDelay]="{ touch: 300, mouse: 150 }"
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

  editGroup = output<Group>();
  deleteGroup = output<Group>();
  editSite = output<Site>();
  deleteSite = output<Site>();
  siteDropped = output<CdkDragDrop<Site[]>>();
  siteDragStarted = output<void>();

  @ViewChild(CdkMenuTrigger) triggerMenu?: CdkMenuTrigger;

  private globalMenuService = inject(GlobalMenuService);

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
}
