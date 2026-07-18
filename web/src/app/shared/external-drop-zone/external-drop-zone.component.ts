import { Component, signal, output } from '@angular/core';
import { LucidePlus } from '@lucide/angular';

@Component({
  selector: 'app-external-drop-zone',
  standalone: true,
  imports: [LucidePlus],
  template: `
    @if (showDropZone()) {
      <div
        class="absolute top-6 left-6 right-6 h-36 z-50 border-2 border-dashed border-teal-400 bg-teal-50/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-teal-800 shadow-lg transition-all duration-200"
        (dragover)="onDragOver($event)"
        (drop)="onDropZoneDrop($event)"
      >
        <svg lucidePlus class="w-8 h-8 mb-2 animate-bounce text-teal-600 pointer-events-none"></svg>
        <span class="text-sm font-semibold pointer-events-none">Drop link here to add website</span>
        <span class="text-xs text-teal-600/80 mt-1 pointer-events-none">Release inside this box to add</span>
      </div>
    }
  `,
  host: {
    '(window:dragstart)': 'onLocalDragStart($event)',
    '(window:dragend)': 'onLocalDragEnd($event)',
    '(window:dragenter)': 'onDragEnter($event)',
    '(window:dragleave)': 'onDragLeave($event)',
    '(window:dragover)': 'onDragOverPage($event)',
    '(window:drop)': 'onPageDrop($event)'
  }
})
export class ExternalDropZoneComponent {
  // Output event when a URL is dropped
  droppedUrl = output<string>();

  isLocalDrag = false;
  dragCounter = 0;
  showDropZone = signal(false);

  onLocalDragStart(event: DragEvent): void {
    this.isLocalDrag = true;
  }

  onLocalDragEnd(event: DragEvent): void {
    this.isLocalDrag = false;
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    if (this.isLocalDrag) return;

    const types = event.dataTransfer?.types;
    const hasUrlOrFiles = types && (types.includes('text/uri-list') || types.includes('Files') || types.includes('text/plain'));
    if (!hasUrlOrFiles) return;

    this.dragCounter++;
    if (this.dragCounter === 1) {
      this.showDropZone.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    if (this.isLocalDrag) return;

    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.dragCounter = 0;
      this.showDropZone.set(false);
    }
  }

  onDragOverPage(event: DragEvent): void {
    if (this.isLocalDrag) return;
    event.preventDefault();
  }

  onDragOver(event: DragEvent): void {
    if (this.isLocalDrag) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onPageDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragCounter = 0;
    this.showDropZone.set(false);
  }

  onDropZoneDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter = 0;
    this.showDropZone.set(false);

    const url =
      event.dataTransfer?.getData('text/uri-list') ||
      event.dataTransfer?.getData('text/plain') ||
      '';
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      this.droppedUrl.emit(url);
    }
  }
}
