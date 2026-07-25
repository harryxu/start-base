import { Component, effect, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideX } from '@lucide/angular';

import type { Group } from '../../core/models/types';
import { BoardService } from '../../core/services/board.service';

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
            (click)="closed.emit()"
            aria-label="Close"
          >
            <svg lucideX class="w-4 h-4"></svg>
          </button>
        </div>

        <!-- Form body -->
        <form id="group-form" (ngSubmit)="onSubmit()" class="px-6 py-5 flex flex-col gap-5">
          <!-- Name (required) -->
          <label class="floating-label w-full text-base-content/60">
            <input
              id="group-name"
              type="text"
              [(ngModel)]="formName"
              name="name"
              required
              placeholder="Group Name"
              class="input input-bordered input-lg w-full text-base-content"
              autocomplete="off"
              #nameInput
            />
            <span>Group Name <span class="text-error">*</span></span>
          </label>

          <!-- Footer actions -->
          <div class="modal-action mt-2">
            <button type="button" class="btn btn-ghost btn-sm" (click)="closed.emit()">
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
  private boardService = inject(BoardService);

  group = input<Group | null>(null);

  closed = output<void>();

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
    const trimmedName = this.formName.trim();
    if (!trimmedName) return;

    const editingGroup = this.group();
    if (editingGroup) {
      if (trimmedName !== editingGroup.name) {
        this.boardService.updateGroup(editingGroup.id, trimmedName);
      }
    } else {
      this.boardService.saveNewGroup(trimmedName);
    }

    this.closed.emit();
  }
}
