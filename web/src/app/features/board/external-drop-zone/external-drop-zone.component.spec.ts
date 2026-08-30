import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExternalDropZoneComponent } from './external-drop-zone.component';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('ExternalDropZoneComponent', () => {
  let component: ExternalDropZoneComponent;
  let fixture: ComponentFixture<ExternalDropZoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExternalDropZoneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExternalDropZoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
    expect(component.floating()).toBe(true);
  });

  it('should render floating classes when floating is true and dropzone is shown', () => {
    component.showDropZone.set(true);
    fixture.componentRef.setInput('floating', true);
    fixture.detectChanges();

    const dropZoneEl = fixture.nativeElement.querySelector('.card');
    expect(dropZoneEl).toBeTruthy();
    expect(dropZoneEl.classList.contains('absolute')).toBe(true);
    expect(dropZoneEl.classList.contains('top-6')).toBe(true);
    expect(dropZoneEl.classList.contains('relative')).toBe(false);
  });

  it('should render in-flow layout classes when floating is false and dropzone is shown', () => {
    component.showDropZone.set(true);
    fixture.componentRef.setInput('floating', false);
    fixture.detectChanges();

    const dropZoneEl = fixture.nativeElement.querySelector('.card');
    expect(dropZoneEl).toBeTruthy();
    expect(dropZoneEl.classList.contains('relative')).toBe(true);
    expect(dropZoneEl.classList.contains('w-full')).toBe(true);
    expect(dropZoneEl.classList.contains('mb-4')).toBe(true);
    expect(dropZoneEl.classList.contains('absolute')).toBe(false);
  });

  it('should emit droppedUrl when a valid URL is dropped', () => {
    const emitSpy = vi.spyOn(component.droppedUrl, 'emit');
    component.showDropZone.set(true);
    fixture.detectChanges();

    const dropZoneEl = fixture.nativeElement.querySelector('.card');
    const mockDataTransfer = {
      getData: (type: string) => (type === 'text/uri-list' ? 'https://example.com' : ''),
    };

    const dropEvent = new CustomEvent('drop', { cancelable: true }) as any;
    dropEvent.dataTransfer = mockDataTransfer;
    dropEvent.preventDefault = vi.fn();
    dropEvent.stopPropagation = vi.fn();

    dropZoneEl.dispatchEvent(dropEvent);

    expect(emitSpy).toHaveBeenCalledWith('https://example.com');
    expect(component.showDropZone()).toBe(false);
  });
});
