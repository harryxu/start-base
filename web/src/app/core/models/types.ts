/**
 * TypeScript interfaces mirroring the backend SQLModel schemas.
 * Keep in sync with server/app/models.py.
 */

export interface Group {
  id: number;
  name: string;
  icon_url?: string | null;
  site_view_mode?: SiteViewMode | null;
  site_border?: string | null;
  sort_order: number;
}

export type SiteType = 'builtin' | 'iframe' | 'webcomponent';

export interface Site {
  id: number;
  url: string;
  title: string | null;
  icon_url: string | null;
  description: string | null;
  sort_order: number;
  group_id: number | null;
  col_span?: number;
  row_span?: number;
  site_type?: SiteType;
  plugin_params?: string | null;
}

/**
 * Predefined site card size options.
 * Each size defines its col_span and row_span values.
 */
export type SiteSize = '1x1' | '2x1' | '1x2' | '2x2';

export const SITE_SIZES: { key: SiteSize; label: string; col: number; row: number }[] = [
  { key: '1x1', label: '1×1', col: 1, row: 1 },
  { key: '2x1', label: '2×1', col: 2, row: 1 },
  { key: '1x2', label: '1×2', col: 1, row: 2 },
  { key: '2x2', label: '2×2', col: 2, row: 2 },
];

export interface ReorderItem {
  id: number;
  sort_order: number;
}

export interface SiteReorderItem {
  id: number;
  sort_order: number;
  group_id: number | null;
}

export interface GroupWithSites extends Group {
  sites: Site[];
}

export interface BoardData {
  ungrouped_sites?: Site[];
  groups?: GroupWithSites[];
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

/**
 * Supported DaisyUI theme names list and type definition.
 */
export const SUPPORTED_THEMES = [
  'light',
  'autumn',
  'emerald',
  'corporate',
  'garden',
  'fantasy',
  'coffee',
  'business',
  'night',
  'dark',
  'dim',
  'dracula',
] as const;

export type ThemeName = (typeof SUPPORTED_THEMES)[number];
