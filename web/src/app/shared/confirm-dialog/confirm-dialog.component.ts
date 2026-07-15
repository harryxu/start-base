import { Component, input, output } from '@angular/core';
import { LucideAlertTriangle } from '@lucide/angular';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [LucideAlertTriangle],
  template: `
    <!-- DaisyUI modal (modal-open keeps it visible while rendered) -->
    <div class="modal modal-open modal-middle" role="dialog" aria-modal="true">
      <div class="modal-box max-w-sm">
        <div class="flex items-start gap-4">
          <!-- Warning icon -->
          <div class="shrink-0 w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
            <svg lucideAlertTriangle class="w-5 h-5 text-error"></svg>
          </div>

          <!-- Content -->
          <div class="flex-1 pt-0.5">
            <h3 class="text-base font-semibold mb-1">{{ title() }}</h3>
            <p class="text-sm text-base-content/60 leading-relaxed whitespace-pre-wrap">
              {{ message() }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button class="btn btn-ghost btn-sm" (click)="cancelled.emit()">Cancel</button>
          <button class="btn btn-error btn-sm" (click)="confirmed.emit()">
            {{ confirmText() }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  title = input.required<string>();
  message = input.required<string>();
  confirmText = input<string>('Delete');

  confirmed = output<void>();
  cancelled = output<void>();
}
