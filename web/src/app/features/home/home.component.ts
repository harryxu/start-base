import {
  Component,
  computed,
  effect,
  inject,
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
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../../core/api/api.service';
import type {
  Group,
  GroupCreate,
  GroupUpdate,
  LayoutRow,
  ReorderItem,
  Site,
  SiteCreate,
  SiteReorderItem,
  SiteUpdate,
} from '../../core/models/types';
import { GroupContainerComponent } from '../../shared/group-container/group-container.component';
import { SiteCardComponent } from '../../shared/site-card/site-card.component';
import { SiteFormComponent } from '../../shared/site-form/site-form.component';
import { GroupFormComponent } from '../../shared/group-form/group-form.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { ExternalDropZoneComponent } from '../../shared/external-drop-zone/external-drop-zone.component';
import { HeaderComponent } from '../../shared/header/header.component';

import { LucideGripVertical, LucidePlus } from '@lucide/angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    SiteCardComponent,
    GroupContainerComponent,
    SiteFormComponent,
    LucidePlus,
    LucideGripVertical,
    GroupFormComponent,
    ConfirmDialogComponent,
    ExternalDropZoneComponent,
    HeaderComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private api = inject(ApiService);
  private queryClient = inject(QueryClient);

  @ViewChildren(GroupContainerComponent) groupContainers?: QueryList<GroupContainerComponent>;
  @ViewChildren(SiteCardComponent) siteCards?: QueryList<SiteCardComponent>;

  closeAllMenus(): void {
    this.groupContainers?.forEach((c) => c.closeMenu());
    this.siteCards?.forEach((c) => c.closeMenu());
  }

  // ---- Server state ----

  sitesQuery = injectQuery(() => ({
    queryKey: ['sites'],
    queryFn: () => firstValueFrom(this.api.getSites()),
  }));

  groupsQuery = injectQuery(() => ({
    queryKey: ['groups'],
    queryFn: () => firstValueFrom(this.api.getGroups()),
  }));

  // ---- Mutations ----

  createSiteMutation = injectMutation(() => ({
    mutationFn: (data: SiteCreate) => firstValueFrom(this.api.createSite(data)),
    onSuccess: (newSite, variables) => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
      this.addLocalSite(newSite);
      if (!variables.title || !variables.icon_url) {
        this.fetchingSiteIds.update((set: Set<number>) => new Set(set).add(newSite.id));
      }
    },
  }));

  updateSiteMutation = injectMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: SiteUpdate }) =>
      firstValueFrom(this.api.updateSite(id, data)),
    onSuccess: (updatedSite) => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
      this.updateLocalSite(updatedSite);
    },
  }));

  deleteSiteMutation = injectMutation(() => ({
    mutationFn: (id: number) => firstValueFrom(this.api.deleteSite(id)),
    onSuccess: (_, id) => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
      this.deleteLocalSite(id);
    },
  }));

  createGroupMutation = injectMutation(() => ({
    mutationFn: (data: GroupCreate) => firstValueFrom(this.api.createGroup(data)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  }));

  updateGroupMutation = injectMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: GroupUpdate }) =>
      firstValueFrom(this.api.updateGroup(id, data)),
    onSuccess: (updatedGroup) => {
      this.queryClient.invalidateQueries({ queryKey: ['groups'] });
      this.updateLocalGroup(updatedGroup);
    },
  }));

  deleteGroupMutation = injectMutation(() => ({
    mutationFn: (id: number) => firstValueFrom(this.api.deleteGroup(id)),
    onSuccess: (_, id) => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
      this.queryClient.invalidateQueries({ queryKey: ['groups'] });
      this.deleteLocalGroup(id);
    },
  }));

  reorderGroupsMutation = injectMutation(() => ({
    mutationFn: (groups: ReorderItem[]) => firstValueFrom(this.api.reorderGroups(groups)),
    onError: () => {
      this.queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  }));

  reorderSitesMutation = injectMutation(() => ({
    mutationFn: (sites: SiteReorderItem[]) => firstValueFrom(this.api.reorderSites(sites)),
    onError: () => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  }));

  // ---- UI state ----

  fetchingSiteIds = signal<Set<number>>(new Set());

  isSiteFetching(siteId: number): boolean {
    return this.fetchingSiteIds().has(siteId);
  }

  /** Mutable copy of the ungrouped sites. */
  localUngroupedSites = signal<Site[]>([]);
  /** Mutable copy of the group rows. */
  localGroupRows = signal<LayoutRow[]>([]);

  showSiteForm = signal(false);
  editingSite = signal<Site | null>(null);
  prefilledUrl = signal('');

  showGroupForm = signal(false);
  editingGroup = signal<Group | null>(null);

  deletingSite = signal<Site | null>(null);
  deletingGroup = signal<Group | null>(null);

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

  // ---- Derived state ----

  /** Computed layout from server data. */
  layoutRows = computed<LayoutRow[]>(() => {
    const sites = this.sitesQuery.data() ?? [];
    const groups = this.groupsQuery.data() ?? [];
    return this.computeLayout(sites, groups);
  });

  /** IDs of all inner site drop lists — used for cdkDropListConnectedTo. */
  allSiteDropListIds = computed(() => ['ungrouped-0', ...this.localGroupRows().map((r) => r.id)]);

  // ---- Layout computation ----

  private computeLayout(sites: Site[], groups: Group[]): LayoutRow[] {
    const ungrouped = sites
      .filter((s) => s.group_id === null)
      .sort((a, b) => a.sort_order - b.sort_order);

    const sortedGroups = [...groups].sort((a, b) => a.sort_order - b.sort_order);

    const rows: LayoutRow[] = [];

    if (ungrouped.length > 0) {
      rows.push({ type: 'ungrouped', sites: ungrouped, id: 'ungrouped-0' });
    }

    for (const group of sortedGroups) {
      const groupSites = sites
        .filter((s) => s.group_id === group.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      rows.push({
        type: 'group',
        group: group,
        sites: groupSites,
        id: `group-${group.id}`,
      });
    }

    return rows;
  }

  // ---- Drag and drop ----

  /** Called when a group row is dropped in a new position (outer list). */
  onRowDrop(event: CdkDragDrop<LayoutRow[]>): void {
    const rows = [...this.localGroupRows()];
    moveItemInArray(rows, event.previousIndex, event.currentIndex);
    this.localGroupRows.set(rows);

    const groupItems: ReorderItem[] = rows
      .filter((row): row is Extract<LayoutRow, { type: 'group' }> => row.type === 'group')
      .map((row, idx) => ({
        id: row.group.id,
        sort_order: idx * 100,
      }));

    this.reorderGroupsMutation.mutate(groupItems);
  }

  /** Called when a site is dropped (inner site lists). Handles within-row and cross-row moves. */
  onSiteDrop(event: CdkDragDrop<Site[]>): void {
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

    this.reorderSitesMutation.mutate(siteItems);
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

  // ---- Site actions ----

  openAddSiteForm(url = ''): void {
    this.editingSite.set(null);
    this.prefilledUrl.set(url);
    this.showSiteForm.set(true);
  }

  openEditSiteForm(site: Site): void {
    this.editingSite.set(site);
    this.prefilledUrl.set('');
    this.showSiteForm.set(true);
  }

  closeSiteForm(): void {
    this.showSiteForm.set(false);
    this.editingSite.set(null);
    this.prefilledUrl.set('');
  }

  onSiteFormSubmit(data: SiteCreate): void {
    const editing = this.editingSite();
    if (editing) {
      this.updateSiteMutation.mutate({ id: editing.id, data });
    } else {
      this.saveNewSite(data);
    }
    this.closeSiteForm();
  }

  onExternalSiteDropped(url: string): void {
    if (!url) return;
    this.saveNewSite({ url });
  }

  private saveNewSite(data: SiteCreate): void {
    const sites = this.sitesQuery.data() ?? [];
    const maxOrder = sites.length > 0 ? Math.max(...sites.map((s) => s.sort_order)) : 0;
    this.createSiteMutation.mutate({ ...data, sort_order: data.sort_order ?? maxOrder + 100 });
    if (!data.title || !data.icon_url) {
      setTimeout(async () => {
        await this.queryClient.invalidateQueries({ queryKey: ['sites'] });
        this.fetchingSiteIds.update((set: Set<number>) => {
          const next = new Set(set);
          next.clear();
          return next;
        });
      }, 2500);
    }
  }

  onDeleteSite(site: Site): void {
    this.deletingSite.set(site);
  }

  confirmDeleteSite(): void {
    const site = this.deletingSite();
    if (site) {
      this.deleteSiteMutation.mutate(site.id);
      this.deletingSite.set(null);
    }
  }

  cancelDeleteSite(): void {
    this.deletingSite.set(null);
  }

  // ---- Group actions ----

  openAddGroupDialog(): void {
    this.editingGroup.set(null);
    this.showGroupForm.set(true);
  }

  onEditGroup(group: Group): void {
    this.editingGroup.set(group);
    this.showGroupForm.set(true);
  }

  closeGroupForm(): void {
    this.showGroupForm.set(false);
    this.editingGroup.set(null);
  }

  onGroupFormSubmit(data: GroupCreate): void {
    const editing = this.editingGroup();
    if (editing) {
      if (data.name !== editing.name) {
        this.updateGroupMutation.mutate({ id: editing.id, data: { name: data.name } });
      }
    } else {
      const groups = this.groupsQuery.data() ?? [];
      const maxOrder = groups.length > 0 ? Math.max(...groups.map((g) => g.sort_order)) : 0;
      this.createGroupMutation.mutate({ name: data.name, sort_order: maxOrder + 100 });
    }
    this.closeGroupForm();
  }

  onDeleteGroup(group: Group): void {
    this.deletingGroup.set(group);
  }

  confirmDeleteGroup(): void {
    const group = this.deletingGroup();
    if (group) {
      this.deleteGroupMutation.mutate(group.id);
      this.deletingGroup.set(null);
    }
  }

  cancelDeleteGroup(): void {
    this.deletingGroup.set(null);
  }

  // ---- Helper methods to sync local state in edit mode ----

  private updateLocalSite(updatedSite: Site): void {
    this.localUngroupedSites.update((sites) =>
      sites.map((s) => (s.id === updatedSite.id ? updatedSite : s)),
    );
    this.localGroupRows.update((rows) =>
      rows.map((row) => ({
        ...row,
        sites: row.sites.map((s) => (s.id === updatedSite.id ? updatedSite : s)),
      })),
    );
  }

  private deleteLocalSite(siteId: number): void {
    this.localUngroupedSites.update((sites) => sites.filter((s) => s.id !== siteId));
    this.localGroupRows.update((rows) =>
      rows.map((row) => ({
        ...row,
        sites: row.sites.filter((s) => s.id !== siteId),
      })),
    );
  }

  private addLocalSite(newSite: Site): void {
    if (newSite.group_id === null) {
      this.localUngroupedSites.update((sites) => [...sites, newSite]);
    } else {
      this.localGroupRows.update((rows) =>
        rows.map((row) => {
          if (row.type === 'group' && row.group.id === newSite.group_id) {
            return { ...row, sites: [...row.sites, newSite] };
          }
          return row;
        }),
      );
    }
  }

  private updateLocalGroup(updatedGroup: Group): void {
    this.localGroupRows.update((rows) =>
      rows.map((row) => {
        if (row.type === 'group' && row.group.id === updatedGroup.id) {
          return { ...row, group: updatedGroup };
        }
        return row;
      }),
    );
  }

  private deleteLocalGroup(groupId: number): void {
    const groupRow = this.localGroupRows().find(
      (row) => row.type === 'group' && row.group.id === groupId,
    );
    if (groupRow) {
      const movedSites = groupRow.sites.map((s) => ({ ...s, group_id: null }));
      this.localUngroupedSites.update((sites) => [...sites, ...movedSites]);
    }
    this.localGroupRows.update((rows) =>
      rows.filter((row) => !(row.type === 'group' && row.group.id === groupId)),
    );
  }
}
