import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  HkDatePickerComponent,
  type HkDatePickerFormat,
  type HkDatePickerMode,
  type HkDatePickerOutput
} from 'hellskitchen-ui';

/**
 * The library's `hk-date-picker` with its three knobs exposed: what a click
 * means (`mode`), the shape of what it emits (`format`), and whether a time
 * is folded into every selected date (`showTime`).
 */
@Component({
  selector: 'app-date-picker-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkDatePickerComponent],
  templateUrl: './date-picker-demo.component.html'
})
export class DatePickerDemoComponent {
  readonly modes: HkDatePickerMode[] = ['single', 'multiple', 'range'];
  readonly formats: { id: HkDatePickerFormat; label: string }[] = [
    { id: 'dd/MM/yyyy', label: 'dd/MM/yyyy' },
    { id: 'yyyy-MM-dd', label: 'yyyy-MM-dd' },
    { id: 'iso', label: 'ISO 8601' },
    { id: 'timestamp', label: 'Timestamp' }
  ];

  readonly mode = signal<HkDatePickerMode>('range');
  readonly format = signal<HkDatePickerFormat>('dd/MM/yyyy');
  readonly showTime = signal(false);

  /** The time on these is what the time control starts at once it is shown. */
  readonly value = signal<Date | Date[] | null>(new Date(2026, 8, 14, 9, 30));
  readonly rangeEnd = signal<Date | null>(new Date(2026, 8, 19, 9, 30));

  readonly emitted = signal<HkDatePickerOutput>(null);

  /** What a consumer's (dateChange) handler would actually be handed, printed. */
  readonly output = computed(() => {
    const value = this.emitted();
    if (value === null) return 'null';
    if (!Array.isArray(value)) return String(value);
    if (!value.length) return this.mode() === 'multiple' ? '[]' : 'null';
    if (this.mode() === 'range') return value.length === 2 ? `${value[0]} → ${value[1]}` : String(value[0]);
    return `[ ${value.join(', ')} ]`;
  });

  /** One place for the control-chip skin, shared by both groups. */
  chip(active: boolean): string {
    const base =
      'cursor-pointer rounded-md border px-2 py-0.5 text-[0.72rem] capitalize transition-colors';
    return active
      ? `${base} border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300`
      : `${base} border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 ` +
        'dark:border-white/10 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-200';
  }

  setMode(mode: HkDatePickerMode): void {
    // The picker trims the selection to what the new mode can hold.
    this.mode.set(mode);
  }
}
