/**
 * TypeScript interfaces mirroring the backend SQLModel schemas.
 * Keep in sync with server/app/models.py.
 */

export interface Group {
  id: number;
  name: string;
  icon_url?: string | null;
  site_view_mode?: SiteViewMode | null;
  sort_order: number;
}

export interface Site {
  id: number;
  url: string;
  title: string | null;
  icon_url: string | null;
  description: string | null;
  sort_order: number;
  group_id: number | null;
}

export interface ReorderItem {
  id: number;
  sort_order: number;
}

export interface SiteReorderItem {
  id: number;
  sort_order: number;
  group_id: number | null;
}

/**
 * A computed layout row for the home page.
 * - 'ungrouped': consecutive ungrouped sites merged into one row
 * - 'group': a group container with its sites
 */
export type LayoutRow =
  | { type: 'ungrouped'; sites: Site[]; id: string }
  | { type: 'group'; group: Group; sites: Site[]; id: string };

/**
 * System configuration map dictionary interface.
 */
export type SystemConfigMap = Record<string, any>;

/**
 * Site display view mode options.
 */
export type SiteViewMode = 'full' | 'icon' | 'text' | '';

/** Auth: login request payload. */
export interface UserLogin {
  username: string;
  password: string;
}

/** Auth: public user info returned after login. */
export interface UserPublic {
  id: number;
  username: string;
}
