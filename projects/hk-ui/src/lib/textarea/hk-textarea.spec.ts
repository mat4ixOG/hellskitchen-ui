import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkTextareaComponent } from './hk-textarea.component';

@Component({
  imports: [HkTextareaComponent],
  template: `<hk-textarea [(value)]="note" [maxlength]="40" [counter]="true" [maxRows]="3">Markdown supported</hk-textarea>`
})
class HostComponent {
  readonly note = signal('Shipped');
}

describe('HkTextareaComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const area = (): HTMLTextAreaElement => fixture.debugElement.query(By.css('textarea')).nativeElement;
  const counter = (): HTMLElement => fixture.debugElement.query(By.css('.hk-textarea-counter')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the value, the projected note and the remaining count', () => {
    expect(area().value).toBe('Shipped');
    expect(area().getAttribute('maxlength')).toBe('40');
    expect(fixture.nativeElement.textContent).toContain('Markdown supported');
    expect(counter().textContent?.trim()).toBe('33');
  });

  it('two-way binds and flags the counter near the limit', () => {
    area().value = 'x'.repeat(20);
    area().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.note().length).toBe(20);
    expect(counter().textContent?.trim()).toBe('20');
    expect(counter().classList).toContain('is-low');
  });

  it('stops growing at maxRows', () => {
    area().value = 'line\n'.repeat(20);
    area().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(area().scrollHeight).toBeGreaterThan(area().clientHeight);
  });
});
