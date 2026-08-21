import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  ViewChildren,
  QueryList,
} from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { LucideGripVertical, LucidePlus, LucideSearch } from '@lucide/angular';

import type {
  BoardData,
  Group,
  LayoutRow,
  ReorderItem,
  Site,
  SiteReorderItem,
} from '../../core/models/types';
import { GroupContainerComponent } from '../../shared/group-container/group-container.component';
import { SiteCardComponent } from '../../shared/site-card/site-card.component';
import { ExternalDropZoneComponent } from '../../shared/external-drop-zone/external-drop-zone.component';
import { ConfigService } from '../../core/services/config.service';

@Component({
  selector: 'app-sites-board',
  standalone: true,
  imports: [
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    SiteCardComponent,
    GroupContainerComponent,
    ExternalDropZoneComponent,
    LucidePlus,
    LucideGripVertical,
    LucideSearch,
  ],
  templateUrl: './sites-board.component.html',
  styles: [
    `
      .site-grid {
        grid-auto-flow: dense;
      }
    `,
  ],
})
export class SitesBoardComponent {
  configService = inject(ConfigService);

  boardData = input<BoardData | null>(null);
  searchQuery = input<string>('');
  isLoading = input<boolean>(false);
  isError = input<boolean>(false);
  fetchingSiteIds = input<Set<number>>(new Set());

  addSite = output<void>();
  addSiteInGroup = output<Partial<Site>>();
  editSite = output<Site>();
  deleteSite = output<Site>();
  editGroup = output<Group>();
  deleteGroup = output<Group>();
  reorderGroups = output<ReorderItem[]>();
  reorderSites = output<SiteReorderItem[]>();
  externalSiteDropped = output<Partial<Site> | string>();

  @ViewChildren(GroupContainerComponent) groupContainers?: QueryList<GroupContainerComponent>;
  @ViewChildren(SiteCardComponent) siteCards?: QueryList<SiteCardComponent>;

  closeAllMenus(): void {
    this.groupContainers?.forEach((c) => c.closeMenu());
    this.siteCards?.forEach((c) => c.closeMenu());
  }

  isSiteFetching(siteId: number): boolean {
    return this.fetchingSiteIds().has(siteId);
  }

  isSearching = computed(() => !!this.searchQuery().trim());

  /** Mutable copy of the ungrouped sites for drag-and-drop animations. */
  localUngroupedSites = signal<Site[]>([]);

  /** Mutable copy of the group rows for drag-and-drop animations. */
  localGroupRows = signal<LayoutRow[]>([]);

  constructor() {
    effect(() => {
      const rows = this.layoutRows();
      const ungroupedRow = rows.find((r) => r.type === 'ungrouped');
      this.localUngroupedSites.set(ungroupedRow ? [...ungroupedRow.sites] : []);

      const groupRows = rows
        .filter((r) => r.type === 'group')
        .map((r) => ({ ...r, sites: [...r.sites] }));
      this.localGroupRows.set(groupRows);
    });
  }

  /** Computed layout from server data and current search query. */
  layoutRows = computed<LayoutRow[]>(() => {
    return this.computeLayout(this.boardData(), this.searchQuery());
  });

  /** IDs of all inner site drop lists — used for cdkDropListConnectedTo. */
  allSiteDropListIds = computed(() => ['ungrouped-0', ...this.localGroupRows().map((r) => r.id)]);

  private computeLayout(data: BoardData | null, queryStr?: string): LayoutRow[] {
    if (!data) return [];

    const query = (queryStr ?? '').trim().toLowerCase();
    const matchesSite = (site: Site) => {
      const titleMatch = site.title ? site.title.toLowerCase().includes(query) : false;
      const urlMatch = site.url ? site.url.toLowerCase().includes(query) : false;
      const descMatch = site.description ? site.description.toLowerCase().includes(query) : false;
      return titleMatch || urlMatch || descMatch;
    };

    const rows: LayoutRow[] = [];

    // 1. Ungrouped sites row
    const ungroupedSites = query ? data.ungrouped_sites?.filter(matchesSite) : data.ungrouped_sites;

    if (ungroupedSites?.length) {
      rows.push({
        type: 'ungrouped',
        sites: ungroupedSites,
        id: 'ungrouped-0',
      });
    }

    // 2. Group rows (hide empty matching groups during search, keep all during normal mode)
    for (const group of data.groups ?? []) {
      const groupSites = query ? (group.sites ?? []).filter(matchesSite) : (group.sites ?? []);

      if (!query || groupSites.length > 0) {
        rows.push({
          type: 'group',
          group,
          sites: groupSites,
          id: `group-${group.id}`,
        });
      }
    }

    return rows;
  }

  /** Called when a group row is dropped in a new position (outer list). */
  onRowDrop(event: CdkDragDrop<LayoutRow[]>): void {
    if (this.isSearching()) return;

    const rows = [...this.localGroupRows()];
    moveItemInArray(rows, event.previousIndex, event.currentIndex);
    this.localGroupRows.set(rows);

    const groupItems: ReorderItem[] = rows
      .filter((row): row is Extract<LayoutRow, { type: 'group' }> => row.type === 'group')
      .map((row, idx) => ({
        id: row.group.id,
        sort_order: idx * 100,
      }));

    this.reorderGroups.emit(groupItems);
  }

  /** Called when a site is dropped (inner site lists). */
  onSiteDrop(event: CdkDragDrop<Site[]>): void {
    if (this.isSearching()) return;

    const isSourceUngrouped = event.previousContainer.id === 'ungrouped-0';
    const isTargetUngrouped = event.container.id === 'ungrouped-0';

    const sourceArray = isSourceUngrouped
      ? this.localUngroupedSites()
      : this.localGroupRows().find((r) => r.id === event.previousContainer.id)?.sites;

    const targetArray = isTargetUngrouped
      ? this.localUngroupedSites()
      : this.localGroupRows().find((r) => r.id === event.container.id)?.sites;

    if (!sourceArray || !targetArray) return;

    if (event.previousContainer === event.container) {
      const newArray = [...sourceArray];
      moveItemInArray(newArray, event.previousIndex, event.currentIndex);
      if (isSourceUngrouped) {
        this.localUngroupedSites.set(newArray);
      } else {
        this.updateGroupSites(event.previousContainer.id, newArray);
      }
    } else {
      const newSourceArray = [...sourceArray];
      const newTargetArray = [...targetArray];
      transferArrayItem(newSourceArray, newTargetArray, event.previousIndex, event.currentIndex);

      if (isSourceUngrouped) {
        this.localUngroupedSites.set(newSourceArray);
      } else {
        this.updateGroupSites(event.previousContainer.id, newSourceArray);
      }

      if (isTargetUngrouped) {
        this.localUngroupedSites.set(newTargetArray);
      } else {
        this.updateGroupSites(event.container.id, newTargetArray);
      }
    }

    const siteItems: SiteReorderItem[] = [];

    this.localGroupRows().forEach((row) => {
      if (row.type === 'group') {
        row.sites.forEach((site, idx) => {
          siteItems.push({ id: site.id, sort_order: idx * 10, group_id: row.group.id });
        });
      }
    });

    this.localUngroupedSites().forEach((site, idx) => {
      siteItems.push({ id: site.id, sort_order: idx * 10, group_id: null });
    });

    this.reorderSites.emit(siteItems);
  }

  private updateGroupSites(groupId: string, sites: Site[]) {
    const rows = this.localGroupRows().map((r) => {
      if (r.id === groupId) {
        return { ...r, sites };
      }
      return r;
    });
    this.localGroupRows.set(rows);
  }
}
