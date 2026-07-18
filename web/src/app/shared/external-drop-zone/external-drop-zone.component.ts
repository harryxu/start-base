import { Component, signal, output } from '@angular/core';
import { LucidePlus } from '@lucide/angular';

@Component({
  selector: 'app-external-drop-zone',
  standalone: true,
  imports: [LucidePlus],
  template: `
    @if (showDropZone()) {
      <div
        class="absolute top-6 left-6 right-6 h-36 z-50 card border-2 border-dashed flex flex-col items-center justify-center transition-all duration-200"
        [class.border-primary]="isOverDropZone()"
        [class.bg-primary/70]="isOverDropZone()"
        [class.text-primary]="isOverDropZone()"
        [class.scale-[1.02]]="isOverDropZone()"
        [class.shadow-xl]="isOverDropZone()"
        [class.border-base-content/30]="!isOverDropZone()"
        [class.bg-base-200/95]="!isOverDropZone()"
        [class.text-base-content/80]="!isOverDropZone()"
        [class.backdrop-blur-sm]="!isOverDropZone()"
        [class.shadow-lg]="!isOverDropZone()"
        (dragover)="onDragOver($event)"
        (dragenter)="onDropZoneDragEnter($event)"
        (dragleave)="onDropZoneDragLeave($event)"
        (drop)="onDropZoneDrop($event)"
      >
        <svg
          lucidePlus
          class="w-8 h-8 mb-2 animate-bounce pointer-events-none"
          [class.text-primary]="isOverDropZone()"
          [class.text-base-content/60]="!isOverDropZone()"
        ></svg>
        <span class="text-sm font-semibold pointer-events-none">Drop link here to add website</span>
        <span
          class="text-xs mt-1 pointer-events-none"
          [class.text-primary/80]="isOverDropZone()"
          [class.text-base-content/50]="!isOverDropZone()"
          >Release inside this box to add</span
        >
      </div>
    }
  `,
  host: {
    '(window:dragstart)': 'onLocalDragStart($event)',
    '(window:dragend)': 'onLocalDragEnd($event)',
    '(window:dragenter)': 'onDragEnter($event)',
    '(window:dragleave)': 'onDragLeave($event)',
    '(window:dragover)': 'onDragOverPage($event)',
    '(window:drop)': 'onPageDrop($event)',
  },
})
export class ExternalDropZoneComponent {
  // Output event when a URL is dropped
  droppedUrl = output<string>();

  isLocalDrag = false;
  dragCounter = 0;
  showDropZone = signal(false);
  isOverDropZone = signal(false);

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
    const hasUrlOrFiles =
      types &&
      (types.includes('text/uri-list') || types.includes('Files') || types.includes('text/plain'));
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
      this.isOverDropZone.set(false);
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

  onDropZoneDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.isOverDropZone.set(true);
  }

  onDropZoneDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isOverDropZone.set(false);
  }

  onPageDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragCounter = 0;
    this.showDropZone.set(false);
    this.isOverDropZone.set(false);
  }

  onDropZoneDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter = 0;
    this.showDropZone.set(false);
    this.isOverDropZone.set(false);

    const url =
      event.dataTransfer?.getData('text/uri-list') ||
      event.dataTransfer?.getData('text/plain') ||
      '';
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      this.droppedUrl.emit(url);
    }
  }
}
