import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkRadioGroupComponent, HkRadioOption } from './hk-radio-group.component';

@Component({
  imports: [HkRadioGroupComponent],
  template: `<hk-radio-group [(value)]="strategy" [options]="options" label="Deploy strategy" />`
})
class HostComponent {
  readonly options: HkRadioOption[] = [
    { value: 'rolling', label: 'Rolling', hint: 'Batches of 25%.' },
    { value: 'canary', label: 'Canary' },
    { value: 'blue-green', label: 'Blue / green' }
  ];
  readonly strategy = signal<unknown>('canary');
}

describe('HkRadioGroupComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const radios = (): HTMLButtonElement[] =>
    fixture.debugElement.queryAll(By.css('[role="radio"]')).map((d) => d.nativeElement);
  const group = (): HTMLElement => fixture.debugElement.query(By.css('[role="radiogroup"]')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the options with one tab stop on the selection', () => {
    expect(group().getAttribute('aria-label')).toBe('Deploy strategy');
    expect(radios().length).toBe(3);
    expect(radios().map((r) => r.tabIndex)).toEqual([-1, 0, -1]);
    expect(radios()[1].getAttribute('aria-checked')).toBe('true');
  });

  it('selects on click', () => {
    radios()[0].click();
    fixture.detectChanges();
    expect(host.strategy()).toBe('rolling');
  });

  it('moves and wraps with the arrow keys', () => {
    group().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(host.strategy()).toBe('blue-green');
    group().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(host.strategy()).toBe('rolling');
    group().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(host.strategy()).toBe('blue-green');
  });
});
