import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkFileDropComponent, HkFileDropRejection } from './hk-file-drop.component';

@Component({
  imports: [HkFileDropComponent],
  template: `
    <hk-file-drop [accept]="['image/*', '.pdf']" [maxSize]="10"
      (files)="accepted = $event" (uploaded)="done.push($event)" (rejected)="rejected = $event" />
  `
})
class HostComponent {
  accepted: File[] = [];
  done: File[] = [];
  rejected: HkFileDropRejection[] = [];
}

describe('HkFileDropComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const drop = (files: File[]): void => {
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    const event = new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true });
    fixture.debugElement.query(By.css('.hk-fd-zone')).nativeElement.dispatchEvent(event);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a keyboard-reachable browse control', () => {
    const input: HTMLInputElement = fixture.debugElement.query(By.css('input[type="file"]')).nativeElement;
    expect(input.multiple).toBeTrue();
    expect(input.getAttribute('accept')).toBe('image/*,.pdf');
  });

  it('filters by type and size and says why', () => {
    const ok = new File(['abc'], 'shot.png', { type: 'image/png' });
    const wrongType = new File(['abc'], 'notes.txt', { type: 'text/plain' });
    const tooBig = new File(['0123456789abc'], 'doc.pdf', { type: 'application/pdf' });
    drop([ok, wrongType, tooBig]);

    expect(host.accepted).toEqual([ok]);
    expect(host.rejected.map((r) => r.reason)).toEqual(['type', 'size']);
    expect(fixture.debugElement.queryAll(By.css('.hk-fd-item')).length).toBe(1);
  });

  it('ticks a row to 100%, drops the bar and emits uploaded', fakeAsync(() => {
    const file = new File(['abc'], 'shot.png', { type: 'image/png' });
    drop([file]);
    expect(fixture.debugElement.query(By.css('.hk-fd-track'))).toBeTruthy();
    tick(220 * 9);
    fixture.detectChanges();
    expect(host.done).toEqual([file]);
    expect(fixture.debugElement.query(By.css('.hk-fd-track'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.hk-fd-done')).nativeElement.textContent).toContain('Uploaded');
  }));
});
