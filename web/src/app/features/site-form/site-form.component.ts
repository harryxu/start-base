import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { LucideGlobe, LucideUpload, LucideX } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import { ApiService, API_BASE } from '../../core/api/api.service';
import type { Site } from '../../core/models/types';
import { BoardService } from '../../core/services/board.service';

@Component({
  selector: 'app-site-form',
  standalone: true,
  imports: [FormsModule, CdkTrapFocus, LucideX, LucideGlobe, LucideUpload],
  template: `
    <!-- DaisyUI modal (modal-open keeps it visible while rendered) -->
    <div
      class="modal modal-open modal-middle p-4"
      role="dialog"
      aria-modal="true"
      cdkTrapFocus
      [cdkTrapFocusAutoCapture]="true"
      [attr.aria-label]="site() ? 'Edit Site' : 'Add Site'"
    >
      <div class="modal-box max-w-md p-0 flex flex-col max-h-[90vh] my-auto">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-base-200 shrink-0">
          <h2 class="text-sm font-semibold">
            {{ site() ? 'Edit Site' : 'Add Site' }}
          </h2>
          <button
            class="btn btn-ghost btn-sm btn-square"
            (click)="closed.emit()"
            aria-label="Close"
          >
            <svg lucideX class="w-4 h-4"></svg>
          </button>
        </div>

        <!-- Form body -->
        <form id="site-form" (ngSubmit)="onSubmit()" class="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
            @if (uploadError()) {
              <div class="alert alert-error text-xs p-2.5 rounded-lg flex items-center justify-between">
                <span>{{ uploadError() }}</span>
                <button type="button" class="btn btn-ghost btn-xs btn-square" (click)="uploadError.set('')">
                  <svg lucideX class="w-3.5 h-3.5"></svg>
                </button>
              </div>
            }

            <!-- URL (required) -->
            <label class="floating-label w-full text-base-content/60">
              <input
                id="site-url"
                type="url"
                [(ngModel)]="formUrl"
                name="url"
                required
                placeholder="URL"
                class="input input-bordered input-lg w-full text-base-content"
                autocomplete="off"
              />
              <span>URL <span class="text-error">*</span></span>
            </label>

            <!-- Title -->
            <label class="floating-label w-full text-base-content/60">
              <input
                id="site-title"
                type="text"
                [(ngModel)]="formTitle"
                name="title"
                placeholder="Title"
                class="input input-bordered input-lg w-full text-base-content"
                autocomplete="off"
              />
              <span>Title</span>
            </label>

            <!-- Icon URL -->
            <div class="join w-full flex items-stretch">
              <label
                class="floating-label input input-bordered input-lg join-item flex-1 flex items-center gap-2 text-base-content/60"
              >
                @if (previewUrl()) {
                  <img
                    [src]="previewUrl()"
                    alt="Site icon"
                    class="w-5 h-5 rounded object-contain shrink-0"
                    (error)="onIconError()"
                  />
                } @else if (site()) {
                  @if (hasDbIcon() && !iconFailed()) {
                    <img
                      [src]="dbIconUrl()"
                      alt="Site icon"
                      class="w-5 h-5 rounded object-contain shrink-0"
                      (error)="onIconError()"
                    />
                  } @else {
                    <svg lucideGlobe class="w-5 h-5 opacity-70 shrink-0"></svg>
                  }
                }
                <input
                  id="site-icon"
                  type="url"
                  [(ngModel)]="formIconUrl"
                  name="iconUrl"
                  placeholder="Icon URL"
                  class="grow text-base-content"
                />
                <span>Icon URL</span>
              </label>

              <input
                #fileInput
                type="file"
                accept="image/*"
                class="hidden"
                (change)="onFileSelected($event)"
              />
              <button
                type="button"
                class="btn btn-lg join-item shrink-0 self-stretch flex items-center justify-center px-4 min-h-0 h-auto"
                (click)="fileInput.click()"
                [title]="selectedFileName() ? selectedFileName() : 'Upload icon'"
                aria-label="Upload icon"
              >
                @if (isUploading()) {
                  <span class="loading loading-spinner loading-xs"></span>
                } @else {
                  <svg lucideUpload class="w-5 h-5"></svg>
                }
              </button>
            </div>

            <!-- Description -->
            <label class="floating-label w-full text-base-content/60">
              <input
                id="site-desc"
                type="text"
                [(ngModel)]="formDescription"
                name="description"
                placeholder="Description"
                class="input input-bordered input-lg w-full text-base-content"
              />
              <span>Description</span>
            </label>

            <!-- Group select -->
            <label class="floating-label w-full text-base-content/60">
              <select
                id="site-group"
                [(ngModel)]="formGroupId"
                name="group"
                class="select select-bordered select-lg w-full text-base-content"
              >
                <option [ngValue]="null">No group</option>
                @for (g of groups(); track g.id) {
                  <option [ngValue]="g.id">{{ g.name }}</option>
                }
              </select>
              <span>Group</span>
            </label>
          </div>

          <!-- Footer actions -->
          <div class="modal-action px-6 py-3 border-t border-base-200 bg-base-100 shrink-0 mt-0 flex justify-end gap-2">
            <button type="button" class="btn btn-ghost btn-sm" (click)="closed.emit()">
              Cancel
            </button>
            <button
              id="site-form-submit"
              type="submit"
              class="btn btn-primary btn-sm"
              [disabled]="!formUrl || isUploading()"
            >
              {{ site() ? 'Save changes' : 'Add site' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class SiteFormComponent {
  private api = inject(ApiService);
  private boardService = inject(BoardService);

  site = input<Site | null>(null);
  defaults = input<Partial<Site> | null>(null);

  groups = computed(() => this.boardService.boardQuery.data()?.groups ?? []);

  closed = output<void>();
  cancelled = this.closed;

  // Bound form fields
  formUrl = '';
  formTitle = '';
  formIconUrl = '';
  formDescription = '';
  formGroupId: number | null = null;

  iconFailed = signal(false);
  selectedIconFile: File | null = null;
  selectedFileName = signal<string>('');
  previewUrl = signal<string>('');
  isUploading = signal<boolean>(false);
  uploadError = signal<string>('');

  dbIconUrl = computed(() => {
    const url = this.site()?.icon_url;
    if (!url) return '';
    if (url.startsWith('/')) {
      return `${API_BASE}${url}`;
    }
    return url;
  });

  hasDbIcon = computed(() => {
    const url = this.site()?.icon_url;
    return !!url && url.trim().length > 0;
  });

  constructor() {
    effect(() => {
      const s = this.site();
      const def = this.defaults();
      this.iconFailed.set(false);
      this.selectedIconFile = null;
      this.selectedFileName.set('');
      this.previewUrl.set('');
      this.isUploading.set(false);
      this.uploadError.set('');

      if (s) {
        this.formUrl = s.url;
        this.formTitle = s.title ?? '';
        this.formIconUrl = s.icon_url ?? '';
        this.formDescription = s.description ?? '';
        this.formGroupId = s.group_id;
      } else if (def) {
        this.formUrl = def.url ?? '';
        this.formTitle = def.title ?? '';
        this.formIconUrl = def.icon_url ?? '';
        this.formDescription = def.description ?? '';
        this.formGroupId = def.group_id ?? null;
      } else {
        this.formUrl = '';
        this.formTitle = '';
        this.formIconUrl = '';
        this.formDescription = '';
        this.formGroupId = null;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const validExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp', '.avif'];
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      const isValidImage = file.type.startsWith('image/') || validExts.includes(ext);

      if (!isValidImage) {
        this.uploadError.set('Please select a valid image file (.png, .jpg, .svg, .webp, .ico).');
        input.value = '';
        return;
      }

      this.uploadError.set('');
      this.selectedIconFile = file;
      this.selectedFileName.set(file.name);
      this.previewUrl.set(URL.createObjectURL(file));
      this.formIconUrl = file.name;
    }
  }

  onIconError(): void {
    this.iconFailed.set(true);
  }

  async onSubmit(): Promise<void> {
    if (!this.formUrl) return;

    if (this.selectedIconFile) {
      this.isUploading.set(true);
      this.uploadError.set('');
      try {
        const res = await firstValueFrom(this.api.uploadImage(this.selectedIconFile, 'icons'));
        if (res && res.url) {
          this.formIconUrl = res.url;
        }
      } catch (err: unknown) {
        console.error('Failed to upload icon:', err);
        const errorMessage = (err as { error?: { detail?: string } })?.error?.detail || 'Failed to upload icon file.';
        this.uploadError.set(errorMessage);
        this.isUploading.set(false);
        return;
      } finally {
        this.isUploading.set(false);
      }
    }

    const payload: Partial<Site> = {
      url: this.formUrl.trim(),
      title: this.formTitle.trim() || null,
      icon_url: this.formIconUrl.trim() || null,
      description: this.formDescription.trim() || null,
      group_id: this.formGroupId,
    };

    const editingSite = this.site();
    if (editingSite) {
      this.boardService.updateSite(editingSite.id, payload);
    } else {
      this.boardService.saveNewSite(payload);
    }

    this.closed.emit();
  }
}
