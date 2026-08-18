import {
  Component,
  ElementRef,
  HostListener,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LucideSearch, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [LucideSearch, LucideX],
  host: {
    class: 'block h-8 w-8 sm:w-36 md:w-48 shrink-0',
  },
  styles: [
    `
      /* Active & focused styling */
      .search-box-container:is(:has(.search-input:focus), .has-query) {
        border-color: var(--color-primary);
        background-color: var(--color-base-100);
        outline: 2px solid color-mix(in oklab, var(--color-primary) 20%, transparent);

        .search-icon {
          color: var(--color-primary);
        }

        .search-input {
          width: 100%;
          opacity: 1;
        }
      }
    `,
  ],
  template: `
    <!-- Search box container -->
    <div
      class="search-box-container w-full h-full flex items-center justify-center sm:justify-start px-0 sm:px-2.5 gap-0 sm:gap-2 rounded-lg border border-base-content/20 bg-base-100/50 hover:border-base-content/35"
      [class.has-query]="query().length > 0"
      [class.px-2]="isFocused() || query().length > 0"
      [class.gap-1.5]="isFocused() || query().length > 0"
      (mousedown)="onContainerMouseDown($event)"
      (click)="focusInput()"
    >
      <!-- Search Icon -->
      <svg lucideSearch class="search-icon w-4 h-4 shrink-0 text-base-content/40"></svg>

      <!-- Input Field -->
      <input
        #inputRef
        type="text"
        class="search-input min-w-0 bg-transparent text-base sm:text-sm text-base-content placeholder:text-base-content/40 outline-none w-0 opacity-0 sm:w-full sm:opacity-100"
        [placeholder]="placeholder()"
        [value]="query()"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (input)="onInput($event)"
        (keydown)="onKeyDown($event)"
        aria-label="Search"
      />

      <!-- Clear Button (when has query) or Shortcut Hint (desktop when empty and unfocused) -->
      @if (query()) {
        <button
          type="button"
          id="btn-clear-search"
          (mousedown)="$event.preventDefault()"
          (click)="clear($event)"
          class="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-base-content"
          title="Clear search"
          aria-label="Clear search"
        >
          <svg lucideX class="w-3.5 h-3.5"></svg>
        </button>
      } @else if (!isFocused()) {
        <!-- macOS Shortcut Hint -->
        <kbd class="hidden in-[.os-macos]:sm:inline-flex kbd kbd-xs font-sans text-base-content/50"
          >⌘K</kbd
        >
        <!-- Windows / Linux Shortcut Hint -->
        <kbd
          class="hidden not-[.os-macos_&]:sm:inline-flex kbd kbd-xs font-sans text-base-content/50"
          >⌃K</kbd
        >
      }
    </div>
  `,
})
export class SearchBoxComponent {
  placeholder = input<string>('Search...');
  debounceMs = input<number>(300);

  query = signal<string>('');
  isFocused = signal<boolean>(false);

  search = output<string>();
  activeChange = output<boolean>();

  inputRef = viewChild<ElementRef<HTMLInputElement>>('inputRef');

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  @HostListener('window:keydown', ['$event'])
  onWindowKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      const inputEl = this.inputRef()?.nativeElement;
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    }
  }

  onContainerMouseDown(event: MouseEvent): void {
    if (event.target !== this.inputRef()?.nativeElement) {
      event.preventDefault();
    }
  }

  focusInput(): void {
    this.inputRef()?.nativeElement.focus();
  }

  onFocus(): void {
    this.isFocused.set(true);
    this.activeChange.emit(true);
  }

  onBlur(): void {
    this.isFocused.set(false);
    this.activeChange.emit(this.query().length > 0);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.query.set(value);
    this.activeChange.emit(this.isFocused() || value.length > 0);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.search.emit(value);
    }, this.debounceMs());
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.inputRef()?.nativeElement.blur();
    }
  }

  clear(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    const inputEl = this.inputRef()?.nativeElement;
    const isCurrentlyFocused = inputEl ? document.activeElement === inputEl : false;
    this.query.set('');
    this.search.emit('');
    this.activeChange.emit(isCurrentlyFocused);
    if (isCurrentlyFocused && inputEl) {
      inputEl.focus();
    }
  }
}
