import { Injectable, Injector, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../api/api.service';
import { ConfigService } from './config.service';
import type { UserLogin, UserPublic } from '../models/types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private injector = inject(Injector);

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

  /** Log in user, refresh system config, and update user state. */
  async login(credentials: UserLogin): Promise<UserPublic> {
    const user = await firstValueFrom(this.api.login(credentials));
    this.currentUser.set(user);
    await this.refreshConfig();
    return user;
  }

  /** Log out, refresh system config, and clear user state. */
  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.logout());
    } finally {
      this.currentUser.set(null);
      const refreshed = await this.refreshConfig();
      // Only navigate to '/' if config refreshed successfully (i.e. not redirected to /login by 401 interceptor)
      if (refreshed) {
        await this.router.navigate(['/']);
      }
    }
  }

  private async refreshConfig(): Promise<boolean> {
    try {
      const configService = this.injector.get(ConfigService);
      return await configService.loadConfig();
    } catch (err) {
      console.error('Failed to refresh config after auth change:', err);
      return false;
    }
  }
}
