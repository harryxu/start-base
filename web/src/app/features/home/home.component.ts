import { Component, inject, signal } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../../core/api/api.service';
import type {
  Group,
  GroupCreate,
  GroupUpdate,
  ReorderItem,
  Site,
  SiteCreate,
  SiteReorderItem,
  SiteUpdate,
} from '../../core/models/types';
import { SiteFormComponent } from '../../shared/site-form/site-form.component';
import { GroupFormComponent } from '../../shared/group-form/group-form.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { SettingsModalComponent } from '../../shared/settings-modal/settings-modal.component';
import { ConfigService } from '../../core/services/config.service';
import { SitesBoardComponent } from './components/sites-board/sites-board.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    SitesBoardComponent,
    SiteFormComponent,
    GroupFormComponent,
    ConfirmDialogComponent,
    SettingsModalComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  configService = inject(ConfigService);
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
    onSuccess: (newSite, variables) => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
      if (!variables.title || !variables.icon_url) {
        this.fetchingSiteIds.update((set: Set<number>) => new Set(set).add(newSite.id));
      }
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

  showSiteForm = signal(false);
  editingSite = signal<Site | null>(null);
  prefilledUrl = signal('');

  showGroupForm = signal(false);
  editingGroup = signal<Group | null>(null);

  showSettingsForm = signal(false);

  deletingSite = signal<Site | null>(null);
  deletingGroup = signal<Group | null>(null);

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

  // ---- Settings actions ----

  openSettingsModal(): void {
    this.showSettingsForm.set(true);
  }

  closeSettingsModal(): void {
    this.showSettingsForm.set(false);
  }
}
