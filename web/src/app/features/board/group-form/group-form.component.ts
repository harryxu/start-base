import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { LucideFolder, LucideUpload, LucideX } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import { ApiService, API_BASE } from '../../../core/api/api.service';
import type { Group, SiteViewMode } from '../../../core/models/types';
import { BoardService } from '../../../core/services/board.service';

@Component({
  selector: 'app-group-form',
  standalone: true,
  imports: [FormsModule, CdkTrapFocus, LucideX, LucideFolder, LucideUpload],
  template: `
    <!-- DaisyUI modal (modal-open keeps it visible while rendered) -->
    <div
      class="modal modal-open modal-middle p-4"
      role="dialog"
      aria-modal="true"
      cdkTrapFocus
      [cdkTrapFocusAutoCapture]="true"
      [attr.aria-label]="group() ? 'Edit Group' : 'Add Group'"
    >
      <div class="modal-box max-w-md p-0 flex flex-col max-h-[90vh] my-auto">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-base-200 shrink-0">
          <h2 class="text-sm font-semibold">
            {{ group() ? 'Edit Group' : 'Add Group' }}
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
        <form id="group-form" (ngSubmit)="onSubmit()" class="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
            @if (uploadError()) {
              <div
                class="alert alert-error text-xs p-2.5 rounded-lg flex items-center justify-between"
              >
                <span>{{ uploadError() }}</span>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-square"
                  (click)="uploadError.set('')"
                >
                  <svg lucideX class="w-3.5 h-3.5"></svg>
                </button>
              </div>
            }

            <!-- Name (required) -->
            <label class="floating-label w-full text-base-content/60">
              <input
                id="group-name"
                type="text"
                [(ngModel)]="formName"
                name="name"
                required
                placeholder="Group Name"
                class="input input-bordered input-lg w-full text-base-content"
                autocomplete="off"
                #nameInput
              />
              <span>Group Name <span class="text-error">*</span></span>
            </label>

            <!-- Icon URL -->
            <div class="join w-full flex items-stretch">
              <label
                class="floating-label input input-bordered input-lg join-item flex-1 flex items-center gap-2 text-base-content/60"
              >
                @if (previewUrl()) {
                  <img
                    [src]="previewUrl()"
                    alt="Group icon"
                    class="w-5 h-5 rounded object-contain shrink-0"
                    (error)="onIconError()"
                  />
                } @else if (group()) {
                  @if (hasDbIcon() && !iconFailed()) {
                    <img
                      [src]="dbIconUrl()"
                      alt="Group icon"
                      class="w-5 h-5 rounded object-contain shrink-0"
                      (error)="onIconError()"
                    />
                  } @else {
                    <svg lucideFolder class="w-5 h-5 opacity-70 shrink-0"></svg>
                  }
                }
                <input
                  id="group-icon"
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

            <!-- Site View Mode -->
            <label class="floating-label w-full text-base-content/60">
              <select
                id="group-site-view-mode"
                [(ngModel)]="formSiteViewMode"
                name="siteViewMode"
                class="select select-bordered select-lg w-full text-base-content"
              >
                <option value="">Follow Global</option>
                <option value="full">Icon and Text</option>
                <option value="icon">Icon Only</option>
                <option value="text">Text Only</option>
              </select>
              <span>Site View Mode</span>
            </label>

            <!-- Site Border -->
            <label class="floating-label w-full text-base-content/60">
              <select
                id="group-site-border"
                [(ngModel)]="formSiteBorder"
                name="siteBorder"
                class="select select-bordered select-lg w-full text-base-content"
              >
                <option value="">Follow Global</option>
                <option value="1">Show Border</option>
                <option value="0">Hide Border</option>
              </select>
              <span>Site Border</span>
            </label>
          </div>

          <!-- Footer actions -->
          <div class="modal-action px-6 py-3 border-t border-base-200 bg-base-100 shrink-0 mt-0 flex justify-end gap-2">
            <button type="button" class="btn btn-ghost btn-sm" (click)="closed.emit()">
              Cancel
            </button>
            <button
              id="group-form-submit"
              type="submit"
              class="btn btn-primary btn-sm"
              [disabled]="!formName.trim() || isUploading()"
            >
              {{ group() ? 'Save changes' : 'Add group' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class GroupFormComponent {
  private api = inject(ApiService);
  private boardService = inject(BoardService);

  group = input<Group | null>(null);

  closed = output<void>();

  // Bound form fields
  formName = '';
  formIconUrl = '';
  formSiteViewMode: SiteViewMode | '' = '';
  formSiteBorder = '';

  iconFailed = signal(false);
  selectedIconFile: File | null = null;
  selectedFileName = signal<string>('');
  previewUrl = signal<string>('');
  isUploading = signal<boolean>(false);
  uploadError = signal<string>('');

  dbIconUrl = computed(() => {
    const url = this.group()?.icon_url;
    if (!url) return '';
    if (url.startsWith('/')) {
      return `${API_BASE}${url}`;
    }
    return url;
  });

  hasDbIcon = computed(() => {
    const url = this.group()?.icon_url;
    return !!url && url.trim().length > 0;
  });

  constructor() {
    effect(() => {
      const g = this.group();
      this.iconFailed.set(false);
      this.selectedIconFile = null;
      this.selectedFileName.set('');
      this.previewUrl.set('');
      this.isUploading.set(false);
      this.uploadError.set('');

      if (g) {
        this.formName = g.name;
        this.formIconUrl = g.icon_url ?? '';
        this.formSiteViewMode = g.site_view_mode ?? '';
        this.formSiteBorder = g.site_border ?? '';
      } else {
        this.formName = '';
        this.formIconUrl = '';
        this.formSiteViewMode = '';
        this.formSiteBorder = '';
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
    const trimmedName = this.formName.trim();
    if (!trimmedName) return;

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
        const errorMessage =
          (err as { error?: { detail?: string } })?.error?.detail || 'Failed to upload icon file.';
        this.uploadError.set(errorMessage);
        this.isUploading.set(false);
        return;
      } finally {
        this.isUploading.set(false);
      }
    }

    const payload: Partial<Group> = {
      name: trimmedName,
      icon_url: this.formIconUrl.trim() || null,
      site_view_mode: this.formSiteViewMode,
      site_border: this.formSiteBorder,
    };

    const editingGroup = this.group();
    if (editingGroup) {
      this.boardService.updateGroup(editingGroup.id, payload);
    } else {
      this.boardService.saveNewGroup(payload);
    }

    this.closed.emit();
  }
}
