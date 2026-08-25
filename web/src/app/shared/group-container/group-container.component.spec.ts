import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupContainerComponent } from './group-container.component';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import type { Group, Site } from '../../core/models/types';
import { BoardService } from '../../core/services/board.service';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-mocks';

describe('GroupContainerComponent', () => {
  let component: GroupContainerComponent;
  let fixture: ComponentFixture<GroupContainerComponent>;
  const mockBoardService = {
    updateGroup: vi.fn(),
  };

  const mockGroup: Group = {
    id: 1,
    name: 'Work Tools',
    sort_order: 0,
  };

  const mockSites: Site[] = [
    {
      id: 10,
      url: 'https://work.com',
      title: 'Work Site',
      icon_url: null,
      description: null,
      sort_order: 0,
      group_id: 1,
    },
  ];

  beforeEach(async () => {
    mockBoardService.updateGroup.mockClear();

    await TestBed.configureTestingModule({
      imports: [GroupContainerComponent],
      providers: [
        ...COMMON_TEST_PROVIDERS,
        { provide: BoardService, useValue: mockBoardService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupContainerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('group', mockGroup);
    fixture.componentRef.setInput('sites', mockSites);
    fixture.detectChanges();
  });

  it('should render group name and site cards', () => {
    const headerTitle = fixture.nativeElement.querySelector('span');
    expect(headerTitle.textContent).toContain('Work Tools');

    const siteCard = fixture.nativeElement.querySelector('app-site-card');
    expect(siteCard).toBeTruthy();
  });

  it('should toggle collapse state when clicking group title', () => {
    expect(component.collapsed()).toBe(false);

    const titleEl = fixture.nativeElement.querySelector('span');
    titleEl.click();
    fixture.detectChanges();

    expect(component.collapsed()).toBe(true);
    const collapseEl = fixture.nativeElement.querySelector('.collapse');
    expect(collapseEl.classList.contains('collapse-close')).toBe(true);
  });

  it('should open group context menu when clicking options button (•••)', () => {
    const moreBtn = fixture.nativeElement.querySelector('button[title="Group actions"]');
    moreBtn.click();
    fixture.detectChanges();

    const menuEl = document.querySelector('.menu');
    expect(menuEl).toBeTruthy();
  });

  it('should close menu when closeMenu() is called', () => {
    const moreBtn = fixture.nativeElement.querySelector('button[title="Group actions"]');
    moreBtn.click();
    fixture.detectChanges();

    expect(document.querySelector('.menu')).toBeTruthy();

    component.closeMenu();
    fixture.detectChanges();

    expect(document.querySelector('.menu')).toBeFalsy();
  });

  it('should switch site view mode when clicking mode button in menu', () => {
    const moreBtn = fixture.nativeElement.querySelector('button[title="Group actions"]');
    moreBtn.click();
    fixture.detectChanges();

    const iconOnlyBtn = document.querySelector('button[title="Icon Only"]') as HTMLButtonElement;
    expect(iconOnlyBtn).toBeTruthy();
    iconOnlyBtn.click();

    expect(mockBoardService.updateGroup).toHaveBeenCalledWith(1, { site_view_mode: 'icon' });
  });

  it('should compute effectiveSiteBorder correctly based on group and global settings', () => {
    // 1. Group site_border is '1' -> true
    fixture.componentRef.setInput('group', { ...mockGroup, site_border: '1' });
    fixture.detectChanges();
    expect(component.effectiveSiteBorder()).toBe(true);

    // 2. Group site_border is '0' -> false
    fixture.componentRef.setInput('group', { ...mockGroup, site_border: '0' });
    fixture.detectChanges();
    expect(component.effectiveSiteBorder()).toBe(false);

    // 3. Group site_border is '' -> follows global configService.siteBorder()
    component.configService.siteBorder.set(true);
    fixture.componentRef.setInput('group', { ...mockGroup, site_border: '' });
    fixture.detectChanges();
    expect(component.effectiveSiteBorder()).toBe(true);

    component.configService.siteBorder.set(false);
    fixture.detectChanges();
    expect(component.effectiveSiteBorder()).toBe(false);
  });

  it('should adjust dragStartDelay based on editMode', () => {
    component.configService.editMode.set(false);
    expect(component.dragStartDelay()).toEqual({ touch: 300, mouse: 150 });

    component.configService.editMode.set(true);
    expect(component.dragStartDelay()).toBe(0);
  });
});
