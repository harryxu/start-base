import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideX, LucideSettings } from '@lucide/angular';

import { ConfigService } from '../../core/services/config.service';
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [FormsModule, LucideX, LucideSettings, ThemeSwitcherComponent],
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
  saving = signal(false);

  async onSubmit(): Promise<void> {
    if (!this.formTitle.trim()) return;

    this.saving.set(true);
    try {
      await this.configService.updateConfig({
        page_title: this.formTitle.trim(),
      });
      this.closed.emit();
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      this.saving.set(false);
    }
  }
}
