import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';
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
    expect(component.isFocused()).toBe(false);
  });

  it('should update isFocused state on focus and blur events', () => {
    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    inputEl.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(component.isFocused()).toBe(true);

    inputEl.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(component.isFocused()).toBe(false);
  });

  it('should update query signal on user input', () => {
    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    inputEl.value = 'github';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.query()).toBe('github');
  });

  it('should render clear button when query is present and clear value on click', () => {
    component.query.set('test query');
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('#btn-clear-search') as HTMLButtonElement;
    expect(clearBtn).toBeTruthy();

    clearBtn.click();
    fixture.detectChanges();

    expect(component.query()).toBe('');
  });

  it('should blur input and reset focus state when Escape key is pressed', () => {
    const inputEl = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    inputEl.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(component.isFocused()).toBe(true);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    inputEl.dispatchEvent(escapeEvent);
    fixture.detectChanges();

    expect(component.isFocused()).toBe(false);
  });
});
