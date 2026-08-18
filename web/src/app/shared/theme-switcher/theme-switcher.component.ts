import { Component, inject, input } from '@angular/core';
import { LucidePalette, LucideCheck } from '@lucide/angular';
import { ConfigService } from '../../core/services/config.service';
import { SUPPORTED_THEMES, type ThemeName } from '../../core/models/types';
export { SUPPORTED_THEMES, type ThemeName };

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [LucidePalette, LucideCheck],
  styles: [
    `
      :host {
        display: inline-block;
      }

      /* Ensure DaisyUI dropdown content is non-interactive and hidden when not focused */
      .dropdown:not(:focus-within):not(.dropdown-open) > .dropdown-content {
        pointer-events: none !important;
        visibility: hidden !important;
      }
    `,
  ],
  template: `
    <!-- Theme Switcher Dropdown (DaisyUI Method 3: CSS focus) -->
    <div class="dropdown" [class]="position()">
      <div
        [tabIndex]="tabIndex()"
        role="button"
        id="btn-theme-dropdown"
        class="btn btn-sm btn-ghost gap-2 capitalize"
        [class.btn-square]="!showLabel()"
        title="Theme Switcher"
      >
        <svg lucidePalette class="w-4 h-4"></svg>
        @if (showLabel()) {
          <span class="text-xs font-medium">{{ configService.theme() }}</span>
        }
      </div>
      <ul
        [tabIndex]="tabIndex()"
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
                <div
                  [attr.data-theme]="t"
                  class="bg-base-100 grid shrink-0 grid-cols-2 gap-0.5 rounded-md p-1 shadow-sm"
                >
                  <div class="bg-base-content size-1 rounded-full"></div>
                  <div class="bg-primary size-1 rounded-full"></div>
                  <div class="bg-secondary size-1 rounded-full"></div>
                  <div class="bg-accent size-1 rounded-full"></div>
                </div>
                {{ t }}
              </span>
              @if (configService.theme() === t) {
                <svg lucideCheck class="w-3.5 h-3.5 text-secondary shrink-0"></svg>
              }
            </button>
          </li>
        }
      </ul>
    </div>
  `,
})
export class ThemeSwitcherComponent {
  configService = inject(ConfigService);
  themes = SUPPORTED_THEMES;

  showLabel = input<boolean>(false);
  position = input<string>('dropdown-end');
  tabIndex = input<number>(0);

  selectTheme(theme: string): void {
    this.configService.selectTheme(theme);
    if (typeof document !== 'undefined') {
      (document.activeElement as HTMLElement)?.blur();
    }
  }
}
