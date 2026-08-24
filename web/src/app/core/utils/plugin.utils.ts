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

/**
 * Safely parses the JSON string from site.plugin_meta.
 */
export function parsePluginMeta(metaJson?: string | null): Record<string, any> | null {
  if (!metaJson || !metaJson.trim()) return null;
  try {
    const parsed = JSON.parse(metaJson);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

export interface PluginProxyFetchOptions extends RequestInit {
  params?: Record<string, string>;
  timeout?: number;
}

/**
 * Executes a proxied network request for a Web Component plugin via the Start Base backend.
 * Returns a standard Response object.
 */
export async function pluginProxyFetch(
  siteId: number,
  url: string,
  options?: PluginProxyFetchOptions,
): Promise<Response> {
  const method = (options?.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {};

  if (options?.headers) {
    if (typeof Headers !== 'undefined' && options.headers instanceof Headers) {
      options.headers.forEach((v, k) => {
        headers[k] = v;
      });
    } else if (Array.isArray(options.headers)) {
      for (const [k, v] of options.headers) {
        headers[k] = v;
      }
    } else {
      Object.assign(headers, options.headers);
    }
  }

  let body: any = null;
  if (options?.body) {
    if (typeof options.body === 'string') {
      try {
        body = JSON.parse(options.body);
      } catch {
        body = options.body;
      }
    } else {
      body = options.body;
    }
  }

  const payload = {
    site_id: siteId,
    url,
    method,
    headers,
    params: options?.params || {},
    body,
    timeout: options?.timeout || 10,
  };

  return fetch('/api/plugins/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

