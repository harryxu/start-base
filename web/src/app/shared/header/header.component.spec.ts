import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

import { HeaderComponent } from './header.component';
import { API_BASE } from '../../core/api/api.service';

describe('HeaderComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should initialize with default scroll values and visible header', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const req = httpMock.expectOne(`${API_BASE}/api/config/`);
    req.flush({ page_title: 'Start Base', theme: 'emerald' });

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.enableScrollHide()).toBe(true);
    expect(typeof component.hideThreshold()).toBe('number');
    expect(typeof component.showThreshold()).toBe('number');
    expect(component.isHeaderHidden()).toBe(false);
  });

  it('should hide header when scrolling down past component thresholds and show when scrolling up', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const req = httpMock.expectOne(`${API_BASE}/api/config/`);
    req.flush({});

    const component = fixture.componentInstance;
    const hideThresh = component.hideThreshold();
    const showThresh = component.showThreshold();

    // Scroll down past hideThreshold dynamically
    const scrollDownPos = hideThresh + 20;
    Object.defineProperty(window, 'scrollY', { value: scrollDownPos, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(component.isHeaderHidden()).toBe(true);

    // Scroll up by more than showThreshold dynamically
    const scrollUpPos = Math.max(0, scrollDownPos - (showThresh + 10));
    Object.defineProperty(window, 'scrollY', { value: scrollUpPos, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(component.isHeaderHidden()).toBe(false);
  });

  it('should support separate hideThreshold and showThreshold input values', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const customHide = 30;
    const customShow = 5;
    fixture.componentRef.setInput('hideThreshold', customHide);
    fixture.componentRef.setInput('showThreshold', customShow);

    const req = httpMock.expectOne(`${API_BASE}/api/config/`);
    req.flush({});

    const component = fixture.componentInstance;

    // Scrolling down below custom hideThreshold -> should NOT hide yet
    Object.defineProperty(window, 'scrollY', { value: customHide - 10, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(component.isHeaderHidden()).toBe(false);

    // Scrolling down past custom hideThreshold -> SHOULD hide
    const scrollDownPos = customHide + 10;
    Object.defineProperty(window, 'scrollY', { value: scrollDownPos, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(component.isHeaderHidden()).toBe(true);

    // Scrolling up by more than custom showThreshold -> SHOULD show
    const scrollUpPos = scrollDownPos - (customShow + 2);
    Object.defineProperty(window, 'scrollY', { value: scrollUpPos, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(component.isHeaderHidden()).toBe(false);
  });

  it('should not hide header if enableScrollHide is false', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.componentRef.setInput('enableScrollHide', false);

    const req = httpMock.expectOne(`${API_BASE}/api/config/`);
    req.flush({});

    const component = fixture.componentInstance;
    const hideThresh = component.hideThreshold();

    // Scroll down well past threshold
    Object.defineProperty(window, 'scrollY', { value: hideThresh + 100, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(component.isHeaderHidden()).toBe(false);
  });
});
