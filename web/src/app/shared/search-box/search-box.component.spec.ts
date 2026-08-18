import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { SearchBoxComponent } from './search-box.component';

describe('SearchBoxComponent', () => {
  let component: SearchBoxComponent;
  let fixture: ComponentFixture<SearchBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBoxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create search box component with default state', () => {
    expect(component).toBeTruthy();
    expect(component.placeholder()).toBe('Search...');
    expect(component.query()).toBe('');
  });

  it('should update query signal on user input and emit search output with debounce', () => {
    vi.useFakeTimers();
    let emittedValue = '';
    component.search.subscribe((val) => {
      emittedValue = val;
    });

    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    inputEl.value = 'github';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.query()).toBe('github');
    expect(emittedValue).toBe(''); // Not emitted yet before debounce

    vi.advanceTimersByTime(300);
    expect(emittedValue).toBe('github');

    vi.useRealTimers();
  });

  it('should render clear button when query is present and immediately emit empty search on click', () => {
    let emittedValue = 'initial';
    component.search.subscribe((val) => {
      emittedValue = val;
    });

    component.query.set('test query');
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('#btn-clear-search') as HTMLButtonElement;
    expect(clearBtn).toBeTruthy();

    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    let focusCalled = false;
    inputEl.focus = () => {
      focusCalled = true;
    };

    clearBtn.click();
    fixture.detectChanges();

    expect(component.query()).toBe('');
    expect(emittedValue).toBe('');
    expect(focusCalled).toBe(false);
  });

  it('should maintain focus after clearing value if input was already focused', () => {
    component.query.set('test query');
    fixture.detectChanges();

    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    let focusCount = 0;
    inputEl.focus = () => {
      focusCount++;
    };

    // Simulate active element being input
    Object.defineProperty(document, 'activeElement', {
      value: inputEl,
      configurable: true,
    });

    const clearBtn = fixture.nativeElement.querySelector('#btn-clear-search') as HTMLButtonElement;
    clearBtn.click();
    fixture.detectChanges();

    expect(component.query()).toBe('');
    expect(focusCount).toBeGreaterThan(0);
  });

  it('should prevent default on mousedown for container/icon to avoid losing input focus', () => {
    const mouseEvent = new MouseEvent('mousedown', { cancelable: true });
    let defaultPrevented = false;
    mouseEvent.preventDefault = () => {
      defaultPrevented = true;
    };

    component.onContainerMouseDown(mouseEvent);
    expect(defaultPrevented).toBe(true);
  });

  it('should apply has-query class to container when query is non-empty', () => {
    const container = fixture.nativeElement.querySelector('.search-box-container') as HTMLDivElement;
    expect(container.classList.contains('has-query')).toBe(false);

    component.query.set('flutter');
    fixture.detectChanges();

    expect(container.classList.contains('has-query')).toBe(true);

    component.query.set('');
    fixture.detectChanges();

    expect(container.classList.contains('has-query')).toBe(false);
  });
});
