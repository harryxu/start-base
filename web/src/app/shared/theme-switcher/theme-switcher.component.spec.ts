import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

import { ThemeSwitcherComponent } from './theme-switcher.component';
import { API_BASE } from '../../core/api/api.service';

describe('ThemeSwitcherComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeSwitcherComponent],
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

  it('should create component and render theme options', () => {
    const fixture = TestBed.createComponent(ThemeSwitcherComponent);
    const req = httpMock.expectOne(`${API_BASE}/api/config/`);
    req.flush({ page_title: 'Start Base', theme: 'emerald' });

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.themes.length).toBeGreaterThan(0);
  });
});
