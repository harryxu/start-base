import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideLogIn, LucideEye, LucideEyeOff } from '@lucide/angular';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, LucideLogIn, LucideEye, LucideEyeOff],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  username = signal('');
  password = signal('');
  showPassword = signal(false);
  loading = signal(false);
  errorMessage = signal('');

  async onSubmit(): Promise<void> {
    if (!this.username().trim() || !this.password()) return;

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.login({
        username: this.username().trim(),
        password: this.password(),
      });
      await this.router.navigate(['/']);
    } catch {
      this.errorMessage.set('Invalid username or password.');
    } finally {
      this.loading.set(false);
    }
  }
}
