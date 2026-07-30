import { Injectable, inject, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type {
  Group,
  ReorderItem,
  Site,
  SiteReorderItem,
  UserLogin,
  UserPublic,
} from '../models/types';

export const API_BASE = '';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // ---- Groups ----

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${API_BASE}/api/groups/`);
  }

  createGroup(data: Partial<Group>): Observable<Group> {
    return this.http.post<Group>(`${API_BASE}/api/groups/`, data);
  }

  updateGroup(id: number, data: Partial<Group>): Observable<Group> {
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

  createSite(data: Partial<Site>): Observable<Site> {
    return this.http.post<Site>(`${API_BASE}/api/sites/`, data);
  }

  updateSite(id: number, data: Partial<Site>): Observable<Site> {
    return this.http.patch<Site>(`${API_BASE}/api/sites/${id}`, data);
  }

  deleteSite(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/api/sites/${id}`);
  }

  reorderSites(items: SiteReorderItem[]): Observable<void> {
    return this.http.post<void>(`${API_BASE}/api/sites/reorder`, items);
  }

  uploadIcon(file: File, folder: string = 'icons'): Observable<{ url: string }> {
    return this.uploadImage(file, folder);
  }

  uploadImage(file: File, folder: string = ''): Observable<{ url: string }> {
    const formData = new FormData();
    // Explicitly pass filename (3rd param) for iOS WebKit FormData compatibility
    const filename = file.name || 'image.jpg';
    formData.append('file', file, filename);
    if (folder) {
      formData.append('folder', folder);
    }
    return this.http.post<{ url: string }>(`${API_BASE}/api/system/upload-image`, formData, {
      headers: { 'ngsw-bypass': 'true' },
    });
  }

  // ---- Auth ----

  login(data: UserLogin): Observable<UserPublic> {
    return this.http.post<UserPublic>(`${API_BASE}/api/auth/login`, data, {
      withCredentials: true,
    });
  }

  logout(): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(
      `${API_BASE}/api/auth/logout`,
      {},
      { withCredentials: true },
    );
  }

  getCurrentUser(): Observable<{ user: UserPublic | null; access_mode: string }> {
    return this.http.get<{ user: UserPublic | null; access_mode: string }>(
      `${API_BASE}/api/auth/me`,
      { withCredentials: true },
    );
  }

  // ---- System Config ----

  getConfig(): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${API_BASE}/api/config/`);
  }

  updateConfig(data: Record<string, any>): Observable<Record<string, any>> {
    return this.http.patch<Record<string, any>>(`${API_BASE}/api/config/`, data);
  }

  updateAccessMode(data: {
    access_mode: string;
    username?: string;
    password?: string;
  }): Observable<Record<string, any>> {
    return this.http.patch<Record<string, any>>(`${API_BASE}/api/config/access-mode`, data);
  }
}
