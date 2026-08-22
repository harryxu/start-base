import { signal, computed } from '@angular/core';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ConfigService } from '../core/services/config.service';
import { AuthService } from '../core/services/auth.service';

import type { SiteViewMode } from '../core/models/types';

const mockAccessMode = signal('none_guard');
const mockCurrentUser = signal<{ id: number; username: string } | null>(null);

export const mockConfigService = {
  pageTitle: signal('Start Base'),
  theme: signal('emerald'),
  bgUrl: signal<string | null>(null),
  fullBgUrl: computed(() => ''),
  accessMode: mockAccessMode,
  siteViewMode: signal<SiteViewMode>('full'),
  siteBorder: signal<boolean>(false),
  editMode: signal<boolean>(false),
  toggleEditMode: function () {
    this.editMode.update((v: boolean) => !v);
  },
  isReadOnly: computed(() => mockAccessMode() !== 'none_guard' && mockCurrentUser() === null),
  loadConfig: async () => {},
};

export const mockAuthService = {
  currentUser: mockCurrentUser,
  fetchCurrentUser: async () => {},
  login: async (credentials: any) => {
    const user = { id: 1, username: credentials.username || 'admin' };
    mockCurrentUser.set(user);
    return user;
  },
  logout: async () => {
    mockCurrentUser.set(null);
  },
};

export const COMMON_TEST_PROVIDERS = [
  provideTanStackQuery(new QueryClient()),
  { provide: ConfigService, useValue: mockConfigService },
  { provide: AuthService, useValue: mockAuthService },
];
