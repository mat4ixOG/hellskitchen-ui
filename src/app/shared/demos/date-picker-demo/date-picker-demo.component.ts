import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

export type PickerMode = 'single' | 'multiple' | 'range';
export type DateFormat = 'dd/MM/yyyy' | 'yyyy-MM-dd' | 'timestamp' | 'iso';

/**
 * One month grid, three selection modes, and an output format the caller picks.
 *
 * The mode does not change the calendar — it changes what a click *means*, so
 * the grid, the keyboard map and the month arithmetic are written once. The
 * selection is always an ordered `Date[]`; single keeps one, range keeps two
 * and paints the span between, multiple keeps as many as you click.
 *
 * Time is not a second control bolted on afterwards: hour and minute are folded
 * into every selected `Date`, so a timestamp is a real instant rather than a
 * date at midnight.
 */
@Component({
  selector: 'app-date-picker-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-picker-demo.component.html'
})
export class DatePickerDemoComponent {
  readonly dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  readonly modes: PickerMode[] = ['single', 'multiple', 'range'];
  readonly formats: { id: DateFormat; label: string }[] = [
    { id: 'dd/MM/yyyy', label: 'dd/MM/yyyy' },
    { id: 'yyyy-MM-dd', label: 'yyyy-MM-dd' },
    { id: 'iso', label: 'ISO 8601' },
    { id: 'timestamp', label: 'Timestamp' }
  ];

  readonly month = signal(new Date(2026, 8, 1));
  readonly mode = signal<PickerMode>('range');
  readonly format = signal<DateFormat>('dd/MM/yyyy');
  readonly showTime = signal(false);
  readonly hour = signal(9);
  readonly minute = signal(30);

  /** Always ordered, always in the displayed month for this demo. */
  readonly selected = signal<Date[]>([new Date(2026, 8, 14), new Date(2026, 8, 19)]);

  readonly label = computed(() =>
    this.month().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  /** Leading zeros pad the first week; Monday-first, so Sunday shifts to 6. */
  readonly days = computed(() => {
    const date = this.month();
    const first = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const lead = (first + 6) % 7;
    const total = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return [...Array(lead).fill(0), ...Array.from({ length: total }, (_, i) => i + 1)];
  });

  /** What a consumer's (dateChange) handler would actually be handed. */
  readonly output = computed(() => {
    const dates = this.withTime();
    if (!dates.length) return this.mode() === 'multiple' ? '[]' : 'null';
    const parts = dates.map((date) => this.formatted(date));
    if (this.mode() === 'single') return parts[0];
    if (this.mode() === 'range') return parts.length === 2 ? `${parts[0]} → ${parts[1]}` : parts[0];
    return `[ ${parts.join(', ')} ]`;
  });

  readonly hint = computed(() => {
    const count = this.selected().length;
    switch (this.mode()) {
      case 'single':
        return count ? 'Click another day to move the selection.' : 'Pick a day.';
      case 'multiple':
        return `${count} day${count === 1 ? '' : 's'} selected — click to add or remove.`;
      default:
        if (count === 2) return `${this.nights()} nights. Click any day to start over.`;
        return count === 1 ? 'Pick the end of the range.' : 'Pick the start of the range.';
    }
  });

  readonly nights = computed(() => {
    const [start, end] = this.selected();
    if (!start || !end) return 0;
    return Math.round((end.getTime() - start.getTime()) / 86_400_000);
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

  isSelected(day: number): boolean {
    return this.selected().some((date) => this.sameDay(date, day));
  }

  /** True for the days painted between a range's two ends. */
  inRange(day: number): boolean {
    if (this.mode() !== 'range') return false;
    const [start, end] = this.selected();
    if (!start || !end) return false;
    const target = this.dateFor(day).getTime();
    return target > start.getTime() && target < end.getTime();
  }

  tone(day: number): string {
    if (this.isSelected(day)) return 'bg-red-600 font-semibold text-white';
    if (this.inRange(day)) return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200';
    return 'text-slate-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/5';
  }

  setMode(mode: PickerMode): void {
    this.mode.set(mode);
    // Trim rather than clear, so switching mode keeps a sensible selection.
    const current = this.selected();
    if (mode === 'single' && current.length > 1) this.selected.set([current[0]]);
    if (mode === 'range' && current.length > 2) this.selected.set(current.slice(0, 2));
  }

  pick(day: number): void {
    const date = this.dateFor(day);

    if (this.mode() === 'single') {
      this.selected.set([date]);
      return;
    }

    if (this.mode() === 'multiple') {
      this.selected.update((list) =>
        list.some((item) => this.sameDay(item, day))
          ? list.filter((item) => !this.sameDay(item, day))
          : [...list, date].sort((a, b) => a.getTime() - b.getTime())
      );
      return;
    }

    // Range: a complete range or a click before the start begins a new one.
    const current = this.selected();
    if (current.length !== 1) {
      this.selected.set([date]);
      return;
    }
    this.selected.set(
      date.getTime() < current[0].getTime() ? [date] : [current[0], date]
    );
  }

  shift(delta: number): void {
    const date = this.month();
    this.month.set(new Date(date.getFullYear(), date.getMonth() + delta, 1));
  }

  setHour(value: string): void {
    this.hour.set(this.clamp(+value, 0, 23));
  }

  setMinute(value: string): void {
    this.minute.set(this.clamp(+value, 0, 59));
  }

  now(): void {
    const now = new Date();
    this.hour.set(now.getHours());
    this.minute.set(now.getMinutes());
    this.showTime.set(true);
  }

  /** The selection with the time control folded in. */
  private withTime(): Date[] {
    if (!this.showTime()) return this.selected();
    return this.selected().map(
      (date) =>
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), this.hour(), this.minute())
    );
  }

  private formatted(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    const time = this.showTime() ? ` ${pad(date.getHours())}:${pad(date.getMinutes())}` : '';

    switch (this.format()) {
      case 'timestamp':
        return String(date.getTime());
      case 'iso':
        return date.toISOString();
      case 'yyyy-MM-dd':
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}${time}`;
      default:
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}${time}`;
    }
  }

  private dateFor(day: number): Date {
    const month = this.month();
    return new Date(month.getFullYear(), month.getMonth(), day);
  }

  private sameDay(date: Date, day: number): boolean {
    const month = this.month();
    return (
      date.getDate() === day &&
      date.getMonth() === month.getMonth() &&
      date.getFullYear() === month.getFullYear()
    );
  }

  private clamp(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, Math.trunc(value)));
  }
}
