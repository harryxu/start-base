import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { GroupCollapseService } from './group-collapse.service';

describe('GroupCollapseService', () => {
  let service: GroupCollapseService;

  beforeEach(() => {
    // Clear cookies before each test
    document.cookie = 'sb_collapsed_groups=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    TestBed.configureTestingModule({
      providers: [GroupCollapseService],
    });
    service = TestBed.inject(GroupCollapseService);
  });

  afterEach(() => {
    document.cookie = 'sb_collapsed_groups=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  it('should initialize with empty collapsed set when no cookie exists', () => {
    expect(service.collapsedGroupIds().size).toBe(0);
    expect(service.isCollapsed(1)).toBe(false);
  });

  it('should toggle collapse state and save to cookie', () => {
    expect(service.isCollapsed(10)).toBe(false);

    service.toggleCollapsed(10);
    expect(service.isCollapsed(10)).toBe(true);
    expect(document.cookie).toContain('sb_collapsed_groups=');

    service.toggleCollapsed(10);
    expect(service.isCollapsed(10)).toBe(false);
  });

  it('should remove group ID from cookie when removeGroup is called', () => {
    service.setCollapsed(5, true);
    service.setCollapsed(6, true);
    expect(service.isCollapsed(5)).toBe(true);
    expect(service.isCollapsed(6)).toBe(true);

    service.removeGroup(5);
    expect(service.isCollapsed(5)).toBe(false);
    expect(service.isCollapsed(6)).toBe(true);
  });
});
