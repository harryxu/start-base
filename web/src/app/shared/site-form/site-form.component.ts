import { Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideX } from '@lucide/angular';

import type { Group, Site, SiteCreate } from '../../core/models/types';

@Component({
  selector: 'app-site-form',
  standalone: true,
  imports: [FormsModule, LucideX],
  template: `
    <!-- Modal backdrop -->
    <div
      class="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
      (click)="cancelled.emit()"
    ></div>

    <!-- Modal dialog -->
    <div
      class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
             w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="site() ? 'Edit Site' : 'Add Site'"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 class="text-sm font-semibold text-gray-900">
          {{ site() ? 'Edit Site' : 'Add Site' }}
        </h2>
        <button
          (click)="cancelled.emit()"
          class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400
                 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg lucideX class="w-4 h-4"></svg>
        </button>
      </div>

      <!-- Form body -->
      <form id="site-form" (ngSubmit)="onSubmit()" class="px-6 py-5 flex flex-col gap-4">

        <!-- URL (required) -->
        <div class="flex flex-col gap-1.5">
          <label for="site-url" class="text-xs font-medium text-gray-700">
            URL <span class="text-red-500">*</span>
          </label>
          <input
            id="site-url"
            type="url"
            [(ngModel)]="formUrl"
            name="url"
            required
            placeholder="https://example.com"
            class="form-input"
            autocomplete="off"
          />
        </div>

        <!-- Title -->
        <div class="flex flex-col gap-1.5">
          <label for="site-title" class="text-xs font-medium text-gray-700">
            Title
            <span class="text-gray-400 font-normal ml-1">— auto-fetched if blank</span>
          </label>
          <input
            id="site-title"
            type="text"
            [(ngModel)]="formTitle"
            name="title"
            placeholder="My Site"
            class="form-input"
            autocomplete="off"
          />
        </div>

        <!-- Icon URL -->
        <div class="flex flex-col gap-1.5">
          <label for="site-icon" class="text-xs font-medium text-gray-700">
            Icon URL
            <span class="text-gray-400 font-normal ml-1">— auto-fetched if blank</span>
          </label>
          <input
            id="site-icon"
            type="url"
            [(ngModel)]="formIconUrl"
            name="iconUrl"
            placeholder="https://example.com/favicon.ico"
            class="form-input"
          />
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-1.5">
          <label for="site-desc" class="text-xs font-medium text-gray-700">Description</label>
          <input
            id="site-desc"
            type="text"
            [(ngModel)]="formDescription"
            name="description"
            placeholder="Optional description"
            class="form-input"
          />
        </div>

        <!-- Group select -->
        <div class="flex flex-col gap-1.5">
          <label for="site-group" class="text-xs font-medium text-gray-700">Group</label>
          <select
            id="site-group"
            [(ngModel)]="formGroupId"
            name="group"
            class="form-input"
          >
            <option [ngValue]="null">No group</option>
            @for (g of groups(); track g.id) {
              <option [ngValue]="g.id">{{ g.name }}</option>
            }
          </select>
        </div>

        <!-- Footer actions -->
        <div class="flex justify-end gap-2 pt-1">
          <button
            type="button"
            (click)="cancelled.emit()"
            class="px-4 py-2 text-sm text-gray-600 rounded-lg border border-gray-200
                   hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            id="site-form-submit"
            type="submit"
            [disabled]="!formUrl"
            class="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg
                   hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
          >
            {{ site() ? 'Save changes' : 'Add site' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .form-input {
        width: 100%;
        padding: 7px 10px;
        font-size: 13px;
        color: #111827;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
        background: white;
      }

      .form-input:focus {
        border-color: #93c5fd;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
      }

      select.form-input {
        appearance: auto;
      }
    `,
  ],
})
export class SiteFormComponent {
  site = input<Site | null>(null);
  prefilledUrl = input<string>('');
  groups = input<Group[]>([]);

  submitted = output<SiteCreate>();
  cancelled = output<void>();

  // Bound form fields
  formUrl = '';
  formTitle = '';
  formIconUrl = '';
  formDescription = '';
  formGroupId: number | null = null;

  constructor() {
    // Populate form when site input changes (edit mode) or when a URL is pre-filled
    effect(() => {
      const s = this.site();
      const url = this.prefilledUrl();
      if (s) {
        this.formUrl = s.url;
        this.formTitle = s.title ?? '';
        this.formIconUrl = s.icon_url ?? '';
        this.formDescription = s.description ?? '';
        this.formGroupId = s.group_id;
      } else {
        this.formUrl = url;
        this.formTitle = '';
        this.formIconUrl = '';
        this.formDescription = '';
        this.formGroupId = null;
      }
    });
  }

  onSubmit(): void {
    if (!this.formUrl) return;

    this.submitted.emit({
      url: this.formUrl.trim(),
      title: this.formTitle.trim() || null,
      icon_url: this.formIconUrl.trim() || null,
      description: this.formDescription.trim() || null,
      group_id: this.formGroupId,
    });
  }
}
