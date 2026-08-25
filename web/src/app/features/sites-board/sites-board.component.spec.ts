import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, it, expect } from 'vitest';

import { SitesBoardComponent } from './sites-board.component';
import type { BoardData } from '../../core/models/types';

import { COMMON_TEST_PROVIDERS } from '../../testing/test-mocks';

describe('SitesBoardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SitesBoardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), ...COMMON_TEST_PROVIDERS],
    }).compileComponents();
  });

  const mockBoardData: BoardData = {
    ungrouped_sites: [
      {
        id: 1,
        url: 'https://github.com',
        title: 'GitHub',
        icon_url: '',
        description: 'Code hosting platform',
        sort_order: 10,
        group_id: null,
      },
    ],
    groups: [
      {
        id: 100,
        name: 'Search Tools',
        sort_order: 10,
        sites: [
          {
            id: 2,
            url: 'https://google.com',
            title: 'Google',
            icon_url: '',
            description: 'Search engine',
            sort_order: 20,
            group_id: 100,
          },
        ],
      },
      {
        id: 200,
        name: 'Entertainment',
        sort_order: 20,
        sites: [
          {
            id: 3,
            url: 'https://youtube.com',
            title: 'YouTube',
            icon_url: '',
            description: 'Video streaming',
            sort_order: 30,
            group_id: 200,
          },
        ],
      },
    ],
  };

  it('should create component and compute layout correctly without search query, preserving empty groups', () => {
    const fixture = TestBed.createComponent(SitesBoardComponent);
    const component = fixture.componentInstance;

    const mockBoardWithEmpty: BoardData = {
      ...mockBoardData,
      groups: [
        ...(mockBoardData.groups ?? []),
        { id: 300, name: 'Empty Group', sort_order: 30, sites: [] },
      ],
    };

    fixture.componentRef.setInput('boardData', mockBoardWithEmpty);
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.layoutRows().length).toBe(4); // 1 ungrouped + 3 groups (including empty group)
    expect(component.isSearching()).toBe(false);
  });

  it('should filter sites by title (case-insensitive) and hide groups with no matching sites', () => {
    const fixture = TestBed.createComponent(SitesBoardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('boardData', mockBoardData);
    fixture.componentRef.setInput('searchQuery', 'google');
    fixture.detectChanges();

    expect(component.isSearching()).toBe(true);
    expect(component.layoutRows().length).toBe(1); // Only Group 100 (Google)

    const firstRow = component.layoutRows()[0];
    expect(firstRow.type).toBe('group');
    if (firstRow.type === 'group') {
      expect(firstRow.group.id).toBe(100);
      expect(firstRow.sites.length).toBe(1);
      expect(firstRow.sites[0].title).toBe('Google');
    }
  });

  it('should filter sites by URL and include ungrouped sites when matched', () => {
    const fixture = TestBed.createComponent(SitesBoardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('boardData', mockBoardData);
    fixture.componentRef.setInput('searchQuery', 'github.com');
    fixture.detectChanges();

    expect(component.layoutRows().length).toBe(1); // Ungrouped GitHub

    const firstRow = component.layoutRows()[0];
    expect(firstRow.type).toBe('ungrouped');
    if (firstRow.type === 'ungrouped') {
      expect(firstRow.sites.length).toBe(1);
      expect(firstRow.sites[0].title).toBe('GitHub');
    }
  });

  it('should filter sites by description', () => {
    const fixture = TestBed.createComponent(SitesBoardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('boardData', mockBoardData);
    fixture.componentRef.setInput('searchQuery', 'streaming');
    fixture.detectChanges();

    expect(component.layoutRows().length).toBe(1); // Group 200 (YouTube)

    const firstRow = component.layoutRows()[0];
    expect(firstRow.type).toBe('group');
    if (firstRow.type === 'group') {
      expect(firstRow.group.id).toBe(200);
      expect(firstRow.sites[0].title).toBe('YouTube');
    }
  });

  it('should return empty layoutRows and render empty search state when no sites match', () => {
    const fixture = TestBed.createComponent(SitesBoardComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('boardData', mockBoardData);
    fixture.componentRef.setInput('searchQuery', 'non_existing_keyword_xyz');
    fixture.detectChanges();

    expect(component.layoutRows().length).toBe(0);
    expect(component.isSearching()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No matching sites found');
    expect(compiled.textContent).toContain('non_existing_keyword_xyz');
  });

  it('should adjust dragStartDelay based on editMode', () => {
    const fixture = TestBed.createComponent(SitesBoardComponent);
    const component = fixture.componentInstance;

    component.configService.editMode.set(false);
    expect(component.dragStartDelay()).toEqual({ touch: 300, mouse: 150 });

    component.configService.editMode.set(true);
    expect(component.dragStartDelay()).toBe(0);
  });
});
