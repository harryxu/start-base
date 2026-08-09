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
    expect(component.hideThreshold()).toBe(10);
    expect(component.showThreshold()).toBe(10);
    expect(component.isHeaderHidden()).toBe(false);
  });

  it('should hide header when scrolling down past threshold and show when scrolling up', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const req = httpMock.expectOne(`${API_BASE}/api/config/`);
    req.flush({});

    const component = fixture.componentInstance;

    // Simulate scrolling down 50px (exceeding default threshold 10)
    Object.defineProperty(window, 'scrollY', { value: 50, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(component.isHeaderHidden()).toBe(true);

    // Simulate scrolling up 20px (from 50 to 30)
    Object.defineProperty(window, 'scrollY', { value: 30, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(component.isHeaderHidden()).toBe(false);
  });

  it('should support separate hideThreshold and showThreshold values', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.componentRef.setInput('hideThreshold', 30);
    fixture.componentRef.setInput('showThreshold', 5);

    const req = httpMock.expectOne(`${API_BASE}/api/config/`);
    req.flush({});

    const component = fixture.componentInstance;

    // Scrolling down 20px (below hideThreshold of 30) -> should NOT hide yet
    Object.defineProperty(window, 'scrollY', { value: 20, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(component.isHeaderHidden()).toBe(false);

    // Scrolling down further to 40px (exceeds hideThreshold of 30) -> SHOULD hide
    Object.defineProperty(window, 'scrollY', { value: 40, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(component.isHeaderHidden()).toBe(true);

    // Scrolling up 6px (to 34px, exceeds showThreshold of 5) -> SHOULD show
    Object.defineProperty(window, 'scrollY', { value: 34, writable: true });
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

    // Simulate scrolling down 100px
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(component.isHeaderHidden()).toBe(false);
  });
});
