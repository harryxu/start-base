import { Directive, output, HostListener } from '@angular/core';

@Directive({
  selector: '[appLongPress]',
  standalone: true
})
export class LongPressDirective {
  // Emits the pointer event on successful long press
  longPress = output<PointerEvent>();

  private timeoutId: any;
  private startX = 0;
  private startY = 0;
  private readonly threshold = 8; // Max pixels pointer can move before cancelling long press

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    // Only trigger for primary pointer button (left-click/touch)
    if (event.button !== 0 && event.pointerType === 'mouse') return;

    this.startX = event.clientX;
    this.startY = event.clientY;

    this.clearTimeout();

    this.timeoutId = setTimeout(() => {
      this.longPress.emit(event);
      this.timeoutId = null;

      const cleanup = () => {
        document.removeEventListener('click', interceptClick, true);
        document.removeEventListener('pointerdown', cleanup, true);
      };

      // Register capturing click listener on document to intercept and cancel
      // the subsequent click event resulting from the release.
      const interceptClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        cleanup();
      };

      document.addEventListener('click', interceptClick, true);
      // Clean up if a new pointerdown occurs elsewhere on the document
      document.addEventListener('pointerdown', cleanup, true);
    }, 500); // 500ms long press delay
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (!this.timeoutId) return;

    const diffX = Math.abs(event.clientX - this.startX);
    const diffY = Math.abs(event.clientY - this.startY);

    // Cancel long press if the user moves too much (e.g., scrolls or drags)
    if (diffX > this.threshold || diffY > this.threshold) {
      this.clearTimeout();
    }
  }

  @HostListener('pointerup')
  @HostListener('pointercancel')
  @HostListener('pointerleave')
  onPointerUp(): void {
    this.clearTimeout();
  }

  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
