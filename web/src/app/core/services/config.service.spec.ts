import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

import { ConfigService } from './config.service';
import { API_BASE } from '../api/api.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfigService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);

    // Respond to initial loadConfig request
    const req = httpMock.expectOne(`${API_BASE}/api/config/`);
    req.flush({ page_title: 'Test Base', theme: 'dark', site_view_mode: 'icon' });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load initial configuration and update signals', () => {
    expect(service.pageTitle()).toBe('Test Base');
    expect(service.theme()).toBe('dark');
    expect(service.siteViewMode()).toBe('icon');
  });

  it('should update configuration via updateConfig()', async () => {
    const updatePromise = service.updateConfig({ page_title: 'New Base', theme: 'light', site_view_mode: 'text' });

    const req = httpMock.expectOne(`${API_BASE}/api/config/`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ page_title: 'New Base', theme: 'light', site_view_mode: 'text' });

    await updatePromise;

    expect(service.pageTitle()).toBe('New Base');
    expect(service.theme()).toBe('light');
    expect(service.siteViewMode()).toBe('text');
  });

  it('should parse demo configuration when present', async () => {
    const loadPromise = service.loadConfig(true);
    const req = httpMock.expectOne(`${API_BASE}/api/config/`);
    req.flush({
      page_title: 'Demo Base',
      demo: true,
      demo_msg: 'You are currently viewing the Start Base Demo. Data will be reset every 3 hours.',
    });
    await loadPromise;

    expect(service.isDemo()).toBe(true);
    expect(service.demoMsg()).toBe(
      'You are currently viewing the Start Base Demo. Data will be reset every 3 hours.',
    );
  });

  it('should parse site_border configuration when present and default to false', async () => {
    expect(service.siteBorder()).toBe(false);

    const loadPromise = service.loadConfig(true);
    const req = httpMock.expectOne(`${API_BASE}/api/config/`);
    req.flush({ site_border: '1' });
    await loadPromise;

    expect(service.siteBorder()).toBe(true);

    const updatePromise = service.updateConfig({ site_border: '0' });
    const patchReq = httpMock.expectOne(`${API_BASE}/api/config/`);
    patchReq.flush({ site_border: '0' });
    await updatePromise;

    expect(service.siteBorder()).toBe(false);
  });

  it('should parse page_width configuration and compute pageWidthClass correctly', async () => {
    // Default is medium
    expect(service.pageWidth()).toBe('medium');
    expect(service.pageWidthClass()).toBe('w-full max-w-5xl');

    // Load wide
    const loadWidePromise = service.loadConfig(true);
    const reqWide = httpMock.expectOne(`${API_BASE}/api/config/`);
    reqWide.flush({ page_width: 'wide' });
    await loadWidePromise;
    expect(service.pageWidth()).toBe('wide');
    expect(service.pageWidthClass()).toBe('w-full max-w-[1600px]');

    // Update ultra_wide
    const updateUltraPromise = service.updateConfig({ page_width: 'ultra_wide' });
    const patchUltraReq = httpMock.expectOne(`${API_BASE}/api/config/`);
    patchUltraReq.flush({ page_width: 'ultra_wide' });
    await updateUltraPromise;
    expect(service.pageWidth()).toBe('ultra_wide');
    expect(service.pageWidthClass()).toBe('w-full max-w-[2200px]');

    // Update full
    const updateFullPromise = service.updateConfig({ page_width: 'full' });
    const patchFullReq = httpMock.expectOne(`${API_BASE}/api/config/`);
    patchFullReq.flush({ page_width: 'full' });
    await updateFullPromise;
    expect(service.pageWidth()).toBe('full');
    expect(service.pageWidthClass()).toBe('w-full max-w-none');
  });

  it('should toggle editMode and respect isReadOnly', () => {
    expect(service.editMode()).toBe(false);

    service.toggleEditMode();
    expect(service.editMode()).toBe(true);

    service.toggleEditMode();
    expect(service.editMode()).toBe(false);
  });
});
