import { Component, computed, inject, signal } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {
  injectMutation,
  injectQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
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

import {
  LucideFolderPlus,
  LucideGripVertical,
  LucidePencil,
  LucidePlus,
  LucideSave,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';

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
    LucideFolderPlus,
    LucidePencil,
    LucideSave,
    LucideX,
    LucideTrash2,
    LucideGripVertical,
    GroupFormComponent,
    ConfirmDialogComponent,
    ExternalDropZoneComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private api = inject(ApiService);
  private queryClient = inject(QueryClient);

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
    onSuccess: (newSite) => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
      if (this.editMode()) {
        this.addLocalSite(newSite);
      }
    },
  }));

  updateSiteMutation = injectMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: SiteUpdate }) =>
      firstValueFrom(this.api.updateSite(id, data)),
    onSuccess: (updatedSite) => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
      if (this.editMode()) {
        this.updateLocalSite(updatedSite);
      }
    },
  }));

  deleteSiteMutation = injectMutation(() => ({
    mutationFn: (id: number) => firstValueFrom(this.api.deleteSite(id)),
    onSuccess: (_, id) => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
      if (this.editMode()) {
        this.deleteLocalSite(id);
      }
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
      if (this.editMode()) {
        this.updateLocalGroup(updatedGroup);
      }
    },
  }));

  deleteGroupMutation = injectMutation(() => ({
    mutationFn: (id: number) => firstValueFrom(this.api.deleteGroup(id)),
    onSuccess: (_, id) => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
      this.queryClient.invalidateQueries({ queryKey: ['groups'] });
      if (this.editMode()) {
        this.deleteLocalGroup(id);
      }
    },
  }));

  reorderMutation = injectMutation(() => ({
    mutationFn: async (payload: {
      sites: SiteReorderItem[];
      groups: ReorderItem[];
    }) => {
      if (payload.sites.length > 0) {
        await firstValueFrom(this.api.reorderSites(payload.sites));
      }
      if (payload.groups.length > 0) {
        await firstValueFrom(this.api.reorderGroups(payload.groups));
      }
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
      this.queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  }));

  // ---- UI state ----

  editMode = signal(false);
  /** Mutable copy of the ungrouped sites used while in edit mode. */
  localUngroupedSites = signal<Site[]>([]);
  /** Mutable copy of the group rows used while in edit mode. */
  localGroupRows = signal<LayoutRow[]>([]);

  showSiteForm = signal(false);
  editingSite = signal<Site | null>(null);
  prefilledUrl = signal('');

  showGroupForm = signal(false);
  editingGroup = signal<Group | null>(null);

  deletingSite = signal<Site | null>(null);
  deletingGroup = signal<Group | null>(null);

  // ---- Derived state ----

  /** Computed layout from server data — used in view mode. */
  layoutRows = computed<LayoutRow[]>(() => {
    const sites = this.sitesQuery.data() ?? [];
    const groups = this.groupsQuery.data() ?? [];
    return this.computeLayout(sites, groups);
  });

  /** IDs of all inner site drop lists — used for cdkDropListConnectedTo. */
  allSiteDropListIds = computed(() => [
    'ungrouped-0',
    ...this.localGroupRows().map((r) => r.id)
  ]);

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

  // ---- Edit mode ----

  enterEditMode(): void {
    const rows = this.layoutRows();
    const ungroupedRow = rows.find((r) => r.type === 'ungrouped');
    this.localUngroupedSites.set(ungroupedRow ? [...ungroupedRow.sites] : []);
    
    const groupRows = rows
      .filter((r) => r.type === 'group')
      .map((r) => ({ ...r, sites: [...r.sites] }));
    this.localGroupRows.set(groupRows);
    
    this.editMode.set(true);
  }

  exitEditMode(): void {
    this.editMode.set(false);
    this.localUngroupedSites.set([]);
    this.localGroupRows.set([]);
  }

  saveLayout(): void {
    const ungroupedSites = this.localUngroupedSites();
    const groupRows = this.localGroupRows();
    
    const siteItems: SiteReorderItem[] = [];
    const groupItems: ReorderItem[] = [];

    // Assign sort_order values
    let groupOrder = 0;

    groupRows.forEach((row) => {
      if (row.type === 'group') {
        groupItems.push({ id: row.group.id, sort_order: groupOrder * 100 });
        groupOrder++;
        // Sites within a group use local sort_order
        row.sites.forEach((site, idx) => {
          siteItems.push({ id: site.id, sort_order: idx * 10, group_id: row.group.id });
        });
      }
    });

    // Ungrouped sites use local sort_order
    ungroupedSites.forEach((site, idx) => {
      siteItems.push({ id: site.id, sort_order: idx * 10, group_id: null });
    });

    this.reorderMutation.mutate({ sites: siteItems, groups: groupItems });
    this.editMode.set(false);
    this.localUngroupedSites.set([]);
    this.localGroupRows.set([]);
  }

  // ---- Drag and drop ----

  /** Called when a group row is dropped in a new position (outer list). */
  onRowDrop(event: CdkDragDrop<LayoutRow[]>): void {
    const rows = [...this.localGroupRows()];
    moveItemInArray(rows, event.previousIndex, event.currentIndex);
    this.localGroupRows.set(rows);
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
      const sites = this.sitesQuery.data() ?? [];
      const maxOrder = sites.length > 0 ? Math.max(...sites.map((s) => s.sort_order)) : 0;
      this.createSiteMutation.mutate({ ...data, sort_order: maxOrder + 100 });
      // Re-fetch after a delay so server-populated metadata becomes visible
      if (!data.title || !data.icon_url) {
        setTimeout(() => {
          this.queryClient.invalidateQueries({ queryKey: ['sites'] });
        }, 2500);
      }
    }
    this.closeSiteForm();
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
      sites.map((s) => (s.id === updatedSite.id ? updatedSite : s))
    );
    this.localGroupRows.update((rows) =>
      rows.map((row) => ({
        ...row,
        sites: row.sites.map((s) => (s.id === updatedSite.id ? updatedSite : s)),
      }))
    );
  }

  private deleteLocalSite(siteId: number): void {
    this.localUngroupedSites.update((sites) => sites.filter((s) => s.id !== siteId));
    this.localGroupRows.update((rows) =>
      rows.map((row) => ({
        ...row,
        sites: row.sites.filter((s) => s.id !== siteId),
      }))
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
        })
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
      })
    );
  }

  private deleteLocalGroup(groupId: number): void {
    const groupRow = this.localGroupRows().find(
      (row) => row.type === 'group' && row.group.id === groupId
    );
    if (groupRow) {
      const movedSites = groupRow.sites.map((s) => ({ ...s, group_id: null }));
      this.localUngroupedSites.update((sites) => [...sites, ...movedSites]);
    }
    this.localGroupRows.update((rows) =>
      rows.filter((row) => !(row.type === 'group' && row.group.id === groupId))
    );
  }
}
