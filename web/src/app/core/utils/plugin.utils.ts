import type { Site } from '../models/types';

/**
 * Parses multiline key=value string parameters into a key-value record.
 * Lines starting with # or empty lines are ignored.
 */
export function parsePluginParams(rawParams?: string | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!rawParams) return result;

  const lines = rawParams.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (key) {
        result[key] = val;
      }
    }
  }

  return result;
}

/**
 * Builds the combined parameter map including standard fixed parameters
 * (card-size, title, description, theme, theme-mode) and custom user-defined parameters.
 */
export function buildPluginParams(
  site: Site,
  sizeKey: string,
  theme = 'emerald',
  themeMode: 'light' | 'dark' = 'light',
): Record<string, string> {
  const customParams = parsePluginParams(site.plugin_params);

  return {
    'card-size': sizeKey,
    title: site.title || '',
    description: site.description || '',
    theme: theme || 'emerald',
    'theme-mode': themeMode || 'light',
    ...customParams,
  };
}

/**
 * Appends query parameters to a base URL, correctly handling existing query strings and hashes.
 */
export function buildIframeUrl(baseUrl: string, params: Record<string, string>): string {
  if (!baseUrl) return '';

  try {
    // Check if it's a full valid URL
    const isAbsolute = /^https?:\/\//i.test(baseUrl);
    const dummyBase = 'http://localhost';
    const urlObj = isAbsolute ? new URL(baseUrl) : new URL(baseUrl, dummyBase);

    for (const [key, value] of Object.entries(params)) {
      urlObj.searchParams.set(key, value);
    }

    if (isAbsolute) {
      return urlObj.toString();
    } else {
      return urlObj.pathname + urlObj.search + urlObj.hash;
    }
  } catch {
    // Fallback simple query string builder
    const queryString = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${queryString}`;
  }
}
