import { TestBed } from '@angular/core/testing';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { App } from './app';
import { describe, beforeEach, it, expect } from 'vitest';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideAngularQuery(new QueryClient())],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
