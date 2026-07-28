import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, it, expect } from 'vitest';

import { GroupFormComponent } from './group-form.component';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-mocks';
import type { Group } from '../../core/models/types';

describe('GroupFormComponent', () => {
  let component: GroupFormComponent;
  let fixture: ComponentFixture<GroupFormComponent>;

  const mockGroup: Group = {
    id: 1,
    name: 'Work',
    icon_url: '/files/icons/work.png',
    sort_order: 10,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...COMMON_TEST_PROVIDERS,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create group form component', () => {
    expect(component).toBeTruthy();
  });

  it('should populate form fields when group input is provided', () => {
    fixture.componentRef.setInput('group', mockGroup);
    fixture.detectChanges();

    expect(component.formName).toBe('Work');
    expect(component.formIconUrl).toBe('/files/icons/work.png');
  });
});
