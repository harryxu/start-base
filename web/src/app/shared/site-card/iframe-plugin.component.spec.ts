import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';

import { IframePluginComponent } from './iframe-plugin.component';
import type { Site } from '../../core/models/types';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-mocks';

describe('IframePluginComponent', () => {
  let component: IframePluginComponent;
  let fixture: ComponentFixture<IframePluginComponent>;

  const mockSite: Site = {
    id: 1,
    url: 'https://example.com/widget.html',
    title: 'Weather Widget',
    description: 'Displays current weather',
    icon_url: null,
    sort_order: 1,
    group_id: null,
    site_type: 'iframe',
    plugin_params: 'apiKey=123\ncity=Beijing',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IframePluginComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();

    fixture = TestBed.createComponent(IframePluginComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('site', mockSite);
    fixture.componentRef.setInput('sizeKey', '2x1');
    fixture.detectChanges();
  });

  it('should create and render iframe with title and query parameters including theme', () => {
    expect(component).toBeTruthy();
    const iframeEl: HTMLIFrameElement = fixture.nativeElement.querySelector('iframe');
    expect(iframeEl).toBeTruthy();
    expect(iframeEl.getAttribute('title')).toBe('Weather Widget');
    expect(iframeEl.getAttribute('sandbox')).toContain('allow-scripts');

    const src = iframeEl.getAttribute('src');
    expect(src).toContain('https://example.com/widget.html');
    expect(src).toContain('card-size=2x1');
    expect(src).toContain('title=Weather+Widget');
    expect(src).toContain('theme=emerald');
    expect(src).toContain('theme-mode=light');
    expect(src).toContain('apiKey=123');
    expect(src).toContain('city=Beijing');
  });
});
