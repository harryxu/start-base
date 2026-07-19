import { Component, output } from '@angular/core';
import { LucideFolderPlus, LucidePlus } from '@lucide/angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucidePlus, LucideFolderPlus],
  template: `
    <header class="navbar bg-base-100 sticky top-0 z-30 shadow-sm">
      <div class="max-w-5xl mx-auto w-full px-6 flex justify-between items-center">
        <!-- Logo Section -->
        <div class="flex items-center gap-2">
          <img src="start-base-logo.svg" alt="Start Base Logo" class="w-6 h-6" />
          <span class="text-lg font-bold tracking-tight text-base-content">Start Base</span>
        </div>

        <!-- Actions Toolbar -->
        <div class="flex items-center gap-2">
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
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  addSite = output<void>();
  addGroup = output<void>();
}
