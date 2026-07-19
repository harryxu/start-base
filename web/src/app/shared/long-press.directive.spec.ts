import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LongPressDirective } from './long-press.directive';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

@Component({
  standalone: true,
  imports: [LongPressDirective],
  template: `
    <div id="test-element" appLongPress (longPress)="onLongPress($event)">
      Test Content
    </div>
  `,
})
class TestHostComponent {
  longPressed = false;
  lastEvent?: PointerEvent;

  onLongPress(event: PointerEvent): void {
    this.longPressed = true;
    this.lastEvent = event;
  }
}

describe('LongPressDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let element: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    element = fixture.nativeElement.querySelector('#test-element');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should emit longPress event after holding pointerdown for 500ms', () => {
    const event = new PointerEvent('pointerdown', { clientX: 100, clientY: 100, button: 0 });
    element.dispatchEvent(event);

    expect(hostComponent.longPressed).toBe(false);

    vi.advanceTimersByTime(500);

    expect(hostComponent.longPressed).toBe(true);
    expect(hostComponent.lastEvent?.clientX).toBe(100);
  });

  it('should cancel longPress if pointer moves beyond threshold', () => {
    const downEvent = new PointerEvent('pointerdown', { clientX: 100, clientY: 100, button: 0 });
    element.dispatchEvent(downEvent);

    vi.advanceTimersByTime(200);

    const moveEvent = new PointerEvent('pointermove', { clientX: 120, clientY: 100 });
    element.dispatchEvent(moveEvent);

    vi.advanceTimersByTime(400);

    expect(hostComponent.longPressed).toBe(false);
  });

  it('should cancel longPress if pointerup occurs before 500ms', () => {
    const downEvent = new PointerEvent('pointerdown', { clientX: 100, clientY: 100, button: 0 });
    element.dispatchEvent(downEvent);

    vi.advanceTimersByTime(200);

    const upEvent = new PointerEvent('pointerup');
    element.dispatchEvent(upEvent);

    vi.advanceTimersByTime(400);

    expect(hostComponent.longPressed).toBe(false);
  });

  it('should intercept and block click event following a longPress', () => {
    const downEvent = new PointerEvent('pointerdown', { clientX: 100, clientY: 100, button: 0 });
    element.dispatchEvent(downEvent);

    vi.advanceTimersByTime(500);

    expect(hostComponent.longPressed).toBe(true);

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

    element.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});
