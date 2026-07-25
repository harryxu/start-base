import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { describe, beforeEach, it, expect } from 'vitest';

import { SiteFormComponent } from './site-form.component';
import type { Site } from '../../core/models/types';

describe('SiteFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAngularQuery(new QueryClient()),
      ],
    }).compileComponents();
  });

  it('should create the component and handle site binding', () => {
    const fixture = TestBed.createComponent(SiteFormComponent);
    const component = fixture.componentInstance;

    const mockSite: Site = {
      id: 1,
      url: 'https://example.com',
      title: 'Example',
      icon_url: 'icon.png',
      description: 'Desc',
      sort_order: 10,
      group_id: null,
    };

    fixture.componentRef.setInput('site', mockSite);
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.formUrl).toBe('https://example.com');
    expect(component.formTitle).toBe('Example');
  });
});
