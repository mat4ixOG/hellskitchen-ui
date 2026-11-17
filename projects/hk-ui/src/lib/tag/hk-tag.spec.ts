import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkTagComponent } from './hk-tag.component';

@Component({
  imports: [HkTagComponent],
  template: `<hk-tag [tone]="tone()" icon="x-icon" [removable]="removable()" (removed)="removals = removals + 1">canary</hk-tag>`
})
class HostComponent {
  readonly tone = signal<'neutral' | 'success'>('neutral');
  readonly removable = signal(false);
  removals = 0;
}

describe('HkTagComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const tag = (): HTMLElement => fixture.debugElement.query(By.css('hk-tag')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders its text, icon and tone', () => {
    expect(tag().textContent).toContain('canary');
    expect(tag().querySelector('i.x-icon')).toBeTruthy();
    host.tone.set('success');
    fixture.detectChanges();
    expect(tag().getAttribute('data-tone')).toBe('success');
  });

  it('only shows the remove button when removable', () => {
    expect(tag().querySelector('button')).toBeNull();
    host.removable.set(true);
    fixture.detectChanges();
    const button = tag().querySelector('button') as HTMLButtonElement;
    const [self, label] = (button.getAttribute('aria-labelledby') ?? '').split(' ');
    expect(self).toBe(button.id);
    expect(document.getElementById(label)?.textContent).toContain('canary');
    button.click();
    expect(host.removals).toBe(1);
  });
});
