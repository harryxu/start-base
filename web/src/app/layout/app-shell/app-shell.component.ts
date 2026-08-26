import { Component, inject, OnInit, signal } from '@angular/core';

import { ConfigService } from '../../core/services/config.service';
import { AuthService } from '../../core/services/auth.service';
import { HomeComponent } from '../../features/board/home/home.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [HomeComponent],
  template: `
    @if (initialized()) {
      <app-home />
    } @else {
      <!-- Initial loading state while checking system config & auth -->
      <div class="min-h-screen flex items-center justify-center bg-base-100">
        <span class="loading loading-spinner loading-md text-primary"></span>
      </div>
    }
  `,
})
export class AppShellComponent implements OnInit {
  private configService = inject(ConfigService);
  private authService = inject(AuthService);

  initialized = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      await this.configService.loadConfig();
      await this.authService.fetchCurrentUser();
      this.initialized.set(true);
    } catch {
      // 401 on loadConfig in full_guard mode will be handled by authInterceptor redirecting to /login
    }
  }
}
