import { CdkContextMenuTrigger, CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import { Component, computed, inject, input, output, signal, ViewChild } from '@angular/core';
import { LucidePencil, LucideTrash2 } from '@lucide/angular';
import { LongPressDirective } from '../long-press.directive';

import type { Site, SiteViewMode } from '../../core/models/types';
import { GlobalMenuService } from '../../core/services/global-menu.service';
import { ConfigService } from '../../core/services/config.service';
import { SiteBuiltinComponent } from './site-builtin.component';
import { IframePluginComponent } from './iframe-plugin.component';
import { WebcomponentPluginComponent } from './webcomponent-plugin.component';

@Component({
  selector: 'app-site-card',
  standalone: true,
  imports: [
    CdkMenu,
    CdkMenuItem,
    CdkContextMenuTrigger,
    LongPressDirective,
    LucidePencil,
    LucideTrash2,
    SiteBuiltinComponent,
    IframePluginComponent,
    WebcomponentPluginComponent,
  ],
  templateUrl: './site-card.component.html',
  styleUrl: './site-card.component.css',
})
export class SiteCardComponent {
  configService = inject(ConfigService);
  site = input.required<Site>();
  isFetching = input<boolean>(false);
  view_mode = input<SiteViewMode>('full');
  hasBorder = input<boolean | undefined>(undefined);

  effectiveBorder = computed(() => {
    const custom = this.hasBorder();
    if (custom !== undefined) {
      return custom;
    }
    return this.configService.siteBorder();
  });

  editSite = output<Site>();
  deleteSite = output<Site>();

  @ViewChild(CdkContextMenuTrigger) triggerMenu?: CdkContextMenuTrigger;

  isMenuOpen = signal(false);

  private globalMenuService = inject(GlobalMenuService);

  /** CSS modifier class added to the root element (e.g. 'size_1_1', 'size_2_1'). */
  sizeClass = computed(() => `size_${this.site().col_span || 1}_${this.site().row_span || 1}`);

  /** Key identifying the card dimensions ('1x1', '2x1', etc.). */
  sizeKey = computed(() => `${this.site().col_span || 1}x${this.site().row_span || 1}`);

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
}
