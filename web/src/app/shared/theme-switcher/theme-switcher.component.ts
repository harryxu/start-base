import { Component, inject, input } from '@angular/core';
import { LucidePalette, LucideCheck } from '@lucide/angular';
import { ConfigService } from '../../core/services/config.service';

export const SUPPORTED_THEMES = [
  'light',
  'cupcake',
  'emerald',
  'corporate',
  'pastel',
  'fantasy',
  'coffee',
  'business',
  'night',
  'dark',
  'dim',
  'dracula',
] as const;

export type ThemeName = (typeof SUPPORTED_THEMES)[number];

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
        tabindex="0"
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

  selectTheme(theme: string): void {
    this.configService.selectTheme(theme);
    if (typeof document !== 'undefined') {
      (document.activeElement as HTMLElement)?.blur();
    }
  }
}
