import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SiteFormComponent } from './site-form.component';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import type { Site, SiteCreate } from '../../core/models/types';
import { API_BASE } from '../../core/api/api.service';

describe('SiteFormComponent', () => {
  let component: SiteFormComponent;
  let fixture: ComponentFixture<SiteFormComponent>;
  let httpMock: HttpTestingController;

  const mockSite: Site = {
    id: 1,
    url: 'https://example.com',
    title: 'Example Site',
    icon_url: 'https://example.com/icon.png',
    description: 'Test description',
    sort_order: 0,
    group_id: null,
  };

  beforeEach(async () => {
    // Mock URL.createObjectURL for jsdom environment
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url');
    }

    await TestBed.configureTestingModule({
      imports: [SiteFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should not render site icon on the left in add mode (site is null)', () => {
    fixture.componentRef.setInput('site', null);
    fixture.detectChanges();

    const imgEl = fixture.nativeElement.querySelector('img[alt="Site icon"]');
    const globeEl = fixture.nativeElement.querySelector('svg[lucideGlobe]');

    expect(imgEl).toBeFalsy();
    expect(globeEl).toBeFalsy();
  });

  it('should render site icon on the left in edit mode using database icon_url', () => {
    fixture.componentRef.setInput('site', mockSite);
    fixture.detectChanges();

    const imgEl = fixture.nativeElement.querySelector('img[alt="Site icon"]');
    expect(imgEl).toBeTruthy();
    expect(imgEl.getAttribute('src')).toBe('https://example.com/icon.png');
  });

  it('should not change the displayed icon when user edits the formIconUrl input field', () => {
    fixture.componentRef.setInput('site', mockSite);
    fixture.detectChanges();

    const imgEl = fixture.nativeElement.querySelector('img[alt="Site icon"]');
    expect(imgEl.getAttribute('src')).toBe('https://example.com/icon.png');

    component.formIconUrl = 'https://new-url.com/new-icon.png';
    fixture.detectChanges();

    expect(imgEl.getAttribute('src')).toBe('https://example.com/icon.png');
  });

  it('should render fallback globe icon in edit mode if site has no icon_url', () => {
    fixture.componentRef.setInput('site', {
      ...mockSite,
      icon_url: null,
    });
    fixture.detectChanges();

    const imgEl = fixture.nativeElement.querySelector('img[alt="Site icon"]');
    const globeEl = fixture.nativeElement.querySelector('svg[lucideGlobe]');

    expect(imgEl).toBeFalsy();
    expect(globeEl).toBeTruthy();
  });

  it('should render upload icon button on the right of icon URL input', () => {
    fixture.detectChanges();
    const uploadBtn = fixture.nativeElement.querySelector('button[aria-label="Upload icon"]');
    expect(uploadBtn).toBeTruthy();
  });

  it('should store selected file and preview without uploading immediately on file selection', () => {
    fixture.detectChanges();

    const mockFile = new File(['dummy content'], 'my-logo.png', { type: 'image/png' });
    const event = {
      target: {
        files: [mockFile],
      },
    } as unknown as Event;

    component.onFileSelected(event);
    fixture.detectChanges();

    expect(component.selectedIconFile).toBe(mockFile);
    expect(component.selectedFileName()).toBe('my-logo.png');
    expect(component.formIconUrl).toBe('my-logo.png');

    // HTTP request should NOT have been made yet
    httpMock.expectNone(`${API_BASE}/api/sites/upload-icon`);
  });

  it('should upload selected file and emit submitted data on form submit', async () => {
    fixture.componentRef.setInput('site', mockSite);
    fixture.detectChanges();

    const mockFile = new File(['dummy content'], 'my-logo.png', { type: 'image/png' });
    component.onFileSelected({
      target: { files: [mockFile] },
    } as unknown as Event);

    let submittedData: SiteCreate | null = null;
    component.submitted.subscribe((data) => {
      submittedData = data;
    });

    const submitPromise = component.onSubmit();

    const req = httpMock.expectOne(`${API_BASE}/api/sites/upload-icon`);
    expect(req.request.method).toBe('POST');
    req.flush({ icon_url: '/static/icons/custom_123.png' });

    await submitPromise;

    expect(submittedData).toEqual({
      url: 'https://example.com',
      title: 'Example Site',
      icon_url: '/static/icons/custom_123.png',
      description: 'Test description',
      group_id: null,
    });
  });
});
