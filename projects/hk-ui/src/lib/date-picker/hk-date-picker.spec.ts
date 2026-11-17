import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkDatePickerComponent, HkDatePickerFormat, HkDatePickerMode, HkDatePickerOutput } from './hk-date-picker.component';

@Component({
  imports: [HkDatePickerComponent],
  template: `
    <hk-date-picker [(value)]="value" [(rangeEnd)]="end" [mode]="mode()" [format]="format()"
      [min]="min" (dateChange)="emitted = $event" />
  `
})
class HostComponent {
  readonly mode = signal<HkDatePickerMode>('range');
  readonly format = signal<HkDatePickerFormat>('dd/MM/yyyy');
  readonly min = new Date(2026, 8, 3);
  value: Date | Date[] | null = new Date(2026, 8, 14);
  end: Date | null = new Date(2026, 8, 19);
  emitted: HkDatePickerOutput = null;
}

describe('HkDatePickerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const day = (n: number): HTMLButtonElement =>
    fixture.debugElement
      .queryAll(By.css('.hk-dp-day'))
      .map((el) => el.nativeElement as HTMLButtonElement)
      .find((el) => el.textContent!.trim() === String(n))!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the month of the selection, Monday first, with a padded first week', () => {
    expect(fixture.debugElement.query(By.css('.hk-dp-title')).nativeElement.textContent).toContain('September 2026');
    // 1 Sep 2026 is a Tuesday: one blank before it.
    const cells = fixture.debugElement.queryAll(By.css('.hk-dp-grid:not(.hk-dp-weekdays) > *'));
    expect(cells[0].nativeElement.tagName).toBe('SPAN');
    expect(cells[1].nativeElement.textContent.trim()).toBe('1');
  });

  it('paints the range and emits it in the chosen format', () => {
    expect(day(14).classList).toContain('is-selected');
    expect(day(16).classList).toContain('is-range');
    expect(host.emitted).toEqual(['14/09/2026', '19/09/2026']);

    host.format.set('timestamp');
    fixture.detectChanges();
    expect(host.emitted).toEqual([new Date(2026, 8, 14).getTime(), new Date(2026, 8, 19).getTime()]);
  });

  it('starts a new range on a click after a complete one, then closes it', () => {
    day(20).click();
    fixture.detectChanges();
    expect(host.value).toEqual(new Date(2026, 8, 20));
    expect(host.end).toBeNull();
    day(25).click();
    fixture.detectChanges();
    expect(host.end).toEqual(new Date(2026, 8, 25));
  });

  it('collects several dates in multiple mode', () => {
    host.mode.set('multiple');
    fixture.detectChanges();
    day(2).click();
    expect(day(2).disabled).toBeTrue();
    day(5).click();
    fixture.detectChanges();
    expect(host.value).toEqual([new Date(2026, 8, 5), new Date(2026, 8, 14), new Date(2026, 8, 19)]);
    expect(host.end).toBeNull();
  });
});
