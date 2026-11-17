import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkEmptyComponent } from './hk-empty.component';

@Component({
  imports: [HkEmptyComponent],
  template: `
    <hk-empty icon="pi pi-filter-slash" title="No services match" body="Clear a filter."
      [actionLabel]="actionLabel()" (action)="actions = actions + 1" />
  `
})
class HostComponent {
  readonly actionLabel = signal('Clear filters');
  actions = 0;
}

describe('HkEmptyComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const empty = (): HTMLElement => fixture.debugElement.query(By.css('hk-empty')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the title as a heading, the body and the icon', () => {
    expect(empty().querySelector('h3')?.textContent).toBe('No services match');
    expect(empty().textContent).toContain('Clear a filter.');
    expect(empty().querySelector('i')?.className).toBe('pi pi-filter-slash');
  });

  it('emits action when the button is pressed', () => {
    (empty().querySelector('button') as HTMLButtonElement).click();
    expect(host.actions).toBe(1);
  });

  it('renders no button without a label', () => {
    host.actionLabel.set('');
    fixture.detectChanges();
    expect(empty().querySelector('button')).toBeNull();
  });
});
