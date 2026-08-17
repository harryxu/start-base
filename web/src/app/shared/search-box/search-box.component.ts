import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
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
      :host {
        display: block;
      }

      /* Focused state: expand search box across toolbar and increase contrast */
      .search-box-container:has(.search-input:focus) {
        position: absolute;
        inset-block: 0;
        right: 0;
        width: 100%;
        min-width: 12rem; /* 192px on mobile */
        max-width: calc(100vw - 3rem);
        z-index: 20;
        justify-content: flex-start;
        padding-inline: 0.625rem; /* 10px / px-2.5 */
        gap: 0.5rem; /* 8px / gap-2 */
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

      @media (min-width: 640px) {
        .search-box-container:has(.search-input:focus) {
          min-width: 18rem; /* 288px on desktop */
          max-width: none;
        }
      }
    `,
  ],
  template: `
    <!-- Search box container -->
    <div
      class="search-box-container w-full h-full flex items-center justify-center sm:justify-start px-0 sm:px-2.5 gap-0 sm:gap-2 rounded-lg border border-base-content/20 bg-base-100/50 hover:border-base-content/35 transition-all duration-200 cursor-text"
      (mousedown)="onContainerMouseDown($event)"
      (click)="focusInput()"
    >
      <!-- Search Icon -->
      <svg
        lucideSearch
        class="search-icon w-4 h-4 shrink-0 transition-colors duration-200 text-base-content/40"
      ></svg>

      <!-- Input Field -->
      <input
        #inputRef
        type="text"
        class="search-input min-w-0 bg-transparent text-xs sm:text-sm text-base-content placeholder:text-base-content/40 outline-none leading-none w-0 opacity-0 p-0 sm:w-full sm:opacity-100"
        [placeholder]="placeholder()"
        [value]="query()"
        (input)="onInput($event)"
        (keydown)="onKeyDown($event)"
        aria-label="Search"
      />

      <!-- Clear Button -->
      @if (query()) {
        <button
          type="button"
          id="btn-clear-search"
          (mousedown)="$event.preventDefault()"
          (click)="clear($event)"
          class="btn btn-ghost btn-xs btn-circle shrink-0 text-base-content/50 hover:text-base-content"
          title="Clear search"
          aria-label="Clear search"
        >
          <svg lucideX class="w-3.5 h-3.5"></svg>
        </button>
      }
    </div>
  `,
})
export class SearchBoxComponent {
  placeholder = input<string>('Search...');

  query = signal<string>('');

  search = output<string>();

  inputRef = viewChild<ElementRef<HTMLInputElement>>('inputRef');

  onContainerMouseDown(event: MouseEvent): void {
    if (event.target !== this.inputRef()?.nativeElement) {
      event.preventDefault();
    }
  }

  focusInput(): void {
    this.inputRef()?.nativeElement.focus();
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.query.set(target.value);
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
    const inputEl = this.inputRef()?.nativeElement;
    const isCurrentlyFocused = inputEl ? document.activeElement === inputEl : false;
    this.query.set('');
    if (isCurrentlyFocused && inputEl) {
      inputEl.focus();
    }
  }
}
