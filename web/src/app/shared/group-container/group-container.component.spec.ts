import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupContainerComponent } from './group-container.component';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import type { Group, Site } from '../../core/models/types';

describe('GroupContainerComponent', () => {
  let component: GroupContainerComponent;
  let fixture: ComponentFixture<GroupContainerComponent>;

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
    await TestBed.configureTestingModule({
      imports: [GroupContainerComponent],
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
    expect(menuEl?.textContent).toContain('Rename Group');
    expect(menuEl?.textContent).toContain('Delete Group');
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
});
