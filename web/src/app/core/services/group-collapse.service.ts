import { Service, signal } from '@angular/core';

const COOKIE_NAME = 'sb_collapsed_groups';
const COOKIE_MAX_AGE_DAYS = 365;

@Service()
export class GroupCollapseService {
  /** Signal containing Set of collapsed group IDs */
  collapsedGroupIds = signal<Set<number>>(this.loadFromCookie());

  /** Check if a group is collapsed */
  isCollapsed(groupId: number): boolean {
    return this.collapsedGroupIds().has(groupId);
  }

  /** Set collapse state for a group and save to cookie */
  setCollapsed(groupId: number, collapsed: boolean): void {
    const set = new Set(this.collapsedGroupIds());
    if (collapsed) {
      set.add(groupId);
    } else {
      set.delete(groupId);
    }
    this.collapsedGroupIds.set(set);
    this.saveToCookie(set);
  }

  /** Toggle collapse state for a group */
  toggleCollapsed(groupId: number): boolean {
    const currentState = this.isCollapsed(groupId);
    const nextState = !currentState;
    this.setCollapsed(groupId, nextState);
    return nextState;
  }

  /** Remove group ID from cookie state when a group is deleted */
  removeGroup(groupId: number): void {
    if (this.collapsedGroupIds().has(groupId)) {
      const set = new Set(this.collapsedGroupIds());
      set.delete(groupId);
      this.collapsedGroupIds.set(set);
      this.saveToCookie(set);
    }
  }

  private loadFromCookie(): Set<number> {
    if (typeof document === 'undefined') return new Set();
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const [key, val] = c.trim().split('=');
      if (key === COOKIE_NAME && val) {
        try {
          const parsed = JSON.parse(decodeURIComponent(val));
          if (Array.isArray(parsed)) {
            return new Set(parsed.filter((id) => typeof id === 'number'));
          }
        } catch {
          const ids = val
            .split(',')
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n));
          return new Set(ids);
        }
      }
    }
    return new Set();
  }

  private saveToCookie(set: Set<number>): void {
    if (typeof document === 'undefined') return;
    const json = JSON.stringify(Array.from(set));
    const expires = new Date(Date.now() + COOKIE_MAX_AGE_DAYS * 86400 * 1000).toUTCString();
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(json)}; expires=${expires}; path=/; SameSite=Lax`;
  }
}
