import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideX, LucideSettings, LucideSun, LucideMoon, LucideLaptop } from '@lucide/angular';

import { ConfigService, ThemeMode } from '../../core/services/config.service';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [FormsModule, LucideX, LucideSettings],
  template: `
    <div
      class="modal modal-open modal-middle"
      role="dialog"
      aria-modal="true"
      aria-label="System Settings"
    >
      <div class="modal-box max-w-md p-0">
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

          <!-- Theme -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-medium text-base-content/70">
              Theme Mode
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="theme-system"
                class="btn btn-outline btn-sm flex flex-col gap-1 h-auto py-2"
                [class.btn-primary]="formTheme === 'system'"
                [class.btn-active]="formTheme === 'system'"
                (click)="formTheme = 'system'"
              >
                <span class="text-xs">System</span>
              </button>

              <button
                type="button"
                id="theme-light"
                class="btn btn-outline btn-sm flex flex-col gap-1 h-auto py-2"
                [class.btn-primary]="formTheme === 'light'"
                [class.btn-active]="formTheme === 'light'"
                (click)="formTheme = 'light'"
              >
                <span class="text-xs">Light</span>
              </button>

              <button
                type="button"
                id="theme-dark"
                class="btn btn-outline btn-sm flex flex-col gap-1 h-auto py-2"
                [class.btn-primary]="formTheme === 'dark'"
                [class.btn-active]="formTheme === 'dark'"
                (click)="formTheme = 'dark'"
              >
                <span class="text-xs">Dark</span>
              </button>
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
  private configService = inject(ConfigService);

  closed = output<void>();

  formTitle = this.configService.pageTitle();
  formTheme: ThemeMode = this.configService.theme();
  saving = signal(false);

  async onSubmit(): Promise<void> {
    if (!this.formTitle.trim()) return;

    this.saving.set(true);
    try {
      await this.configService.updateConfig({
        page_title: this.formTitle.trim(),
        theme: this.formTheme,
      });
      this.closed.emit();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      this.saving.set(false);
    }
  }
}
