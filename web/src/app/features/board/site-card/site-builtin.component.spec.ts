import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';

import { SiteBuiltinComponent } from './site-builtin.component';
import type { Site } from '../../../core/models/types';
import { COMMON_TEST_PROVIDERS } from '../../../testing/test-mocks';

describe('SiteBuiltinComponent', () => {
  let component: SiteBuiltinComponent;
  let fixture: ComponentFixture<SiteBuiltinComponent>;

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
      imports: [SiteBuiltinComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteBuiltinComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('site', mockSite);
    fixture.detectChanges();
  });

  it('should render site title and link correctly', () => {
    const titleEl = fixture.nativeElement.querySelector('.site-title');
    const linkEl = fixture.nativeElement.querySelector('.site-link');

    expect(titleEl.textContent).toContain('Example Site');
    expect(linkEl.getAttribute('href')).toBe('https://example.com');
    expect(linkEl.getAttribute('title')).toBe('Example Site\nTest description');
  });

  it('should render icon and text in full view_mode', () => {
    fixture.componentRef.setInput('view_mode', 'full');
    fixture.detectChanges();

    const iconEl = fixture.nativeElement.querySelector('.site-icon');
    const titleEl = fixture.nativeElement.querySelector('.site-title');
    expect(iconEl).toBeTruthy();
    expect(titleEl).toBeTruthy();
  });

  it('should render icon only in icon view_mode', () => {
    fixture.componentRef.setInput('view_mode', 'icon');
    fixture.detectChanges();

    const iconEl = fixture.nativeElement.querySelector('.site-icon');
    const titleEl = fixture.nativeElement.querySelector('.site-title');
    expect(iconEl).toBeTruthy();
    expect(titleEl).toBeFalsy();
  });

  it('should render text only in text view_mode', () => {
    fixture.componentRef.setInput('view_mode', 'text');
    fixture.detectChanges();

    const iconEl = fixture.nativeElement.querySelector('.site-icon');
    const titleEl = fixture.nativeElement.querySelector('.site-title');
    expect(iconEl).toBeFalsy();
    expect(titleEl).toBeTruthy();
  });
});
