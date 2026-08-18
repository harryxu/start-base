import {
  Component,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import {
  LucideFolderPlus,
  LucideLogIn,
  LucideLogOut,
  LucidePlus,
  LucideSettings,
  LucideUser,
} from '@lucide/angular';

import { ConfigService } from '../../core/services/config.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher.component';
import { SearchBoxComponent } from '../search-box/search-box.component';

@Component({
  selector: 'app-header',
  imports: [
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    LucidePlus,
    LucideFolderPlus,
    LucideSettings,
    LucideLogIn,
    LucideLogOut,
    LucideUser,
    ThemeSwitcherComponent,
    SearchBoxComponent,
  ],
  template: `
    <header
      class="navbar sticky top-0 z-30 shadow-sm transition-transform duration-300 ease-in-out min-h-0"
      [class.bg-base-100]="!configService.bgUrl()"
      [class.bg-base-100/60]="configService.bgUrl()"
      [class.backdrop-blur-md]="configService.bgUrl()"
      [class.-translate-y-full]="isHeaderHidden()"
    >
      <div class="max-w-5xl mx-auto w-full px-2 flex justify-between items-center gap-2">
        <!-- Logo Section -->
        <div class="flex items-center gap-2 min-w-0 shrink-0">
          <img src="start-base-logo.svg" alt="Start Base Logo" class="w-6 h-6 shrink-0" />
          <span
            class="text-base sm:text-lg font-bold tracking-tight text-base-content truncate"
            [class.hidden]="isSearchActive()"
            [class.sm:inline-block]="true"
          >{{ configService.pageTitle() }}</span>
        </div>

        <!-- Actions Toolbar -->
        <div class="flex items-center gap-1 sm:gap-2 shrink min-w-0 justify-end flex-1 sm:flex-initial">
          <!-- Search Box -->
          <app-search-box
            [class.flex-1]="isSearchActive()"
            [class.w-full]="isSearchActive()"
            (search)="search.emit($event)"
            (activeChange)="isSearchActive.set($event)"
          />

          @if (!configService.isReadOnly()) {
            <!-- Add Site -->
            <button
              id="btn-add-site"
              (click)="addSite.emit()"
              class="btn btn-sm btn-ghost btn-square"
              title="Add Site"
            >
              <svg lucidePlus class="w-4 h-4"></svg>
            </button>

            <!-- Add Group -->
            <button
              id="btn-add-group"
              (click)="addGroup.emit()"
              class="btn btn-sm btn-ghost btn-square"
              title="Add Group"
            >
              <svg lucideFolderPlus class="w-4 h-4"></svg>
            </button>

            <!-- Divider after Add Group -->
            <div class="h-4 w-px bg-base-content/20 shrink-0 mx-0.5"></div>

            <!-- Theme Switcher: only for users with write access -->
            <app-theme-switcher />

            <!-- Settings: only for users with write access -->
            <button
              id="btn-settings"
              (click)="openSettings.emit()"
              class="btn btn-sm btn-ghost btn-square"
              title="System Settings"
            >
              <svg lucideSettings class="w-4 h-4"></svg>
            </button>

            <!-- Divider after Settings (if Auth controls present) -->
            @if (configService.accessMode() !== 'none_guard') {
              <div class="h-4 w-px bg-base-content/20 shrink-0 mx-0.5"></div>
            }
          }

          <!-- Auth controls (only shown when access_mode !== 'none_guard') -->
          @if (configService.accessMode() !== 'none_guard') {
            @if (authService.currentUser()) {
              <!-- Logged-in: show username + dropdown -->
              <button
                id="btn-user-menu"
                [cdkMenuTriggerFor]="userMenu"
                class="btn btn-sm btn-ghost gap-1.5 px-2"
                [attr.aria-label]="'User menu for ' + authService.currentUser()!.username"
              >
                <svg lucideUser class="w-4 h-4"></svg>
                <span class="text-xs font-medium max-w-24 truncate">{{
                  authService.currentUser()!.username
                }}</span>
              </button>

              <ng-template #userMenu>
                <div
                  cdkMenu
                  class="menu bg-base-100 border border-base-300 shadow-xl rounded-box p-2 min-w-36 z-50 flex flex-col gap-1"
                >
                  <button
                    id="btn-logout"
                    cdkMenuItem
                    (click)="onLogout()"
                    class="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-error/15 text-error outline-none focus:outline-none rounded-lg w-full font-medium transition-colors"
                  >
                    <svg lucideLogOut class="w-4 h-4"></svg>
                    <span>Logout</span>
                  </button>
                </div>
              </ng-template>
            } @else {
              <!-- Not logged in: show Login button -->
              <button
                id="btn-login"
                (click)="navigateToLogin()"
                class="btn btn-sm btn-ghost gap-1.5 px-2"
                title="Login"
              >
                <svg lucideLogIn class="w-4 h-4"></svg>
                <span class="text-xs font-medium">Login</span>
              </button>
            }
          }
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  configService = inject(ConfigService);
  authService = inject(AuthService);
  private router = inject(Router);

  /** Toggle whether page scroll auto-hides the header */
  enableScrollHide = input<boolean>(true);

  /** Threshold in pixels to trigger hiding header when scrolling down */
  hideThreshold = input<number>(50);

  /** Threshold in pixels to trigger showing header when scrolling up */
  showThreshold = input<number>(20);

  /** Internal state tracking if header is hidden */
  isHeaderHidden = signal<boolean>(false);

  private lastScrollY = 0;

  constructor() {
    effect(() => {
      // Ensure header is shown if scroll-hide feature gets disabled
      if (!this.enableScrollHide()) {
        this.isHeaderHidden.set(false);
      }
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!this.enableScrollHide()) {
      if (this.isHeaderHidden()) {
        this.isHeaderHidden.set(false);
      }
      return;
    }

    const currentScrollY = window.scrollY || document.documentElement?.scrollTop || 0;

    // Always keep header visible when near the top of the page
    if (currentScrollY <= this.showThreshold()) {
      this.isHeaderHidden.set(false);
      this.lastScrollY = currentScrollY;
      return;
    }

    const delta = currentScrollY - this.lastScrollY;

    if (delta > 0 && delta >= this.hideThreshold()) {
      // Scrolling down (page sliding up): hide header
      this.isHeaderHidden.set(true);
      this.lastScrollY = currentScrollY;
    } else if (delta < 0 && Math.abs(delta) >= this.showThreshold()) {
      // Scrolling up (page sliding down): show header
      this.isHeaderHidden.set(false);
      this.lastScrollY = currentScrollY;
    }
  }

  isSearchActive = signal<boolean>(false);
  search = output<string>();
  addSite = output<void>();
  addGroup = output<void>();
  openSettings = output<void>();

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
  }
}
