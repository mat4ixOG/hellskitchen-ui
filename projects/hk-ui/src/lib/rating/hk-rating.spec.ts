import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkRatingComponent } from './hk-rating.component';

@Component({
  imports: [HkRatingComponent],
  template: `<hk-rating [(value)]="score" [count]="5" [readonly]="readonly()" />`
})
class HostComponent {
  readonly score = signal(4);
  readonly readonly = signal(false);
}

describe('HkRatingComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const items = (): HTMLButtonElement[] =>
    fixture.debugElement.queryAll(By.css('[role="radio"]')).map((d) => d.nativeElement);
  const group = (): HTMLElement => fixture.debugElement.query(By.css('[role="radiogroup"]')).nativeElement;
  const key = (k: string): void => {
    group().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders count items announced as "n of count"', () => {
    expect(items().length).toBe(5);
    expect(items()[2].getAttribute('aria-label')).toBe('3 of 5');
    expect(items()[3].getAttribute('aria-checked')).toBe('true');
    expect(fixture.debugElement.queryAll(By.css('.hk-rating-icon.is-on')).length).toBe(4);
  });

  it('selects on click', () => {
    items()[1].click();
    expect(host.score()).toBe(2);
  });

  it('drives the value from the keyboard', () => {
    key('ArrowRight');
    expect(host.score()).toBe(5);
    key('Home');
    expect(host.score()).toBe(1);
    key('0');
    expect(host.score()).toBe(0);
  });

  it('ignores input when readonly', () => {
    host.readonly.set(true);
    fixture.detectChanges();
    key('ArrowRight');
    expect(host.score()).toBe(4);
    expect(group().hasAttribute('tabindex')).toBeFalse();
  });
});
