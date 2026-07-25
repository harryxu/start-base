import { Component, inject, signal } from '@angular/core';

import type { Group, GroupCreate, Site, SiteCreate } from '../../core/models/types';
import { SiteFormComponent } from '../../shared/site-form/site-form.component';
import { GroupFormComponent } from '../../shared/group-form/group-form.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { SettingsModalComponent } from '../../shared/settings-modal/settings-modal.component';
import { ConfigService } from '../../core/services/config.service';
import { BoardService } from '../../core/services/board.service';
import { SitesBoardComponent } from './components/sites-board/sites-board.component';

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
  boardService = inject(BoardService);

  // ---- UI state ----

  showSiteForm = signal(false);
  editingSite = signal<Site | null>(null);
  prefilledUrl = signal('');

  showGroupForm = signal(false);
  editingGroup = signal<Group | null>(null);

  showSettingsForm = signal(false);

  deletingSite = signal<Site | null>(null);
  deletingGroup = signal<Group | null>(null);

  // ---- Site actions ----

  openAddSiteForm(url = ''): void {
    this.editingSite.set(null);
    this.prefilledUrl.set(url);
    this.showSiteForm.set(true);
  }

  openEditSiteForm(site: Site): void {
    this.editingSite.set(site);
    this.prefilledUrl.set('');
    this.showSiteForm.set(true);
  }

  closeSiteForm(): void {
    this.showSiteForm.set(false);
    this.editingSite.set(null);
    this.prefilledUrl.set('');
  }

  onSiteFormSubmit(data: SiteCreate): void {
    const editing = this.editingSite();
    if (editing) {
      this.boardService.updateSite(editing.id, data);
    } else {
      this.boardService.saveNewSite(data);
    }
    this.closeSiteForm();
  }

  onExternalSiteDropped(url: string): void {
    if (!url) return;
    this.boardService.saveNewSite({ url });
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

  onGroupFormSubmit(data: GroupCreate): void {
    const editing = this.editingGroup();
    if (editing) {
      if (data.name !== editing.name) {
        this.boardService.updateGroup(editing.id, data.name);
      }
    } else {
      this.boardService.saveNewGroup(data.name);
    }
    this.closeGroupForm();
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
