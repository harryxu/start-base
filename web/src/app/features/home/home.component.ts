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
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  }));

  updateSiteMutation = injectMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: SiteUpdate }) =>
      firstValueFrom(this.api.updateSite(id, data)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  }));

  deleteSiteMutation = injectMutation(() => ({
    mutationFn: (id: number) => firstValueFrom(this.api.deleteSite(id)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
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
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  }));

  deleteGroupMutation = injectMutation(() => ({
    mutationFn: (id: number) => firstValueFrom(this.api.deleteGroup(id)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
      this.queryClient.invalidateQueries({ queryKey: ['groups'] });
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
  /** Mutable copy of the layout used while in edit mode. */
  localRows = signal<LayoutRow[]>([]);
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
  allSiteDropListIds = computed(() => this.localRows().map((r) => r.id));

  // ---- Layout computation ----

  private computeLayout(sites: Site[], groups: Group[]): LayoutRow[] {
    const ungrouped = sites
      .filter((s) => s.group_id === null)
      .sort((a, b) => a.sort_order - b.sort_order);

    const sortedGroups = [...groups].sort((a, b) => a.sort_order - b.sort_order);

    type AnyItem =
      | { kind: 'site'; site: Site; order: number }
      | { kind: 'group'; group: Group; order: number };

    const allItems: AnyItem[] = [
      ...ungrouped.map((s) => ({ kind: 'site' as const, site: s, order: s.sort_order })),
      ...sortedGroups.map((g) => ({ kind: 'group' as const, group: g, order: g.sort_order })),
    ].sort((a, b) => a.order - b.order);

    const rows: LayoutRow[] = [];
    let batch: Site[] = [];
    let batchIndex = 0;

    for (const item of allItems) {
      if (item.kind === 'site') {
        batch.push(item.site);
      } else {
        if (batch.length > 0) {
          rows.push({ type: 'ungrouped', sites: [...batch], id: `ungrouped-${batchIndex++}` });
          batch = [];
        }
        const groupSites = sites
          .filter((s) => s.group_id === item.group.id)
          .sort((a, b) => a.sort_order - b.sort_order);
        rows.push({
          type: 'group',
          group: item.group,
          sites: groupSites,
          id: `group-${item.group.id}`,
        });
      }
    }

    if (batch.length > 0) {
      rows.push({ type: 'ungrouped', sites: [...batch], id: `ungrouped-${batchIndex}` });
    }

    return rows;
  }

  // ---- Edit mode ----

  enterEditMode(): void {
    this.localRows.set(this.layoutRows().map((r) => ({ ...r, sites: [...r.sites] })));
    this.editMode.set(true);
  }

  exitEditMode(): void {
    this.editMode.set(false);
    this.localRows.set([]);
  }

  saveLayout(): void {
    const rows = this.localRows();
    const siteItems: SiteReorderItem[] = [];
    const groupItems: ReorderItem[] = [];

    // Assign sort_order values: ungrouped sites and groups share a global counter
    // so the layout can be correctly reconstructed from sort_order alone.
    let globalOrder = 0;

    rows.forEach((row) => {
      if (row.type === 'group') {
        groupItems.push({ id: row.group.id, sort_order: globalOrder * 100 });
        globalOrder++;
        // Sites within a group use local sort_order
        row.sites.forEach((site, idx) => {
          siteItems.push({ id: site.id, sort_order: idx * 10, group_id: row.group.id });
        });
      } else {
        // Each ungrouped site gets its own global slot
        row.sites.forEach((site) => {
          siteItems.push({ id: site.id, sort_order: globalOrder * 100, group_id: null });
          globalOrder++;
        });
      }
    });

    this.reorderMutation.mutate({ sites: siteItems, groups: groupItems });
    this.editMode.set(false);
    this.localRows.set([]);
  }

  // ---- Drag and drop ----

  /** Called when a group row is dropped in a new position (outer list). */
  onRowDrop(event: CdkDragDrop<LayoutRow[]>): void {
    const rows = [...this.localRows()];
    moveItemInArray(rows, event.previousIndex, event.currentIndex);
    this.localRows.set(rows);
  }

  /** Called when a site is dropped (inner site lists). Handles within-row and cross-row moves. */
  onSiteDrop(event: CdkDragDrop<Site[]>): void {
    const rows = this.localRows().map((r) => ({ ...r, sites: [...r.sites] }));

    if (event.previousContainer === event.container) {
      const row = rows.find((r) => r.id === event.container.id);
      if (row) {
        moveItemInArray(row.sites, event.previousIndex, event.currentIndex);
      }
    } else {
      const sourceRow = rows.find((r) => r.id === event.previousContainer.id);
      const targetRow = rows.find((r) => r.id === event.container.id);
      if (sourceRow && targetRow) {
        transferArrayItem(
          sourceRow.sites,
          targetRow.sites,
          event.previousIndex,
          event.currentIndex,
        );
      }
    }

    this.localRows.set(rows);
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

  // ---- Favicon drag from browser ----

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onPageDrop(event: DragEvent): void {
    event.preventDefault();
    const url =
      event.dataTransfer?.getData('text/uri-list') ||
      event.dataTransfer?.getData('text/plain') ||
      '';
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      this.openAddSiteForm(url);
    }
  }
}
