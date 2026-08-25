import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { describe, beforeEach, it, expect } from 'vitest';

import { SiteFormComponent } from './site-form.component';
import type { Site } from '../../core/models/types';

describe('SiteFormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAngularQuery(new QueryClient()),
      ],
    }).compileComponents();
  });

  it('should create the component and handle site binding', () => {
    const fixture = TestBed.createComponent(SiteFormComponent);
    const component = fixture.componentInstance;

    const mockSite: Site = {
      id: 1,
      url: 'https://example.com',
      title: 'Example',
      icon_url: 'icon.png',
      description: 'Desc',
      sort_order: 10,
      group_id: null,
    };

    fixture.componentRef.setInput('site', mockSite);
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.formUrl).toBe('https://example.com');
    expect(component.formTitle).toBe('Example');
    expect(component.formColSpan).toBe(1);
    expect(component.formRowSpan).toBe(1);
  });

  it('should initialize with custom col_span and row_span when editing', () => {
    const fixture = TestBed.createComponent(SiteFormComponent);
    const component = fixture.componentInstance;

    const mockSite: Site = {
      id: 2,
      url: 'https://example.com',
      title: 'Large Site',
      icon_url: null,
      description: null,
      sort_order: 0,
      group_id: null,
      col_span: 2,
      row_span: 2,
    };

    fixture.componentRef.setInput('site', mockSite);
    fixture.detectChanges();

    expect(component.formColSpan).toBe(2);
    expect(component.formRowSpan).toBe(2);
  });

  it('should initialize and toggle plugin mode correctly', () => {
    const fixture = TestBed.createComponent(SiteFormComponent);
    const component = fixture.componentInstance;

    const mockPluginSite: Site = {
      id: 3,
      url: 'https://example.com/plugin.js',
      title: 'My Plugin',
      icon_url: null,
      description: 'Plugin Desc',
      sort_order: 0,
      group_id: null,
      site_type: 'iframe',
      plugin_params: 'key1=value1\nkey2=value2',
    };

    fixture.componentRef.setInput('site', mockPluginSite);
    fixture.detectChanges();

    expect(component.isPluginMode()).toBe(true);
    expect(component.formPluginType).toBe('iframe');
    expect(component.formPluginParams).toBe('key1=value1\nkey2=value2');

    // Toggle off
    component.togglePluginMode(false);
    expect(component.isPluginMode()).toBe(false);
  });

  it('should enable submit when Web Component plugin file is selected even without manual URL', () => {
    const fixture = TestBed.createComponent(SiteFormComponent);
    const component = fixture.componentInstance;

    component.togglePluginMode(true);
    component.formPluginType = 'webcomponent';
    component.formUrl = '';

    expect(component.isSubmitDisabled()).toBe(true);

    const dummyFile = new File(['export default {};'], 'my-widget.js', {
      type: 'application/javascript',
    });
    component.selectedPluginFile = dummyFile;
    component.formUrl = dummyFile.name;

    expect(component.isSubmitDisabled()).toBe(false);
  });

  it('should reject invalid plugin file extension', async () => {
    const fixture = TestBed.createComponent(SiteFormComponent);
    const component = fixture.componentInstance;

    component.togglePluginMode(true);
    component.formPluginType = 'webcomponent';

    const invalidFile = new File(['fake content'], 'test.png', { type: 'image/png' });
    const event = {
      target: {
        files: [invalidFile],
        value: 'test.png',
      },
    } as unknown as Event;

    await component.onPluginFileSelected(event);

    expect(component.uploadError()).toContain('valid JavaScript plugin file');
    expect(component.selectedPluginFile).toBeNull();
  });
});
