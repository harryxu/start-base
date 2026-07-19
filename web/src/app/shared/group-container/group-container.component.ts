import { Component, input, output, signal, ViewChild } from '@angular/core';
import {
  LucideChevronDown,
  LucideChevronUp,
  LucideMoreHorizontal,
  LucidePencil,
  LucideTrash2,
} from '@lucide/angular';
import { CdkMenu, CdkMenuItem, CdkContextMenuTrigger } from '@angular/cdk/menu';
import { CdkDropList, CdkDrag, CdkDragPlaceholder, CdkDragDrop } from '@angular/cdk/drag-drop';
import { LongPressDirective } from '../long-press.directive';

import type { Group, Site } from '../../core/models/types';
import { SiteCardComponent } from '../site-card/site-card.component';

@Component({
  selector: 'app-group-container',
  standalone: true,
  imports: [
    SiteCardComponent,
    CdkMenu,
    CdkMenuItem,
    CdkContextMenuTrigger,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    LongPressDirective,
    LucideChevronDown,
    LucideChevronUp,
    LucideMoreHorizontal,
    LucidePencil,
    LucideTrash2,
  ],
  template: `
    <div class="border border-base-300 rounded-xl bg-base-100 shadow-sm overflow-hidden">
      <!-- Group header -->
      <div
        class="flex items-center gap-2 pl-9 pr-3 py-2 border-b border-base-200 bg-base-200/40 select-none"
        [cdkContextMenuTriggerFor]="groupMenu"
        #trigger="cdkContextMenuTriggerFor"
        appLongPress
        (longPress)="trigger.open({ x: $event.clientX, y: $event.clientY })"
      >
        <!-- Collapse toggle arrow -->
        <button
          (click)="$event.stopPropagation(); toggleCollapse()"
          class="btn btn-sm btn-ghost btn-square w-7 h-7"
          title="Toggle collapse"
        >
          @if (collapsed()) {
            <svg lucideChevronDown class="w-4 h-4 text-base-content/60"></svg>
          } @else {
            <svg lucideChevronUp class="w-4 h-4 text-base-content/60"></svg>
          }
        </button>

        <span
          (click)="toggleCollapse()"
          class="text-sm font-semibold text-base-content flex-1 cursor-pointer"
        >
          {{ group().name }}
        </span>

        <!-- Quick actions button (•••) -->
        <button
          (click)="$event.stopPropagation(); trigger.open({ x: $event.clientX, y: $event.clientY })"
          class="btn btn-sm btn-ghost btn-square w-7 h-7 text-base-content/60 hover:text-base-content"
          title="Group actions"
        >
          <svg lucideMoreHorizontal class="w-4 h-4"></svg>
        </button>
      </div>

      <!-- Sites grid (hidden when collapsed) -->
      @if (!collapsed()) {
        <div
          cdkDropList
          cdkDropListOrientation="mixed"
          [id]="'group-' + group().id"
          [cdkDropListData]="sites()"
          [cdkDropListConnectedTo]="allSiteDropListIds()"
          (cdkDropListDropped)="siteDropped.emit($event)"
          class="flex flex-wrap gap-1 p-3 min-h-20 bg-base-100"
        >
          @for (site of sites(); track site.id) {
            <div cdkDrag [cdkDragData]="site">
              <div *cdkDragPlaceholder class="w-[72px] h-[66px] rounded-lg border-2 border-dashed border-base-content/10 bg-base-200"></div>
              <app-site-card
                [site]="site"
                (editSite)="editSite.emit($event)"
                (deleteSite)="deleteSite.emit($event)"
              />
            </div>
          }
          @if (sites().length === 0) {
            <p class="text-xs text-base-content/40 self-center px-2">No sites in this group yet.</p>
          }
        </div>
      }

      <!-- CDK Group Menu Template -->
      <ng-template #groupMenu>
        <div
          cdkMenu
          class="menu bg-base-100 border border-base-300 shadow-xl rounded-box p-2 min-w-[140px] z-50 flex flex-col gap-1"
        >
          <button
            cdkMenuItem
            (click)="editGroup.emit(group())"
            class="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-base-200 rounded-lg w-full text-base-content font-medium transition-colors"
          >
            <svg lucidePencil class="w-4 h-4"></svg>
            <span>Rename Group</span>
          </button>
          <button
            cdkMenuItem
            (click)="deleteGroup.emit(group())"
            class="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-error/15 text-error rounded-lg w-full font-medium transition-colors"
          >
            <svg lucideTrash2 class="w-4 h-4"></svg>
            <span>Delete Group</span>
          </button>
        </div>
      </ng-template>
    </div>
  `,
})
export class GroupContainerComponent {
  group = input.required<Group>();
  sites = input<Site[]>([]);
  allSiteDropListIds = input<string[]>([]);

  editGroup = output<Group>();
  deleteGroup = output<Group>();
  editSite = output<Site>();
  deleteSite = output<Site>();
  siteDropped = output<CdkDragDrop<Site[]>>();

  @ViewChild(CdkContextMenuTrigger) triggerMenu?: CdkContextMenuTrigger;

  closeMenu(): void {
    this.triggerMenu?.close();
  }

  collapsed = signal(false);

  toggleCollapse(): void {
    this.collapsed.update((v) => !v);
  }
}
