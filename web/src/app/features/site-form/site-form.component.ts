import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { LucideGlobe, LucideLink, LucidePuzzle, LucideUpload, LucideX } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

import { ApiService, API_BASE } from '../../core/api/api.service';
import type { Site, SiteType } from '../../core/models/types';
import { SITE_SIZES } from '../../core/models/types';
import { BoardService } from '../../core/services/board.service';
import { parsePluginMeta } from '../../core/utils/plugin.utils';

@Component({
  selector: 'app-site-form',
  standalone: true,
  imports: [FormsModule, CdkTrapFocus, LucideX, LucideGlobe, LucideUpload, LucideLink, LucidePuzzle],
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
          <div class="flex items-center gap-2">
            @if (isPluginMode()) {
              <svg lucidePuzzle class="w-4 h-4 text-primary"></svg>
            } @else {
              <svg lucideLink class="w-4 h-4 text-primary"></svg>
            }
            <h2 class="text-sm font-semibold">
              {{ site() ? (isPluginMode() ? 'Edit Plugin' : 'Edit Site') : (isPluginMode() ? 'Add Plugin' : 'Add Site') }}
            </h2>
          </div>
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
          <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            @if (uploadError()) {
              <div class="alert alert-error text-xs p-2.5 rounded-lg flex items-center justify-between">
                <span>{{ uploadError() }}</span>
                <button type="button" class="btn btn-ghost btn-xs btn-square" (click)="uploadError.set('')">
                  <svg lucideX class="w-3.5 h-3.5"></svg>
                </button>
              </div>
            }

            @if (isPluginMode()) {
              <!-- Plugin Mode Form -->

              <!-- URL (required) -->
              <label class="floating-label w-full text-base-content/60">
                <input
                  id="site-url"
                  type="url"
                  [(ngModel)]="formUrl"
                  name="url"
                  required
                  placeholder="Plugin URL"
                  class="input input-bordered input-lg w-full text-base-content"
                  autocomplete="off"
                />
                <span>Plugin URL <span class="text-error">*</span></span>
              </label>

              <!-- Plugin Type Selector -->
              <div class="flex flex-col gap-1.5">
                <span class="text-xs text-base-content/60 pl-1">Plugin Type</span>
                <div class="join w-full grid grid-cols-2">
                  <input
                    type="radio"
                    name="plugin-type"
                    class="join-item btn btn-sm"
                    aria-label="Web Component"
                    [checked]="formPluginType === 'webcomponent'"
                    (change)="formPluginType = 'webcomponent'"
                  />
                  <input
                    type="radio"
                    name="plugin-type"
                    class="join-item btn btn-sm"
                    aria-label="iframe"
                    [checked]="formPluginType === 'iframe'"
                    (change)="formPluginType = 'iframe'"
                  />
                </div>
              </div>

              <!-- Title (optional) -->
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

              <!-- Description (optional) -->
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

              <!-- Plugin Parameters (textarea) -->
              <label class="floating-label w-full text-base-content/60">
                <textarea
                  id="site-plugin-params"
                  [(ngModel)]="formPluginParams"
                  name="pluginParams"
                  placeholder="param1=abc&#10;param2=xxx&#10;param3=vvvv"
                  rows="3"
                  class="textarea textarea-bordered w-full text-base-content font-mono text-xs leading-relaxed"
                ></textarea>
                <span>Plugin Parameters (Key=Value per line)</span>
              </label>

              <!-- Declared API URLs (from JS Metadata) -->
              @if (apiUrls().length > 0) {
                <div class="bg-base-200/50 p-2.5 rounded-lg flex flex-col gap-1.5 text-xs border border-base-200">
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-base-content/70">Declared API URLs (Network Proxy)</span>
                    <span class="badge badge-xs badge-primary text-[9px]">{{ apiUrls().length }}</span>
                  </div>
                  <div class="flex flex-wrap gap-1">
                    @for (u of apiUrls(); track u) {
                      <span class="badge badge-sm badge-neutral font-mono text-[10px]">{{ u }}</span>
                    }
                  </div>
                </div>
              }

              <!-- Allow LAN / Private Network Access -->
              <div class="bg-base-200/40 p-3 rounded-lg border border-base-200">
                <label class="label cursor-pointer flex items-center justify-between p-0">
                  <div class="flex flex-col pr-2">
                    <span class="label-text font-medium text-xs">Allow LAN / Private Network Access</span>
                    <span class="text-[10px] text-base-content/60 leading-tight mt-0.5">
                      Enable this plugin to proxy requests to private/local devices (Homelab).
                    </span>
                  </div>
                  <input
                    id="site-allow-lan"
                    type="checkbox"
                    class="checkbox checkbox-sm checkbox-primary"
                    [(ngModel)]="formAllowLan"
                    name="allowLan"
                  />
                </label>
              </div>

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

              <!-- Card size selector -->
              <div class="flex flex-col gap-1.5">
                <span class="text-xs text-base-content/60 pl-1">Card Size</span>
                <div class="join w-full grid grid-cols-4">
                  @for (size of siteSizes; track size.key) {
                    <input
                      type="radio"
                      name="card-size"
                      class="join-item btn btn-sm"
                      [attr.aria-label]="size.label"
                      [checked]="formColSpan === size.col && formRowSpan === size.row"
                      (change)="formColSpan = size.col; formRowSpan = size.row"
                    />
                  }
                </div>
              </div>
            } @else {
              <!-- Regular Site Mode Form -->

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

              <!-- Card size selector -->
              <div class="flex flex-col gap-1.5">
                <span class="text-xs text-base-content/60 pl-1">Card Size</span>
                <div class="join w-full grid grid-cols-4">
                  @for (size of siteSizes; track size.key) {
                    <input
                      type="radio"
                      name="card-size"
                      class="join-item btn btn-sm"
                      [attr.aria-label]="size.label"
                      [checked]="formColSpan === size.col && formRowSpan === size.row"
                      (change)="formColSpan = size.col; formRowSpan = size.row"
                    />
                  }
                </div>
              </div>
            }
          </div>

          <!-- Footer actions -->
          <div class="modal-action px-6 py-3 border-t border-base-200 bg-base-100 shrink-0 mt-0 flex items-center justify-between">
            <!-- Left side: Plugin Mode Checkbox -->
            <label class="label cursor-pointer flex items-center gap-2 select-none py-0">
              <input
                id="plugin-mode-checkbox"
                type="checkbox"
                class="checkbox checkbox-sm checkbox-primary"
                [ngModel]="isPluginMode()"
                (ngModelChange)="togglePluginMode($event)"
                name="pluginMode"
              />
              <span class="label-text text-sm font-medium text-base-content/80">Plugin Mode</span>
            </label>

            <!-- Right side: Cancel & Submit buttons -->
            <div class="flex items-center gap-2">
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
  formColSpan = 1;
  formRowSpan = 1;
  formPluginType: 'webcomponent' | 'iframe' = 'webcomponent';
  formPluginParams = '';
  formAllowLan = false;

  isPluginMode = signal(false);

  readonly siteSizes = SITE_SIZES;

  apiUrls = computed(() => {
    const meta = parsePluginMeta(this.site()?.plugin_meta);
    return (meta?.['api_urls'] as string[]) || [];
  });

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
    return !this.isPluginMode() && !!url && url.trim().length > 0;
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
        this.formColSpan = s.col_span ?? 1;
        this.formRowSpan = s.row_span ?? 1;
        const isPlugin = s.site_type === 'iframe' || s.site_type === 'webcomponent';
        this.isPluginMode.set(isPlugin);
        this.formPluginType = s.site_type === 'iframe' ? 'iframe' : 'webcomponent';
        this.formPluginParams = s.plugin_params ?? '';
        this.formAllowLan = s.allow_lan ?? false;
      } else if (def) {
        this.formUrl = def.url ?? '';
        this.formTitle = def.title ?? '';
        this.formIconUrl = def.icon_url ?? '';
        this.formDescription = def.description ?? '';
        this.formGroupId = def.group_id ?? null;
        this.formColSpan = def.col_span ?? 1;
        this.formRowSpan = def.row_span ?? 1;
        const isPlugin = def.site_type === 'iframe' || def.site_type === 'webcomponent';
        this.isPluginMode.set(isPlugin);
        this.formPluginType = def.site_type === 'iframe' ? 'iframe' : 'webcomponent';
        this.formPluginParams = def.plugin_params ?? '';
        this.formAllowLan = def.allow_lan ?? false;
      } else {
        this.formUrl = '';
        this.formTitle = '';
        this.formIconUrl = '';
        this.formDescription = '';
        this.formGroupId = null;
        this.formColSpan = 1;
        this.formRowSpan = 1;
        this.isPluginMode.set(false);
        this.formPluginType = 'webcomponent';
        this.formPluginParams = '';
        this.formAllowLan = false;
      }
    });
  }

  togglePluginMode(enabled: boolean): void {
    this.isPluginMode.set(enabled);
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

    const isPlugin = this.isPluginMode();

    if (!isPlugin && this.selectedIconFile) {
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
      icon_url: isPlugin ? null : (this.formIconUrl.trim() || null),
      description: this.formDescription.trim() || null,
      group_id: this.formGroupId,
      col_span: this.formColSpan,
      row_span: this.formRowSpan,
      site_type: (isPlugin ? this.formPluginType : 'builtin') as SiteType,
      plugin_params: isPlugin ? (this.formPluginParams.trim() || null) : null,
      allow_lan: isPlugin ? this.formAllowLan : false,
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

