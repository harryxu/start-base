import { describe, it, expect } from 'vitest';
import { parsePluginParams, buildPluginParams, buildIframeUrl, parsePluginMeta } from './plugin.utils';
import type { Site } from '../models/types';

describe('Plugin Utilities', () => {
  describe('parsePluginParams', () => {
    it('should parse multi-line key=value pairs correctly', () => {
      const raw = 'param1=abc\nparam2=xyz\n# comment\nparam3=value=with=equals\n\nparam4=123';
      const result = parsePluginParams(raw);

      expect(result).toEqual({
        param1: 'abc',
        param2: 'xyz',
        param3: 'value=with=equals',
        param4: '123',
      });
    });

    it('should handle null, undefined, or empty strings', () => {
      expect(parsePluginParams(null)).toEqual({});
      expect(parsePluginParams(undefined)).toEqual({});
      expect(parsePluginParams('')).toEqual({});
      expect(parsePluginParams('   \n  \n')).toEqual({});
    });
  });

  describe('buildPluginParams', () => {
    it('should combine fixed parameters with custom parameters including default theme and theme-mode', () => {
      const site: Site = {
        id: 1,
        url: 'https://example.com',
        title: 'My Title',
        description: 'My Description',
        icon_url: null,
        sort_order: 1,
        group_id: null,
        plugin_params: 'apiKey=secret123\nrefresh=60',
      };

      const params = buildPluginParams(site, '2x1');

      expect(params).toEqual({
        'card-size': '2x1',
        title: 'My Title',
        description: 'My Description',
        theme: 'emerald',
        'theme-mode': 'light',
        apiKey: 'secret123',
        refresh: '60',
      });
    });

    it('should pass custom theme and theme-mode when provided', () => {
      const site: Site = {
        id: 2,
        url: 'https://example.com',
        title: 'Dark Widget',
        description: null,
        icon_url: null,
        sort_order: 1,
        group_id: null,
      };

      const params = buildPluginParams(site, '1x1', 'dracula', 'dark');

      expect(params).toEqual({
        'card-size': '1x1',
        title: 'Dark Widget',
        description: '',
        theme: 'dracula',
        'theme-mode': 'dark',
      });
    });
  });

  describe('buildIframeUrl', () => {
    it('should append params as query string to absolute URL', () => {
      const url = 'https://example.com/widget';
      const params = {
        'card-size': '1x1',
        title: 'Clock',
      };

      const result = buildIframeUrl(url, params);
      expect(result).toContain('https://example.com/widget?');
      expect(result).toContain('card-size=1x1');
      expect(result).toContain('title=Clock');
    });

    it('should preserve existing query parameters and add new ones', () => {
      const url = 'https://example.com/widget?lang=zh';
      const params = {
        theme: 'dark',
      };

      const result = buildIframeUrl(url, params);
      expect(result).toContain('lang=zh');
      expect(result).toContain('theme=dark');
    });
  });

  describe('parsePluginMeta', () => {
    it('should parse valid JSON metadata string', () => {
      const jsonStr = JSON.stringify({
        name: 'Weather Widget',
        allow_hosts: ['api.weatherapi.com', '192.168.1.100:8123'],
      });
      const meta = parsePluginMeta(jsonStr);
      expect(meta).toEqual({
        name: 'Weather Widget',
        allow_hosts: ['api.weatherapi.com', '192.168.1.100:8123'],
      });
    });

    it('should return null for null, empty, or invalid JSON', () => {
      expect(parsePluginMeta(null)).toBeNull();
      expect(parsePluginMeta('')).toBeNull();
      expect(parsePluginMeta('not json')).toBeNull();
    });
  });
});

