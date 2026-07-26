import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('should trigger redirect when 401 response contains X-Login-Location header', () => {
    const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      href: '',
    } as any);

    http.get('/api/test').subscribe({
      error: (err) => {
        expect(err.status).toBe(401);
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', {
      status: 401,
      statusText: 'Unauthorized',
      headers: { 'X-Login-Location': 'https://auth.example.com/login' },
    });

    expect(locationSpy).toHaveBeenCalled();
  });
});
