import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  HkDialogBodyDirective,
  HkDialogCloseDirective,
  HkDialogComponent,
  HkDialogTitleDirective
} from './hk-dialog.component';

@Component({
  imports: [HkDialogComponent, HkDialogTitleDirective, HkDialogBodyDirective, HkDialogCloseDirective],
  template: `
    <hk-dialog #dlg size="lg" (closed)="result = $event">
      <h3 hkDialogTitle>Invite</h3>
      <p hkDialogBody>Read access.</p>
      <button hkDialogClose value="cancel">Cancel</button>
      <button hkDialogClose value="invited">Send</button>
    </hk-dialog>
  `
})
class HostComponent {
  readonly dialog = viewChild.required<HkDialogComponent>('dlg');
  result = '';
}

describe('HkDialogComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const box = (): HTMLDialogElement => fixture.debugElement.query(By.css('dialog')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => host.dialog().close());

  it('opens as a modal labelled by its title', () => {
    host.dialog().open();
    expect(box().open).toBeTrue();
    const title = fixture.debugElement.query(By.css('h3')).nativeElement as HTMLElement;
    expect(box().getAttribute('aria-labelledby')).toBe(title.id);
    expect(box().getAttribute('data-size')).toBe('lg');
  });

  it('emits the value of the close button that was pressed', () => {
    host.dialog().open();
    fixture.debugElement.queryAll(By.css('button'))[1].nativeElement.click();
    box().dispatchEvent(new Event('close'));
    expect(box().open).toBeFalse();
    expect(host.result).toBe('invited');
  });

  it('reports "dismissed" when closed without a value', () => {
    host.dialog().open();
    host.dialog().close();
    box().dispatchEvent(new Event('close'));
    expect(host.result).toBe('dismissed');
  });
});
