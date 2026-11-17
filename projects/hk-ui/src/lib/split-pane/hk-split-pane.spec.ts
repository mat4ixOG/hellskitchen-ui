import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkPaneDirective, HkSplitComponent } from './hk-split.component';

@Component({
  imports: [HkSplitComponent, HkPaneDirective],
  template: `
    <hk-split [(split)]="ratio" [min]="18" [max]="82" style="width: 400px; height: 100px">
      <div hkPane class="first">Request</div>
      <div hkPane class="second">Response</div>
    </hk-split>
  `
})
class HostComponent {
  readonly ratio = signal(45);
}

describe('HkSplitComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const handle = (): HTMLElement => fixture.debugElement.query(By.css('.hk-split-handle')).nativeElement;
  const press = (key: string): void => {
    handle().dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sizes the first pane off the split and exposes it on the separator', () => {
    const first = fixture.debugElement.query(By.css('.first')).nativeElement as HTMLElement;
    expect(first.style.flex).toContain('45%');
    expect(handle().getAttribute('role')).toBe('separator');
    expect(handle().getAttribute('aria-valuenow')).toBe('45');
  });

  it('moves by step on arrow keys and two-way binds the result', () => {
    press('ArrowRight');
    expect(host.ratio()).toBe(49);
    press('ArrowLeft');
    press('ArrowLeft');
    expect(host.ratio()).toBe(41);
  });

  it('clamps to the min and max bounds', () => {
    press('Home');
    expect(host.ratio()).toBe(18);
    press('ArrowLeft');
    expect(host.ratio()).toBe(18);
    press('End');
    expect(host.ratio()).toBe(82);
  });

  it('toggles the pane collapsed on Enter', () => {
    press('Enter');
    expect(host.ratio()).toBe(18);
    press('Enter');
    expect(host.ratio()).toBe(45);
  });
});
