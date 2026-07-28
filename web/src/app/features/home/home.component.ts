import { Component, inject, signal } from '@angular/core';

import type { Group, Site } from '../../core/models/types';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { ConfigService } from '../../core/services/config.service';
import { AuthService } from '../../core/services/auth.service';
import { BoardService } from '../../core/services/board.service';
import { SitesBoardComponent } from '../sites-board/sites-board.component';
import { SiteFormComponent } from '../site-form/site-form.component';
import { GroupFormComponent } from '../group-form/group-form.component';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    SitesBoardComponent,
    SiteFormComponent,
    GroupFormComponent,
    ConfirmDialogComponent,
    SettingsModalComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  configService = inject(ConfigService);
  authService = inject(AuthService);
  boardService = inject(BoardService);

  // ---- UI state ----

  showSiteForm = signal(false);
  editingSite = signal<Site | null>(null);
  siteFormDefaults = signal<Partial<Site> | null>(null);

  showGroupForm = signal(false);
  editingGroup = signal<Group | null>(null);

  showSettingsForm = signal(false);

  deletingSite = signal<Site | null>(null);
  deletingGroup = signal<Group | null>(null);

  // ---- Site actions ----

  openAddSiteForm(defaults?: Partial<Site> | null): void {
    this.editingSite.set(null);
    this.siteFormDefaults.set(defaults ?? null);
    this.showSiteForm.set(true);
  }

  openEditSiteForm(site: Site): void {
    this.editingSite.set(site);
    this.siteFormDefaults.set(null);
    this.showSiteForm.set(true);
  }

  closeSiteForm(): void {
    this.showSiteForm.set(false);
    this.editingSite.set(null);
    this.siteFormDefaults.set(null);
  }

  onExternalSiteDropped(url: string): void {
    if (!url) return;
    this.openAddSiteForm({ url });
  }

  onDeleteSite(site: Site): void {
    this.deletingSite.set(site);
  }

  confirmDeleteSite(): void {
    const site = this.deletingSite();
    if (site) {
      this.boardService.deleteSite(site.id);
      this.deletingSite.set(null);
    }
  }

  cancelDeleteSite(): void {
    this.deletingSite.set(null);
  }

  // ---- Group actions ----

  openAddGroupDialog(): void {
    this.editingGroup.set(null);
    this.showGroupForm.set(true);
  }

  onEditGroup(group: Group): void {
    this.editingGroup.set(group);
    this.showGroupForm.set(true);
  }

  closeGroupForm(): void {
    this.showGroupForm.set(false);
    this.editingGroup.set(null);
  }

  onDeleteGroup(group: Group): void {
    this.deletingGroup.set(group);
  }

  confirmDeleteGroup(): void {
    const group = this.deletingGroup();
    if (group) {
      this.boardService.deleteGroup(group.id);
      this.deletingGroup.set(null);
    }
  }

  cancelDeleteGroup(): void {
    this.deletingGroup.set(null);
  }

  // ---- Settings actions ----

  openSettingsModal(): void {
    this.showSettingsForm.set(true);
  }

  closeSettingsModal(): void {
    this.showSettingsForm.set(false);
  }
}
