import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, it, expect } from 'vitest';

import { SitesBoardComponent } from './sites-board.component';
import type { Group, Site } from '../../core/models/types';

import { COMMON_TEST_PROVIDERS } from '../../testing/test-mocks';

describe('SitesBoardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SitesBoardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...COMMON_TEST_PROVIDERS,
      ],
    }).compileComponents();
  });

  it('should create component and compute layout correctly', () => {
    const fixture = TestBed.createComponent(SitesBoardComponent);
    const component = fixture.componentInstance;

    const mockSites: Site[] = [
      { id: 1, url: 'https://site1.com', title: 'Site 1', icon_url: '', description: '', sort_order: 10, group_id: null },
      { id: 2, url: 'https://site2.com', title: 'Site 2', icon_url: '', description: '', sort_order: 20, group_id: 100 },
    ];
    const mockGroups: Group[] = [
      { id: 100, name: 'Group 1', sort_order: 10 },
    ];

    fixture.componentRef.setInput('sites', mockSites);
    fixture.componentRef.setInput('groups', mockGroups);
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.layoutRows().length).toBe(2);
    expect(component.allSiteDropListIds()).toEqual(['ungrouped-0', 'group-100']);
  });
});
