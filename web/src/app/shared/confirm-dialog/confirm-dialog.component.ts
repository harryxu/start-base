import { Component, input, output } from '@angular/core';
import { LucideAlertTriangle, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [LucideAlertTriangle, LucideX],
  template: `
    <!-- Modal backdrop -->
    <div
      class="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px]"
      (click)="cancelled.emit()"
    ></div>

    <!-- Modal dialog -->
    <div
      class="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
             w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-6"
      role="dialog"
      aria-modal="true"
    >
      <div class="flex items-start gap-4">
        <!-- Icon -->
        <div class="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <svg lucideAlertTriangle class="w-5 h-5 text-red-600"></svg>
        </div>

        <!-- Content -->
        <div class="flex-1 pt-0.5">
          <h3 class="text-base font-semibold text-gray-900 mb-1">{{ title() }}</h3>
          <p class="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">{{ message() }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex justify-end gap-2">
        <button
          (click)="cancelled.emit()"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          (click)="confirmed.emit()"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
        >
          {{ confirmText() }}
        </button>
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
