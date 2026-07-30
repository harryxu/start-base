import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SiteCardComponent } from './site-card.component';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import type { Site } from '../../core/models/types';

import { COMMON_TEST_PROVIDERS } from '../../testing/test-mocks';

describe('SiteCardComponent', () => {
  let component: SiteCardComponent;
  let fixture: ComponentFixture<SiteCardComponent>;

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
      imports: [SiteCardComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('site', mockSite);
    fixture.detectChanges();
  });

  it('should render site title and link correctly', () => {
    const titleEl = fixture.nativeElement.querySelector('.site-title');
    const linkEl = fixture.nativeElement.querySelector('.site-link');

    expect(titleEl.textContent).toContain('Example Site');
    expect(linkEl.getAttribute('href')).toBe('https://example.com');
  });

  it('should open CDK context menu on right-click (contextmenu event)', () => {
    const cardEl = fixture.nativeElement.querySelector('.site-card');
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 50,
      clientY: 50,
      button: 2,
    });

    cardEl.dispatchEvent(contextMenuEvent);
    fixture.detectChanges();

    const menuEl = document.querySelector('.menu');
    expect(menuEl).toBeTruthy();
    expect(menuEl?.textContent).toContain('Edit');
    expect(menuEl?.textContent).toContain('Delete');
  });

  it('should close CDK context menu when closeMenu() is called', () => {
    const cardEl = fixture.nativeElement.querySelector('.site-card');
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 50,
      clientY: 50,
      button: 2,
    });

    cardEl.dispatchEvent(contextMenuEvent);
    fixture.detectChanges();

    expect(document.querySelector('.menu')).toBeTruthy();

    component.closeMenu();
    fixture.detectChanges();

    expect(document.querySelector('.menu')).toBeFalsy();
  });

  it('should render DaisyUI skeleton when site metadata is being fetched', () => {
    fixture.componentRef.setInput('isFetching', true);
    fixture.detectChanges();

    const skeletonEl = fixture.nativeElement.querySelector('.skeleton');
    expect(skeletonEl).toBeTruthy();
  });

  it('should render Lucide globe icon as default when site has no iconUrl', () => {
    fixture.componentRef.setInput('isFetching', false);
    fixture.componentRef.setInput('site', {
      ...mockSite,
      icon_url: null,
    });
    fixture.detectChanges();

    const globeEl = fixture.nativeElement.querySelector('svg[lucideGlobe]');
    expect(globeEl).toBeTruthy();
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
