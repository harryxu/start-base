import { signal, computed } from '@angular/core';
import { ConfigService } from '../core/services/config.service';

export const mockConfigService = {
  pageTitle: signal('Start Base'),
  theme: signal('emerald'),
  bgUrl: signal<string | null>(null),
  fullBgUrl: computed(() => ''),
};

export const COMMON_TEST_PROVIDERS = [
  { provide: ConfigService, useValue: mockConfigService },
];
