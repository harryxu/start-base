import { Service, inject, signal } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../api/api.service';
import { GroupCollapseService } from './group-collapse.service';
import type {
  Group,
  ReorderItem,
  Site,
  SiteReorderItem,
} from '../models/types';

@Service()
export class BoardService {
  private api = inject(ApiService);
  private queryClient = inject(QueryClient);
  private groupCollapseService = inject(GroupCollapseService);

  fetchingSiteIds = signal<Set<number>>(new Set());

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
    mutationFn: (data: Partial<Site>) => firstValueFrom(this.api.createSite(data)),
    onSuccess: (newSite, variables) => {
      this.queryClient.invalidateQueries({ queryKey: ['sites'] });
      if (newSite?.id && (!variables.title || !variables.icon_url)) {
        this.fetchingSiteIds.update((set: Set<number>) => new Set(set).add(newSite.id));
        setTimeout(async () => {
          await this.queryClient.invalidateQueries({ queryKey: ['sites'] });
          this.fetchingSiteIds.update((set: Set<number>) => {
            const next = new Set(set);
            next.delete(newSite.id);
            return next;
          });
        }, 2500);
      }
    },
  }));

  updateSiteMutation = injectMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: Partial<Site> }) =>
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
    mutationFn: (data: Partial<Group>) => firstValueFrom(this.api.createGroup(data)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  }));

  updateGroupMutation = injectMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: Partial<Group> }) =>
      firstValueFrom(this.api.updateGroup(id, data)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  }));

  deleteGroupMutation = injectMutation(() => ({
    mutationFn: (id: number) => firstValueFrom(this.api.deleteGroup(id)),
    onSuccess: (_, id) => {
      this.groupCollapseService.removeGroup(id);
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

  // ---- Public Actions ----

  saveNewSite(data: Partial<Site>): void {
    const sites = this.sitesQuery.data() ?? [];
    const maxOrder = sites.length > 0 ? Math.max(...sites.map((s) => s.sort_order)) : 0;
    this.createSiteMutation.mutate({ ...data, sort_order: data.sort_order ?? maxOrder + 100 });
  }

  updateSite(id: number, data: Partial<Site>): void {
    this.updateSiteMutation.mutate({ id, data });
  }

  deleteSite(id: number): void {
    this.deleteSiteMutation.mutate(id);
  }

  saveNewGroup(data: Partial<Group> | string): void {
    const groups = this.groupsQuery.data() ?? [];
    const maxOrder = groups.length > 0 ? Math.max(...groups.map((g) => g.sort_order)) : 0;
    const payload: Partial<Group> =
      typeof data === 'string'
        ? { name: data, sort_order: maxOrder + 100 }
        : { ...data, sort_order: data.sort_order ?? maxOrder + 100 };
    this.createGroupMutation.mutate(payload);
  }

  updateGroup(id: number, data: Partial<Group> | string): void {
    const payload = typeof data === 'string' ? { name: data } : data;
    this.updateGroupMutation.mutate({ id, data: payload });
  }

  deleteGroup(id: number): void {
    this.deleteGroupMutation.mutate(id);
  }

  reorderGroups(items: ReorderItem[]): void {
    this.reorderGroupsMutation.mutate(items);
  }

  reorderSites(items: SiteReorderItem[]): void {
    this.reorderSitesMutation.mutate(items);
  }
}
