import { Injectable, inject, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type {
  Group,
  GroupCreate,
  GroupUpdate,
  ReorderItem,
  Site,
  SiteCreate,
  SiteReorderItem,
  SiteUpdate,
} from '../models/types';

export const API_BASE = isDevMode() ? 'http://localhost:5600' : '';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // ---- Groups ----

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${API_BASE}/api/groups/`);
  }

  createGroup(data: GroupCreate): Observable<Group> {
    return this.http.post<Group>(`${API_BASE}/api/groups/`, data);
  }

  updateGroup(id: number, data: GroupUpdate): Observable<Group> {
    return this.http.patch<Group>(`${API_BASE}/api/groups/${id}`, data);
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/api/groups/${id}`);
  }

  reorderGroups(items: ReorderItem[]): Observable<void> {
    return this.http.post<void>(`${API_BASE}/api/groups/reorder`, items);
  }

  // ---- Sites ----

  getSites(): Observable<Site[]> {
    return this.http.get<Site[]>(`${API_BASE}/api/sites/`);
  }

  createSite(data: SiteCreate): Observable<Site> {
    return this.http.post<Site>(`${API_BASE}/api/sites/`, data);
  }

  updateSite(id: number, data: SiteUpdate): Observable<Site> {
    return this.http.patch<Site>(`${API_BASE}/api/sites/${id}`, data);
  }

  deleteSite(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/api/sites/${id}`);
  }

  reorderSites(items: SiteReorderItem[]): Observable<void> {
    return this.http.post<void>(`${API_BASE}/api/sites/reorder`, items);
  }
}
