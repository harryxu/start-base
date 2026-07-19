import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GlobalMenuService {
  private activeCloseFn: (() => void) | null = null;

  /**
   * Registers a newly opened menu.
   * Closes any previously opened menu across the entire application.
   */
  registerOpenedMenu(closeFn: () => void): void {
    if (this.activeCloseFn && this.activeCloseFn !== closeFn) {
      try {
        this.activeCloseFn();
      } catch {
        // Ignore if already closed
      }
    }
    this.activeCloseFn = closeFn;
  }

  /**
   * Closes any currently active menu in the application.
   */
  closeAll(): void {
    if (this.activeCloseFn) {
      try {
        this.activeCloseFn();
      } catch {
        // Ignore if already closed
      }
      this.activeCloseFn = null;
    }
  }
}
