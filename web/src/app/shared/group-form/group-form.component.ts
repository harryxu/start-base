import { Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideX } from '@lucide/angular';

import type { Group, GroupCreate } from '../../core/models/types';

@Component({
  selector: 'app-group-form',
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
             w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="group() ? 'Edit Group' : 'Add Group'"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 class="text-sm font-semibold text-gray-900">
          {{ group() ? 'Edit Group' : 'Add Group' }}
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
      <form id="group-form" (ngSubmit)="onSubmit()" class="px-6 py-5 flex flex-col gap-4">

        <!-- Name (required) -->
        <div class="flex flex-col gap-1.5">
          <label for="group-name" class="text-xs font-medium text-gray-700">
            Group Name <span class="text-red-500">*</span>
          </label>
          <input
            id="group-name"
            type="text"
            [(ngModel)]="formName"
            name="name"
            required
            placeholder="My Group"
            class="form-input"
            autocomplete="off"
            #nameInput
          />
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
            id="group-form-submit"
            type="submit"
            [disabled]="!formName.trim()"
            class="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg
                   hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
          >
            {{ group() ? 'Save changes' : 'Add group' }}
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
    `,
  ],
})
export class GroupFormComponent {
  group = input<Group | null>(null);

  submitted = output<GroupCreate>();
  cancelled = output<void>();

  // Bound form fields
  formName = '';

  constructor() {
    effect(() => {
      const g = this.group();
      if (g) {
        this.formName = g.name;
      } else {
        this.formName = '';
      }
    });
  }

  onSubmit(): void {
    if (!this.formName.trim()) return;

    this.submitted.emit({
      name: this.formName.trim(),
    });
  }
}
