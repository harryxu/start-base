import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  LucideX,
  LucideSettings,
  LucideUpload,
  LucideTrash2,
  LucideImage,
  LucideShield,
  LucideAlertCircle,
  LucideExternalLink,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import { ConfigService } from '../../core/services/config.service';
import { ApiService, API_BASE } from '../../core/api/api.service';
import { AuthService } from '../../core/services/auth.service';
import type { SiteViewMode } from '../../core/models/types';
import { ThemeSwitcherComponent } from '../../shared/theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [
    FormsModule,
    CdkTrapFocus,
    LucideX,
    LucideSettings,
    LucideUpload,
    LucideTrash2,
    LucideImage,
    LucideShield,
    LucideAlertCircle,
    LucideExternalLink,
    ThemeSwitcherComponent,
  ],
  templateUrl: './settings-modal.component.html',
})
export class SettingsModalComponent {
  configService = inject(ConfigService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  closed = output<void>();

  activeTab = signal<'general' | 'auth'>('general');

  formTitle = this.configService.pageTitle();
  formAccessMode = signal<string>(this.configService.accessMode());
  formSiteViewMode = signal<SiteViewMode>(this.configService.siteViewMode());
  formUsername = this.authService.currentUser()?.username || '';
  formPassword = '';

  saving = signal(false);
  errorMessage = signal<string | null>(null);

  selectedFile: File | null = null;
  isBgRemoved = false;
  previewUrl = signal<string | null>(this.getFormattedUrl(this.configService.bgUrl()));

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.isBgRemoved = false;
      this.previewUrl.set(URL.createObjectURL(this.selectedFile));
    }
  }

  removeBackground(): void {
    this.selectedFile = null;
    this.isBgRemoved = true;
    this.previewUrl.set('');
  }

  async onSubmit(): Promise<void> {
    const trimmedTitle = this.formTitle.trim();
    if (!trimmedTitle) return;

    this.errorMessage.set(null);
    this.saving.set(true);

    try {
      const updates: Record<string, any> = {};

      if (trimmedTitle !== this.configService.pageTitle()) {
        updates['page_title'] = trimmedTitle;
      }

      if (this.formSiteViewMode() !== this.configService.siteViewMode()) {
        updates['site_view_mode'] = this.formSiteViewMode();
      }

      if (this.selectedFile) {
        const uploadRes = await firstValueFrom(
          this.apiService.uploadImage(this.selectedFile, 'backgrounds'),
        );
        updates['bg_url'] = uploadRes.url;
      } else if (this.isBgRemoved && this.configService.bgUrl()) {
        updates['bg_url'] = '';
      }

      if (Object.keys(updates).length > 0) {
        await this.configService.updateConfig(updates);
      }

      // Update access_mode & credentials if accessMode changed or username/password supplied
      const targetMode = this.formAccessMode();
      const currentMode = this.configService.accessMode();
      const hasUsernameOrPassword = !!(this.formUsername.trim() || this.formPassword);

      if (targetMode !== currentMode || hasUsernameOrPassword) {
        const accessModePayload: {
          access_mode: string;
          username?: string;
          password?: string;
        } = {
          access_mode: targetMode,
        };

        if (this.formUsername.trim()) {
          accessModePayload.username = this.formUsername.trim();
        }
        if (this.formPassword) {
          accessModePayload.password = this.formPassword;
        }

        await firstValueFrom(this.apiService.updateAccessMode(accessModePayload));
        this.configService.accessMode.set(targetMode);
      }

      this.closed.emit();
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      const detail =
        err?.error?.detail ||
        err?.message ||
        'Failed to save settings. Please check your inputs or authentication status.';
      this.errorMessage.set(detail);
    } finally {
      this.saving.set(false);
    }
  }

  private getFormattedUrl(url: string | null): string {
    if (!url) return '';
    return url.startsWith('/') ? `${API_BASE}${url}` : url;
  }
}
