import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkTabComponent, HkTabPanelComponent, HkTabsComponent } from './hk-tabs.component';

@Component({
  imports: [HkTabsComponent, HkTabComponent, HkTabPanelComponent],
  template: `
    <hk-tabs [(active)]="active" (changed)="changes.push($event)">
      <hk-tab value="one">One</hk-tab>
      <hk-tab value="two" [badge]="unread()">Two</hk-tab>
      <hk-tab value="three">Three</hk-tab>
      <hk-tab-panel value="one">Panel one</hk-tab-panel>
      <hk-tab-panel value="two">Panel two</hk-tab-panel>
    </hk-tabs>
  `
})
class HostComponent {
  readonly active = signal('');
  readonly unread = signal<number>(4);
  changes: string[] = [];
}

describe('HkTabsComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const tabs = (): HTMLElement[] =>
    fixture.debugElement.queryAll(By.css('hk-tab')).map((el) => el.nativeElement);
  const panels = (): HTMLElement[] =>
    fixture.debugElement.queryAll(By.css('hk-tab-panel')).map((el) => el.nativeElement);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults to the first tab and shows its panel', () => {
    expect(tabs()[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs()[0].getAttribute('tabindex')).toBe('0');
    expect(tabs()[1].getAttribute('tabindex')).toBe('-1');
    expect(panels()[0].hidden).toBeFalse();
    expect(panels()[1].hidden).toBeTrue();
  });

  it('selects on click, two-way binds and emits changed', () => {
    tabs()[1].click();
    fixture.detectChanges();
    expect(host.active()).toBe('two');
    expect(host.changes).toEqual(['two']);
    expect(panels()[1].hidden).toBeFalse();
  });

  it('renders the badge and clears it when the tab is opened', () => {
    expect(tabs()[1].querySelector('.hk-tab-badge')?.textContent?.trim()).toBe('4');
    tabs()[1].click();
    fixture.detectChanges();
    expect(tabs()[1].querySelector('.hk-tab-badge')).toBeNull();
  });

  it('renders nothing for a zero badge and collapses past the max', () => {
    host.unread.set(0);
    fixture.detectChanges();
    expect(tabs()[1].querySelector('.hk-tab-badge')).toBeNull();
    host.unread.set(150);
    fixture.detectChanges();
    expect(tabs()[1].querySelector('.hk-tab-badge')?.textContent?.trim()).toBe('99+');
  });

  it('moves with the arrow keys', () => {
    tabs()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(host.active()).toBe('three');
  });
});
