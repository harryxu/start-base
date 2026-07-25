import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { describe, beforeEach, it, expect } from 'vitest';

import { BoardService } from './board.service';

describe('BoardService', () => {
  let service: BoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAngularQuery(new QueryClient()),
      ],
    });
    service = TestBed.inject(BoardService);
  });

  it('should be created and initialize queries', () => {
    expect(service).toBeTruthy();
    expect(service.sitesQuery).toBeTruthy();
    expect(service.groupsQuery).toBeTruthy();
  });
});
