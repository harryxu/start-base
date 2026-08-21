import { CdkContextMenuTrigger, CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import { Component, computed, inject, input, output, signal, ViewChild } from '@angular/core';
import { LucideGlobe, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { LongPressDirective } from '../long-press.directive';

import { API_BASE } from '../../core/api/api.service';
import type { Site, SiteViewMode } from '../../core/models/types';
import { GlobalMenuService } from '../../core/services/global-menu.service';
import { ConfigService } from '../../core/services/config.service';

@Component({
  selector: 'app-site-card',
  standalone: true,
  imports: [
    CdkMenu,
    CdkMenuItem,
    CdkContextMenuTrigger,
    LongPressDirective,
    LucideGlobe,
    LucidePencil,
    LucideTrash2,
  ],
  templateUrl: './site-card.component.html',
  styleUrl: './site-card.component.css',
})
export class SiteCardComponent {
  configService = inject(ConfigService);
  site = input.required<Site>();
  isFetching = input<boolean>(false);
  view_mode = input<SiteViewMode>('full');

  editSite = output<Site>();
  deleteSite = output<Site>();

  @ViewChild(CdkContextMenuTrigger) triggerMenu?: CdkContextMenuTrigger;

  isMenuOpen = signal(false);

  private globalMenuService = inject(GlobalMenuService);

  /** CSS modifier class added to the root element (e.g. 'size_1_1', 'size_2_1'). */
  sizeClass = computed(() => `size_${this.site().col_span || 1}_${this.site().row_span || 1}`);

  /** Key identifying the card dimensions ('1x1', '2x1', etc.). */
  sizeKey = computed(() => `${this.site().col_span || 1}x${this.site().row_span || 1}`);

  showDescription = computed(() => {
    return this.sizeKey() !== '1x1' && !!this.site().description?.trim();
  });

  openContextMenu(event: PointerEvent): void {
    if (this.configService.isReadOnly()) return;
    this.globalMenuService.registerOpenedMenu(() => this.closeMenu());
    this.triggerMenu?.open({ x: event.clientX, y: event.clientY });
  }

  onContextMenuOpened(): void {
    if (this.configService.isReadOnly()) return;
    this.globalMenuService.registerOpenedMenu(() => this.closeMenu());
    this.isMenuOpen.set(true);
  }

  onContextMenuClosed(): void {
    this.isMenuOpen.set(false);
  }

  closeMenu(): void {
    this.triggerMenu?.close();
  }

  private iconFailed = signal(false);

  showSkeleton = computed(() => {
    return this.isFetching();
  });

  hasIcon = computed(() => {
    if (this.showSkeleton()) return false;
    if (this.iconFailed()) return false;
    const url = this.site().icon_url;
    return !!url && url.trim().length > 0;
  });

  iconUrl = computed(() => {
    const url = this.site().icon_url;
    if (!url) return '';
    if (url.startsWith('/')) {
      return `${API_BASE}${url}`;
    }
    return url;
  });

  displayTitle = computed(() => {
    if (this.site().title) return this.site().title!;
    try {
      return new URL(this.site().url).hostname.replace(/^www\./, '');
    } catch {
      return this.site().url;
    }
  });

  tooltip = computed(() => {
    const title = this.displayTitle();
    const desc = this.site().description?.trim();
    return desc ? `${title}\n${desc}` : title;
  });

  onIconError(): void {
    if (!this.iconFailed()) {
      this.iconFailed.set(true);
    }
  }
}
