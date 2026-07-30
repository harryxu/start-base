import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

import { SettingsModalComponent } from './settings-modal.component';
import { API_BASE } from '../../core/api/api.service';

describe('SettingsModalComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component and handle initial config request', () => {
    const fixture = TestBed.createComponent(SettingsModalComponent);
    const req = httpMock.expectOne(`${API_BASE}/api/config/`);
    req.flush({ page_title: 'Start Base', theme: 'emerald' });

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.formTitle).toBe('Start Base');
  });

  it('should submit site_view_mode update', async () => {
    const fixture = TestBed.createComponent(SettingsModalComponent);
    const req = httpMock.expectOne(`${API_BASE}/api/config/`);
    req.flush({ page_title: 'Start Base', theme: 'emerald', site_view_mode: 'full' });

    const component = fixture.componentInstance;
    component.formSiteViewMode.set('icon');

    const submitPromise = component.onSubmit();

    const patchReq = httpMock.expectOne(`${API_BASE}/api/config/`);
    expect(patchReq.request.method).toBe('PATCH');
    expect(patchReq.request.body['site_view_mode']).toBe('icon');
    patchReq.flush({ page_title: 'Start Base', theme: 'emerald', site_view_mode: 'icon' });

    await submitPromise;
  });
});
