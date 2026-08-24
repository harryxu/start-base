import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';

import { WebcomponentPluginComponent } from './webcomponent-plugin.component';
import type { Site } from '../../core/models/types';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-mocks';

describe('WebcomponentPluginComponent', () => {
  let component: WebcomponentPluginComponent;
  let fixture: ComponentFixture<WebcomponentPluginComponent>;

  const mockSite: Site = {
    id: 10,
    url: 'data:text/javascript,export default { mount(el, props) { el.innerHTML = `<span class="rendered">${props.title}</span>`; } }',
    title: 'Custom WebComponent',
    description: 'Component description',
    icon_url: null,
    sort_order: 1,
    group_id: null,
    site_type: 'webcomponent',
    plugin_params: 'color=blue',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebcomponentPluginComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    }).compileComponents();

    fixture = TestBed.createComponent(WebcomponentPluginComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('site', mockSite);
    fixture.componentRef.setInput('sizeKey', '1x1');
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
    expect(component.params()['card-size']).toBe('1x1');
    expect(component.params()['title']).toBe('Custom WebComponent');
    expect(component.params()['theme']).toBe('emerald');
    expect(component.params()['theme-mode']).toBe('light');
    expect(component.params()['color']).toBe('blue');
  });

  it('should handle empty url with error message', async () => {
    fixture.componentRef.setInput('site', {
      ...mockSite,
      url: '',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.errorMessage()).toBe('Plugin URL is empty');
  });
});
