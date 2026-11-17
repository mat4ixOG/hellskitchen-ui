import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkAccordionComponent, HkAccordionPanelComponent } from './hk-accordion.component';

@Component({
  imports: [HkAccordionComponent, HkAccordionPanelComponent],
  template: `
    <hk-accordion [(multiple)]="multiple" [(open)]="open" (toggled)="last = $event">
      <hk-panel id="a" header="A">Alpha</hk-panel>
      <hk-panel id="b" header="B">Beta</hk-panel>
      <hk-panel id="c" header="C" [disabled]="true">Gamma</hk-panel>
    </hk-accordion>
  `
})
class HostComponent {
  readonly multiple = signal(false);
  readonly open = signal<string[]>(['a']);
  readonly accordion = viewChild.required(HkAccordionComponent);
  last = '';
}

describe('HkAccordionComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const headers = (): HTMLButtonElement[] =>
    fixture.debugElement.queryAll(By.css('.hk-panel-header')).map((el) => el.nativeElement);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('opens exactly one panel in single mode and emits the toggled id', () => {
    headers()[1].click();
    fixture.detectChanges();
    expect(host.open()).toEqual(['b']);
    expect(host.last).toBe('b');
    expect(headers()[1].getAttribute('aria-expanded')).toBe('true');
    expect(headers()[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('stacks panels in multiple mode and trims back when switched off', () => {
    host.multiple.set(true);
    fixture.detectChanges();
    headers()[1].click();
    fixture.detectChanges();
    expect(host.open()).toEqual(['a', 'b']);

    host.multiple.set(false);
    fixture.detectChanges();
    expect(host.open()).toEqual(['a']);
  });

  it('skips disabled panels in expandAll and implies multiple', () => {
    host.accordion().expandAll();
    fixture.detectChanges();
    expect(host.open()).toEqual(['a', 'b']);
    expect(host.multiple()).toBeTrue();
    host.accordion().collapseAll();
    fixture.detectChanges();
    expect(host.open()).toEqual([]);
  });

  it('marks a closed panel inert and wires aria-controls', () => {
    const second = headers()[1];
    const region = fixture.debugElement.query(By.css(`#${second.getAttribute('aria-controls')}`))
      .nativeElement as HTMLElement;
    expect(region.hasAttribute('inert')).toBeTrue();
    expect(region.getAttribute('aria-labelledby')).toBe(second.id);
  });

  it('wraps arrow-key focus over enabled headers', () => {
    headers()[0].focus();
    headers()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(headers()[1]);
  });
});
