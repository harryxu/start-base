import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideX, LucideSettings, LucideUpload, LucideTrash2, LucideImage } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import { ConfigService } from '../../core/services/config.service';
import { ApiService, API_BASE } from '../../core/api/api.service';
import { ThemeSwitcherComponent } from '../../shared/theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [
    FormsModule,
    LucideX,
    LucideSettings,
    LucideUpload,
    LucideTrash2,
    LucideImage,
    ThemeSwitcherComponent,
  ],
  template: `
    <div
      class="modal modal-open modal-middle"
      role="dialog"
      aria-modal="true"
      aria-label="System Settings"
    >
      <div class="modal-box max-w-md p-0 overflow-visible">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <div class="flex items-center gap-2">
            <svg lucideSettings class="w-4 h-4 text-primary"></svg>
            <h2 class="text-sm font-semibold">System Settings</h2>
          </div>
          <button
            class="btn btn-ghost btn-sm btn-square"
            (click)="closed.emit()"
            aria-label="Close"
          >
            <svg lucideX class="w-4 h-4"></svg>
          </button>
        </div>

        <!-- Settings Form -->
        <form (ngSubmit)="onSubmit()" class="px-6 py-5 flex flex-col gap-6">
          <!-- Page Title -->
          <div class="flex flex-col gap-2">
            <label for="settings-page-title" class="text-xs font-medium text-base-content/70">
              Page Title
            </label>
            <input
              id="settings-page-title"
              type="text"
              [(ngModel)]="formTitle"
              name="pageTitle"
              required
              placeholder="Start Base"
              class="input input-bordered w-full"
              autocomplete="off"
            />
          </div>

          <!-- Theme Selection via ThemeSwitcherComponent -->
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-base-content/70"> System Theme </label>
            <app-theme-switcher [showLabel]="true" position="dropdown-top dropdown-end" />
          </div>

          <!-- Background Image -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-medium text-base-content/70"> Background Image </label>
            <div class="flex items-center gap-3">
              <!-- Preview Box -->
              @if (previewUrl()) {
                <div class="relative w-20 h-14 rounded-lg border border-base-300 overflow-hidden shrink-0 group">
                  <img [src]="previewUrl()" alt="Background Preview" class="w-full h-full object-cover" />
                  <button
                    type="button"
                    (click)="removeBackground()"
                    class="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Background"
                  >
                    <svg lucideTrash2 class="w-4 h-4"></svg>
                  </button>
                </div>
              } @else {
                <div class="w-20 h-14 rounded-lg border border-dashed border-base-300 flex items-center justify-center bg-base-200/50 shrink-0 text-base-content/40">
                  <svg lucideImage class="w-6 h-6"></svg>
                </div>
              }

              <!-- File Controls & Status -->
              <div class="flex flex-col gap-1.5 flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <label class="btn btn-xs btn-outline gap-1 cursor-pointer">
                    <svg lucideUpload class="w-3.5 h-3.5"></svg>
                    <span>{{ selectedFile ? 'Change Image' : 'Choose Image' }}</span>
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      (change)="onFileSelected($event)"
                    />
                  </label>
                  @if (previewUrl()) {
                    <button
                      type="button"
                      (click)="removeBackground()"
                      class="btn btn-xs btn-ghost text-error"
                      title="Clear background image"
                    >
                      Remove
                    </button>
                  }
                </div>
                @if (selectedFile) {
                  <span class="text-[11px] text-primary truncate font-medium">
                    Pending upload: {{ selectedFile.name }}
                  </span>
                } @else if (configService.bgUrl() && !isBgRemoved) {
                  <span class="text-[11px] text-base-content/50 truncate">Custom background active</span>
                } @else if (isBgRemoved) {
                  <span class="text-[11px] text-warning truncate">Background will be cleared on save</span>
                } @else {
                  <span class="text-[11px] text-base-content/40">No background image set</span>
                }
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="modal-action mt-2">
            <button type="button" class="btn btn-ghost btn-sm" (click)="closed.emit()">
              Cancel
            </button>
            <button
              id="settings-submit"
              type="submit"
              class="btn btn-primary btn-sm"
              [disabled]="saving() || !formTitle.trim()"
            >
              @if (saving()) {
                <span class="loading loading-spinner loading-xs"></span>
              } @else {
                Save Settings
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class SettingsModalComponent {
  configService = inject(ConfigService);
  private apiService = inject(ApiService);

  closed = output<void>();

  formTitle = this.configService.pageTitle();
  saving = signal(false);

  selectedFile: File | null = null;
  isBgRemoved = false;
  previewUrl = signal<string>(this.getFormattedUrl(this.configService.bgUrl()));

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

    this.saving.set(true);
    try {
      const updates: Record<string, any> = {};

      if (trimmedTitle !== this.configService.pageTitle()) {
        updates['page_title'] = trimmedTitle;
      }

      if (this.selectedFile) {
        const uploadRes = await firstValueFrom(
          this.apiService.uploadImage(this.selectedFile, 'backgrounds')
        );
        updates['bg_url'] = uploadRes.url;
      } else if (this.isBgRemoved && this.configService.bgUrl()) {
        updates['bg_url'] = '';
      }

      if (Object.keys(updates).length > 0) {
        await this.configService.updateConfig(updates);
      }
      this.closed.emit();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      this.saving.set(false);
    }
  }

  private getFormattedUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('/') ? `${API_BASE}${url}` : url;
  }
}
