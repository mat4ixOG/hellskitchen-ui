import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HkBadgeComponent } from './hk-badge.component';

@Component({
  imports: [HkBadgeComponent],
  template: `
    <hk-badge id="count" [count]="count()" [showZero]="showZero()"><span>bell</span></hk-badge>
    <hk-badge id="dot" variant="dot" [count]="count()" />
  `
})
class HostComponent {
  readonly count = signal(42);
  readonly showZero = signal(false);
}

describe('HkBadgeComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const el = (selector: string): HTMLElement | null => fixture.nativeElement.querySelector(selector);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('projects its anchor and shows the count', () => {
    expect(el('#count span')?.textContent).toBe('bell');
    expect(el('#count .hk-badge-count')?.textContent?.trim()).toBe('42');
    expect(el('#dot .hk-badge-dot')).toBeTruthy();
  });

  it('collapses past max', () => {
    host.count.set(128);
    fixture.detectChanges();
    expect(el('#count .hk-badge-count')?.textContent?.trim()).toBe('99+');
  });

  it('hides at zero unless showZero', () => {
    host.count.set(0);
    fixture.detectChanges();
    expect(el('#count .hk-badge-count')).toBeNull();
    expect(el('#dot .hk-badge-dot')).toBeNull();
    host.showZero.set(true);
    fixture.detectChanges();
    expect(el('#count .hk-badge-count')?.textContent?.trim()).toBe('0');
  });
});
