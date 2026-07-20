import { Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideX } from '@lucide/angular';

import type { Group, GroupCreate } from '../../core/models/types';

@Component({
  selector: 'app-group-form',
  standalone: true,
  imports: [FormsModule, LucideX],
  template: `
    <!-- DaisyUI modal (modal-open keeps it visible while rendered) -->
    <div
      class="modal modal-open modal-middle"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="group() ? 'Edit Group' : 'Add Group'"
    >
      <div class="modal-box max-w-sm p-0">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <h2 class="text-sm font-semibold">
            {{ group() ? 'Edit Group' : 'Add Group' }}
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
        <form id="group-form" (ngSubmit)="onSubmit()" class="px-6 py-5 flex flex-col gap-4">
          <!-- Name (required) -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs">
              Group Name <span class="text-error">*</span>
            </legend>
            <input
              id="group-name"
              type="text"
              [(ngModel)]="formName"
              name="name"
              required
              placeholder="My Group"
              class="input input-bordered input-lg w-full"
              autocomplete="off"
              #nameInput
            />
          </fieldset>

          <!-- Footer actions -->
          <div class="modal-action mt-2">
            <button type="button" class="btn btn-ghost btn-sm" (click)="cancelled.emit()">
              Cancel
            </button>
            <button
              id="group-form-submit"
              type="submit"
              class="btn btn-primary btn-sm"
              [disabled]="!formName.trim()"
            >
              {{ group() ? 'Save changes' : 'Add group' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
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
