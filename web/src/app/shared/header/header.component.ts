import { Component, input, output } from '@angular/core';
import {
  LucideFolderPlus,
  LucidePencil,
  LucidePlus,
  LucideSave,
  LucideX,
} from '@lucide/angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    LucidePlus,
    LucideFolderPlus,
    LucidePencil,
    LucideSave,
    LucideX,
  ],
  template: `
    <header class="navbar bg-base-100 border-b border-base-300 sticky top-0 z-30 shadow-sm">
      <div class="max-w-5xl mx-auto w-full px-6 flex justify-between items-center">
        <!-- Logo Section -->
        <div class="flex items-center gap-2">
          <img src="start-base-logo.svg" alt="Start Base Logo" class="w-6 h-6" />
          <span class="text-lg font-bold tracking-tight text-base-content">Start Base</span>
        </div>

        <!-- Actions Toolbar -->
        <div class="flex items-center gap-1">
          @if (!editMode()) {
            <!-- View mode toolbar -->
            <button
              id="btn-add-site"
              (click)="addSite.emit()"
              class="btn btn-sm btn-ghost btn-square"
              title="Add Site"
            >
              <svg lucidePlus class="w-4 h-4"></svg>
            </button>

            <button
              id="btn-add-group"
              (click)="addGroup.emit()"
              class="btn btn-sm btn-ghost btn-square"
              title="Add Group"
            >
              <svg lucideFolderPlus class="w-4 h-4"></svg>
            </button>

            <button
              id="btn-edit-mode"
              (click)="enterEdit.emit()"
              class="btn btn-sm btn-ghost btn-square"
              title="Edit Mode"
            >
              <svg lucidePencil class="w-4 h-4"></svg>
            </button>
          } @else {
            <!-- Edit mode toolbar -->
            <div class="badge badge-warning py-3 font-semibold mr-1">
              Editing
            </div>

            <button
              id="btn-save"
              (click)="save.emit()"
              class="btn btn-sm btn-ghost btn-square"
              title="Save Layout"
            >
              <svg lucideSave class="w-4 h-4"></svg>
            </button>

            <button
              id="btn-exit-edit"
              (click)="cancel.emit()"
              class="btn btn-sm btn-ghost btn-square"
              title="Cancel"
            >
              <svg lucideX class="w-4 h-4"></svg>
            </button>
          }
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  editMode = input<boolean>(false);

  addSite = output<void>();
  addGroup = output<void>();
  enterEdit = output<void>();
  save = output<void>();
  cancel = output<void>();
}
