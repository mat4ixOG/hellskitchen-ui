import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { HkCopyDirective } from './hk-copy.directive';

@Component({
  imports: [HkCopyDirective],
  template: `
    <button [hkCopy]="'npm i hellskitchen-ui'" [copyResetDelay]="500" #copy="hkCopy"
      (copied)="copiedText = $event" (copyFailed)="failure = $event">
      {{ copy.confirmed() ? 'Copied' : 'Copy' }}
    </button>
  `
})
class HostComponent {
  copiedText = '';
  failure: Error | null = null;
}

describe('HkCopyDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const button = (): HTMLButtonElement => fixture.nativeElement.querySelector('button');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('copies, confirms, then reverts on its own', fakeAsync(() => {
    const write = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    button().click();
    flushMicrotasks();
    fixture.detectChanges();

    expect(write).toHaveBeenCalledWith('npm i hellskitchen-ui');
    expect(host.copiedText).toBe('npm i hellskitchen-ui');
    expect(button().textContent?.trim()).toBe('Copied');
    expect(button().classList.contains('hk-copied')).toBeTrue();

    tick(500);
    fixture.detectChanges();
    expect(button().textContent?.trim()).toBe('Copy');
  }));

  it('reports a refused clipboard', fakeAsync(() => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject(new Error('denied')));
    button().click();
    flushMicrotasks();
    fixture.detectChanges();
    expect(host.failure?.message).toBe('denied');
    expect(button().textContent?.trim()).toBe('Copy');
  }));
});
