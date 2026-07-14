import { Component, computed, input, output, signal } from '@angular/core';
import { LucidePencil, LucideTrash2 } from '@lucide/angular';

import type { Site } from '../../core/models/types';

@Component({
  selector: 'app-site-card',
  standalone: true,
  imports: [LucidePencil, LucideTrash2],
  template: `
    <div class="site-card">
      @if (!editMode()) {
        <!-- View mode: clickable link -->
        <a
          [href]="site().url"
          target="_blank"
          rel="noopener noreferrer"
          class="site-link"
          [title]="site().url"
        >
          <img
            [src]="iconUrl()"
            [alt]="displayTitle()"
            class="site-icon"
            width="32"
            height="32"
            (error)="onIconError()"
          />
          <span class="site-title">{{ displayTitle() }}</span>
        </a>
      } @else {
        <!-- Edit mode: static card with hover controls -->
        <div class="site-link-static" [title]="site().url">
          <img
            [src]="iconUrl()"
            [alt]="displayTitle()"
            class="site-icon"
            width="32"
            height="32"
            (error)="onIconError()"
          />
          <span class="site-title">{{ displayTitle() }}</span>
          <!-- Hover controls -->
          <div class="edit-controls">
            <button
              (click)="editSite.emit(site())"
              class="ctrl-btn"
              title="Edit site"
            >
              <svg lucidePencil class="w-3 h-3"></svg>
            </button>
            <button
              (click)="deleteSite.emit(site())"
              class="ctrl-btn ctrl-btn-danger"
              title="Delete site"
            >
              <svg lucideTrash2 class="w-3 h-3"></svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .site-card {
        position: relative;
        width: 72px;
        flex-shrink: 0;
      }

      .site-link,
      .site-link-static {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 8px 4px 6px;
        border-radius: 10px;
        text-decoration: none;
        width: 100%;
        text-align: center;
        position: relative;
        cursor: pointer;
      }

      .site-link:hover {
        background: #f3f4f6;
      }

      .site-icon {
        width: 32px;
        height: 32px;
        border-radius: 7px;
        object-fit: contain;
        flex-shrink: 0;
      }

      .site-title {
        font-size: 11px;
        line-height: 1.3;
        color: #6b7280;
        max-width: 66px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Edit mode hover controls */
      .edit-controls {
        position: absolute;
        top: 2px;
        right: 2px;
        display: flex;
        gap: 2px;
        opacity: 0;
        transition: opacity 0.15s ease;
        pointer-events: none;
      }

      .site-link-static:hover .edit-controls {
        opacity: 1;
        pointer-events: auto;
      }

      .ctrl-btn {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        cursor: pointer;
        color: #9ca3af;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        transition: color 0.1s, border-color 0.1s;
      }

      .ctrl-btn:hover {
        color: #374151;
      }

      .ctrl-btn-danger:hover {
        color: #ef4444;
        border-color: #fca5a5;
      }
    `,
  ],
})
export class SiteCardComponent {
  site = input.required<Site>();
  editMode = input<boolean>(false);

  editSite = output<Site>();
  deleteSite = output<Site>();

  private iconFailed = signal(false);

  iconUrl = computed(() => {
    if (this.iconFailed()) {
      return this.googleFavicon();
    }
    return this.site().icon_url || this.googleFavicon();
  });

  displayTitle = computed(() => {
    if (this.site().title) return this.site().title!;
    try {
      return new URL(this.site().url).hostname.replace(/^www\./, '');
    } catch {
      return this.site().url;
    }
  });

  private googleFavicon(): string {
    try {
      const { hostname } = new URL(this.site().url);
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch {
      return '';
    }
  }

  onIconError(): void {
    if (!this.iconFailed()) {
      this.iconFailed.set(true);
    }
  }
}
