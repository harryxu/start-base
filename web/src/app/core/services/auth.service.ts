import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../api/api.service';
import type { UserPublic } from '../models/types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  currentUser = signal<UserPublic | null>(null);

  /** Fetch the currently logged-in user from the server. */
  async fetchCurrentUser(): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.getCurrentUser());
      this.currentUser.set(res.user);
    } catch {
      // 401 or network error → not logged in
      this.currentUser.set(null);
    }
  }

  /** Log out and clear user state. */
  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.logout());
    } finally {
      this.currentUser.set(null);
      await this.router.navigate(['/']);
    }
  }
}
