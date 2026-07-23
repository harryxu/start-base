import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

import { SettingsModalComponent } from './settings-modal.component';

describe('SettingsModalComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component and handle initial config request', () => {
    const fixture = TestBed.createComponent(SettingsModalComponent);
    const req = httpMock.expectOne('http://localhost:5600/api/config/');
    req.flush({ page_title: 'Start Base', theme: 'system' });

    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.formTitle).toBe('Start Base');
    expect(component.formTheme).toBe('system');
  });
});
