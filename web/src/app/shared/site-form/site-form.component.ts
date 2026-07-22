import { Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideX } from '@lucide/angular';

import type { Group, Site, SiteCreate } from '../../core/models/types';

@Component({
  selector: 'app-site-form',
  standalone: true,
  imports: [FormsModule, LucideX],
  template: `
    <!-- DaisyUI modal (modal-open keeps it visible while rendered) -->
    <div
      class="modal modal-open modal-middle"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="site() ? 'Edit Site' : 'Add Site'"
    >
      <div class="modal-box max-w-md p-0">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <h2 class="text-sm font-semibold">
            {{ site() ? 'Edit Site' : 'Add Site' }}
          </h2>
          <button
            class="btn btn-ghost btn-sm btn-square"
            (click)="cancelled.emit()"
            aria-label="Close"
          >
            <svg lucideX class="w-4 h-4"></svg>
          </button>
        </div>

        <!-- Form body -->
        <form id="site-form" (ngSubmit)="onSubmit()" class="px-6 py-5 flex flex-col gap-6">
          <!-- URL (required) -->
          <label class="floating-label w-full text-base-content/60">
            <input
              id="site-url"
              type="url"
              [(ngModel)]="formUrl"
              name="url"
              required
              placeholder="URL"
              class="input input-bordered input-lg w-full text-base-content"
              autocomplete="off"
            />
            <span>URL <span class="text-error">*</span></span>
          </label>

          <!-- Title -->
          <label class="floating-label w-full text-base-content/60">
            <input
              id="site-title"
              type="text"
              [(ngModel)]="formTitle"
              name="title"
              placeholder="Title"
              class="input input-bordered input-lg w-full text-base-content"
              autocomplete="off"
            />
            <span>Title</span>
          </label>

          <!-- Icon URL -->
          <label class="floating-label w-full text-base-content/60">
            <input
              id="site-icon"
              type="url"
              [(ngModel)]="formIconUrl"
              name="iconUrl"
              placeholder="Icon URL"
              class="input input-bordered input-lg w-full text-base-content"
            />
            <span>Icon URL</span>
          </label>

          <!-- Description -->
          <label class="floating-label w-full text-base-content/60">
            <input
              id="site-desc"
              type="text"
              [(ngModel)]="formDescription"
              name="description"
              placeholder="Description"
              class="input input-bordered input-lg w-full text-base-content"
            />
            <span>Description</span>
          </label>

          <!-- Group select -->
          <label class="floating-label w-full text-base-content/60">
            <select
              id="site-group"
              [(ngModel)]="formGroupId"
              name="group"
              class="select select-bordered select-lg w-full text-base-content"
            >
              <option [ngValue]="null">No group</option>
              @for (g of groups(); track g.id) {
                <option [ngValue]="g.id">{{ g.name }}</option>
              }
            </select>
            <span>Group</span>
          </label>

          <!-- Footer actions -->
          <div class="modal-action mt-2">
            <button type="button" class="btn btn-ghost btn-sm" (click)="cancelled.emit()">
              Cancel
            </button>
            <button
              id="site-form-submit"
              type="submit"
              class="btn btn-primary btn-sm"
              [disabled]="!formUrl"
            >
              {{ site() ? 'Save changes' : 'Add site' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
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
