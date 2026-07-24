import { Component, inject, output } from '@angular/core';
import { LucideFolderPlus, LucidePlus, LucideSettings, LucidePalette, LucideCheck } from '@lucide/angular';
import { ConfigService, SUPPORTED_THEMES } from '../../core/services/config.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucidePlus, LucideFolderPlus, LucideSettings, LucidePalette, LucideCheck],
  template: `
    <header class="navbar bg-base-100 sticky top-0 z-30 shadow-sm">
      <div class="max-w-5xl mx-auto w-full px-6 flex justify-between items-center">
        <!-- Logo Section -->
        <div class="flex items-center gap-2">
          <img src="start-base-logo.svg" alt="Start Base Logo" class="w-6 h-6" />
          <span class="text-lg font-bold tracking-tight text-base-content">{{ configService.pageTitle() }}</span>
        </div>

        <!-- Actions Toolbar -->
        <div class="flex items-center gap-2">
          <!-- Theme Switcher Dropdown (DaisyUI Method 3: CSS focus) -->
          <div class="dropdown dropdown-end">
            <div
              tabindex="0"
              role="button"
              id="btn-theme-dropdown"
              class="btn btn-sm btn-ghost btn-square"
              title="Theme Switcher"
            >
              <svg lucidePalette class="w-4 h-4"></svg>
            </div>
            <ul
              tabindex="0"
              class="dropdown-content menu menu-vertical flex flex-col flex-nowrap bg-base-100 rounded-box z-50 w-44 p-2 shadow-2xl border border-base-200 gap-1 max-h-72 overflow-y-auto overflow-x-hidden"
            >
              @for (t of themes; track t) {
                <li class="w-full block">
                  <button
                    type="button"
                    class="w-full flex items-center justify-between text-xs py-2 px-3 rounded-lg"
                    [class.active]="configService.theme() === t"
                    (click)="selectTheme(t)"
                  >
                    <span class="capitalize flex items-center gap-2 font-medium truncate">
                      <span
                        class="w-3 h-3 rounded-full border border-base-content/20 inline-block bg-primary shrink-0"
                        [attr.data-theme]="t"
                      ></span>
                      {{ t }}
                    </span>
                    @if (configService.theme() === t) {
                      <svg lucideCheck class="w-3.5 h-3.5 text-primary shrink-0"></svg>
                    }
                  </button>
                </li>
              }
            </ul>
          </div>

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
            id="btn-settings"
            (click)="openSettings.emit()"
            class="btn btn-sm btn-ghost btn-square"
            title="System Settings"
          >
            <svg lucideSettings class="w-4 h-4"></svg>
          </button>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  configService = inject(ConfigService);
  themes = SUPPORTED_THEMES;

  addSite = output<void>();
  addGroup = output<void>();
  openSettings = output<void>();

  selectTheme(theme: string): void {
    this.configService.selectTheme(theme);
    if (typeof document !== 'undefined') {
      (document.activeElement as HTMLElement)?.blur();
    }
  }
}
