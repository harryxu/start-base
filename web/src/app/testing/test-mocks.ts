import { signal, computed } from '@angular/core';
import { ConfigService } from '../core/services/config.service';
import { AuthService } from '../core/services/auth.service';

const mockAccessMode = signal('none_guard');
const mockCurrentUser = signal<{ id: number; username: string } | null>(null);

export const mockConfigService = {
  pageTitle: signal('Start Base'),
  theme: signal('emerald'),
  bgUrl: signal<string | null>(null),
  fullBgUrl: computed(() => ''),
  accessMode: mockAccessMode,
  isReadOnly: computed(
    () => mockAccessMode() !== 'none_guard' && mockCurrentUser() === null,
  ),
};

export const mockAuthService = {
  currentUser: mockCurrentUser,
  fetchCurrentUser: async () => {},
  logout: async () => {},
};

export const COMMON_TEST_PROVIDERS = [
  { provide: ConfigService, useValue: mockConfigService },
  { provide: AuthService, useValue: mockAuthService },
];
