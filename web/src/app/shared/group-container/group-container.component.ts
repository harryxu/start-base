import { Component, input, output, signal } from '@angular/core';
import { LucideChevronDown, LucideChevronUp, LucidePencil, LucideTrash2 } from '@lucide/angular';

import type { Group, Site } from '../../core/models/types';
import { SiteCardComponent } from '../site-card/site-card.component';

@Component({
  selector: 'app-group-container',
  standalone: true,
  imports: [SiteCardComponent, LucideChevronDown, LucideChevronUp, LucidePencil, LucideTrash2],
  template: `
    <div class="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <!-- Group header (click to collapse/expand) -->
      <div
        class="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 bg-gray-50/60 cursor-pointer select-none transition-colors hover:bg-gray-100/60"
        (click)="toggleCollapse()"
      >
        <!-- Placeholder for drag handle to maintain alignment -->
        <div class="w-5 h-5 flex-shrink-0"></div>
        <span class="text-sm font-medium text-gray-700 flex-1">{{ group().name }}</span>

        <!-- Edit mode controls -->
        @if (editMode()) {
          <button
            (click)="$event.stopPropagation(); editGroup.emit(group())"
            class="group-btn"
            title="Rename group"
          >
            <svg lucidePencil class="w-3.5 h-3.5"></svg>
          </button>
          <button
            (click)="$event.stopPropagation(); deleteGroup.emit(group())"
            class="group-btn group-btn-danger"
            title="Delete group"
          >
            <svg lucideTrash2 class="w-3.5 h-3.5"></svg>
          </button>
        }

        <!-- Collapse toggle -->
        <div class="w-[26px] h-[26px] flex items-center justify-center">
          @if (collapsed()) {
            <svg lucideChevronDown class="w-4 h-4 text-gray-400"></svg>
          } @else {
            <svg lucideChevronUp class="w-4 h-4 text-gray-400"></svg>
          }
        </div>
      </div>

      <!-- Sites grid (hidden when collapsed) -->
      @if (!collapsed()) {
        <div class="flex flex-wrap gap-1 p-3 min-h-20">
          @for (site of sites(); track site.id) {
            <app-site-card
              [site]="site"
              [editMode]="editMode()"
              (editSite)="editSite.emit($event)"
              (deleteSite)="deleteSite.emit($event)"
            />
          }
          @if (sites().length === 0) {
            <p class="text-xs text-gray-300 self-center px-2">No sites in this group yet.</p>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .group-btn {
        width: 26px;
        height: 26px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 5px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: #9ca3af;
        transition: color 0.15s, background 0.15s;
      }

      .group-btn:hover {
        color: #374151;
        background: #f3f4f6;
      }

      .group-btn-danger:hover {
        color: #ef4444;
        background: #fef2f2;
      }
    `,
  ],
})
export class GroupContainerComponent {
  group = input.required<Group>();
  sites = input<Site[]>([]);
  editMode = input<boolean>(false);

  editGroup = output<Group>();
  deleteGroup = output<Group>();
  editSite = output<Site>();
  deleteSite = output<Site>();

  collapsed = signal(false);

  toggleCollapse(): void {
    this.collapsed.update((v) => !v);
  }
}
