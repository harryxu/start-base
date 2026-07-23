import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SiteFormComponent } from './site-form.component';
import { describe, beforeEach, it, expect } from 'vitest';
import type { Site } from '../../core/models/types';

describe('SiteFormComponent', () => {
  let component: SiteFormComponent;
  let fixture: ComponentFixture<SiteFormComponent>;

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
    await TestBed.configureTestingModule({
      imports: [SiteFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteFormComponent);
    component = fixture.componentInstance;
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

    // User edits the icon URL in the form
    component.formIconUrl = 'https://new-url.com/new-icon.png';
    fixture.detectChanges();

    // Icon should remain bound to database icon_url
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
});
