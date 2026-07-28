import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { App } from './app';
import { describe, beforeEach, it, expect } from 'vitest';

import { COMMON_TEST_PROVIDERS } from './testing/test-mocks';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideTanStackQuery(new QueryClient()),
        ...COMMON_TEST_PROVIDERS,
      ],
    }).compileComponents();
  });


  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
