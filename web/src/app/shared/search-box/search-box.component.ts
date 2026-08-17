import {
  Component,
  ElementRef,
  computed,
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
  template: `
    <!-- Search box container -->
    <div [class]="containerClasses()" (click)="focusInput()">
      <!-- Search Icon -->
      <svg
        lucideSearch
        class="w-4 h-4 shrink-0 transition-colors duration-200"
        [class.text-base-content/40]="!isFocused()"
        [class.text-primary]="isFocused()"
      ></svg>

      <!-- Input Field -->
      <input
        #inputRef
        type="text"
        id="search-input"
        [class]="inputClasses()"
        [placeholder]="placeholder()"
        [value]="query()"
        (focus)="onFocus()"
        (blur)="onBlur()"
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

      <!-- ESC Hint Badge when focused -->
      @if (isFocused()) {
        <kbd
          class="kbd kbd-xs bg-base-200/70 text-base-content/50 font-mono text-[10px] px-1 hidden sm:inline-flex items-center shrink-0 select-none"
          >ESC</kbd
        >
      }
    </div>
  `,
})
export class SearchBoxComponent {
  placeholder = input<string>('Search...');

  query = signal<string>('');
  isFocused = signal<boolean>(false);

  search = output<string>();

  inputRef = viewChild<ElementRef<HTMLInputElement>>('inputRef');

  containerClasses = computed(() => {
    if (this.isFocused()) {
      return 'absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-start px-2.5 gap-2 rounded-lg border border-primary ring-2 ring-primary/20 bg-base-100 shadow-md transition-all duration-200 cursor-text';
    }
    return 'w-full h-full flex items-center justify-center px-0 gap-0 sm:justify-start sm:px-2.5 sm:gap-2 rounded-lg border border-base-content/20 bg-base-100/50 hover:border-base-content/35 transition-all duration-200 cursor-text';
  });

  inputClasses = computed(() => {
    if (this.isFocused()) {
      return 'w-full min-w-0 bg-transparent text-xs sm:text-sm text-base-content placeholder:text-base-content/40 outline-none leading-none opacity-100';
    }
    return 'min-w-0 bg-transparent text-xs sm:text-sm text-base-content placeholder:text-base-content/40 outline-none leading-none w-0 opacity-0 p-0 sm:w-full sm:opacity-100';
  });

  focusInput(): void {
    this.inputRef()?.nativeElement.focus();
  }

  onFocus(): void {
    this.isFocused.set(true);
  }

  onBlur(): void {
    this.isFocused.set(false);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.query.set(target.value);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isFocused.set(false);
      this.inputRef()?.nativeElement.blur();
    }
  }

  clear(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.query.set('');
    this.inputRef()?.nativeElement.focus();
  }
}
