import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  untracked
} from '@angular/core';

export type HkDatePickerMode = 'single' | 'multiple' | 'range';
/** A named shape, or a custom pattern built from `yyyy`, `MM`, `dd`, `HH` and `mm`. */
export type HkDatePickerFormat = 'dd/MM/yyyy' | 'yyyy-MM-dd' | 'iso' | 'timestamp' | (string & {});
/** What `(dateChange)` hands over: one formatted value in single mode, a list otherwise. */
export type HkDatePickerOutput = string | number | null | (string | number)[];

/**
 * One month grid, three selection modes, and an output format the caller picks.
 *
 * The mode does not change the calendar — it changes what a click *means*, so
 * the grid and the month arithmetic are written once. Single keeps one date,
 * range keeps two (`value` and `rangeEnd`) and paints the span between,
 * multiple keeps as many as you click (`value` as a `Date[]`).
 *
 * Time is not a second control bolted on afterwards: hour and minute are folded
 * into every selected `Date`, so a timestamp is a real instant rather than a
 * date at midnight.
 */
@Component({
  selector: 'hk-date-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-date-picker.component.html',
  styleUrl: './hk-date-picker.component.css'
})
export class HkDatePickerComponent {
  /** Selected date, range start, or every picked date in multiple mode. Two-way bindable. */
  readonly value = model<Date | Date[] | null>(null);
  /** Range end. Two-way bindable; only used in range mode. */
  readonly rangeEnd = model<Date | null>(null);
  readonly mode = input<HkDatePickerMode>('single');
  readonly showTime = input(false);
  readonly hourFormat = input<'12' | '24'>('24');
  readonly format = input<HkDatePickerFormat>('dd/MM/yyyy');
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly firstDay = input<'sunday' | 'monday'>('monday');
  readonly locale = input('en-US');

  /** The selection rendered in `format`. Emits on every change, including the first render. */
  readonly dateChange = output<HkDatePickerOutput>();

  private readonly viewMonth = signal<Date | null>(null);
  private readonly hourOverride = signal<number | null>(null);
  private readonly minuteOverride = signal<number | null>(null);

  /** Always ordered, trimmed to what the mode can hold. */
  readonly selected = computed<Date[]>(() => {
    const value = this.value();
    const list = Array.isArray(value) ? [...value] : value ? [value] : [];
    const end = this.rangeEnd();
    if (end) list.push(end);
    list.sort((a, b) => a.getTime() - b.getTime());
    if (this.mode() === 'single') return list.slice(0, 1);
    if (this.mode() === 'range') return list.slice(0, 2);
    return list;
  });

  readonly month = computed(() => {
    const anchor = this.viewMonth() ?? this.selected()[0] ?? new Date();
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });

  readonly hour = computed(() => this.hourOverride() ?? this.selected()[0]?.getHours() ?? 0);
  readonly minute = computed(() => this.minuteOverride() ?? this.selected()[0]?.getMinutes() ?? 0);
  readonly displayHour = computed(() =>
    this.hourFormat() === '12' ? this.hour() % 12 || 12 : this.hour()
  );
  readonly meridiem = computed(() => (this.hour() < 12 ? 'AM' : 'PM'));

  readonly label = computed(() =>
    this.month().toLocaleDateString(this.locale(), { month: 'long', year: 'numeric' })
  );

  readonly dayNames = computed(() => {
    // 1 Jan 2024 was a Monday, 31 Dec 2023 a Sunday.
    const start = this.firstDay() === 'monday' ? new Date(2024, 0, 1) : new Date(2023, 11, 31);
    return Array.from({ length: 7 }, (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i).toLocaleDateString(
        this.locale(),
        { weekday: 'narrow' }
      )
    );
  });

  /** Leading zeros pad the first week. */
  readonly days = computed(() => {
    const date = this.month();
    const first = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const lead = this.firstDay() === 'monday' ? (first + 6) % 7 : first;
    const total = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return [...Array(lead).fill(0), ...Array.from({ length: total }, (_, i) => i + 1)] as number[];
  });

  readonly formatted = computed<HkDatePickerOutput>(() => {
    // Without the time control a date is a date: anchored to local midnight.
    const parts = this.selected().map((date) =>
      this.formatDate(this.showTime() ? date : this.midnight(date))
    );
    return this.mode() === 'single' ? (parts[0] ?? null) : parts;
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
    return Math.round((this.midnight(end).getTime() - this.midnight(start).getTime()) / 86_400_000);
  });

  constructor() {
    effect(() => {
      const value = this.formatted();
      untracked(() => this.dateChange.emit(value));
    });
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
    return target > this.midnight(start).getTime() && target < this.midnight(end).getTime();
  }

  isDisabled(day: number): boolean {
    const target = this.dateFor(day).getTime();
    const min = this.min();
    const max = this.max();
    return (!!min && target < this.midnight(min).getTime()) || (!!max && target > this.midnight(max).getTime());
  }

  isToday(day: number): boolean {
    return this.sameDay(new Date(), day);
  }

  dayLabel(day: number): string {
    return this.dateFor(day).toLocaleDateString(this.locale(), {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  pick(day: number): void {
    if (this.isDisabled(day)) return;
    const date = this.dateFor(day);
    // Pin the view, so removing the earliest date never makes the grid jump.
    this.viewMonth.set(this.month());

    if (this.mode() === 'single') return this.commit([date]);

    if (this.mode() === 'multiple') {
      const list = this.selected();
      return this.commit(
        list.some((item) => this.sameDay(item, day))
          ? list.filter((item) => !this.sameDay(item, day))
          : [...list, date]
      );
    }

    // Range: a complete range or a click before the start begins a new one.
    const current = this.selected();
    if (current.length !== 1) return this.commit([date]);
    this.commit(date.getTime() < this.midnight(current[0]).getTime() ? [date] : [current[0], date]);
  }

  shift(delta: number): void {
    const date = this.month();
    this.viewMonth.set(new Date(date.getFullYear(), date.getMonth() + delta, 1));
  }

  setHour(raw: string): void {
    const value = +raw;
    if (this.hourFormat() === '12') {
      const hour12 = this.clamp(value, 1, 12);
      this.hourOverride.set((hour12 % 12) + (this.hour() >= 12 ? 12 : 0));
    } else {
      this.hourOverride.set(this.clamp(value, 0, 23));
    }
    this.commit(this.selected());
  }

  setMinute(raw: string): void {
    this.minuteOverride.set(this.clamp(+raw, 0, 59));
    this.commit(this.selected());
  }

  toggleMeridiem(): void {
    this.hourOverride.set((this.hour() + 12) % 24);
    this.commit(this.selected());
  }

  now(): void {
    const now = new Date();
    this.hourOverride.set(now.getHours());
    this.minuteOverride.set(now.getMinutes());
    this.commit(this.selected());
  }

  /** Writes the selection back in the shape the mode uses, with the time folded in. */
  private commit(dates: Date[]): void {
    const list = dates
      .map((date) =>
        this.showTime()
          ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), this.hour(), this.minute())
          : this.midnight(date)
      )
      .sort((a, b) => a.getTime() - b.getTime());

    if (this.mode() === 'multiple') {
      this.value.set(list);
      this.rangeEnd.set(null);
      return;
    }
    this.value.set(list[0] ?? null);
    this.rangeEnd.set(this.mode() === 'range' ? (list[1] ?? null) : null);
  }

  private formatDate(date: Date): string | number {
    const format = this.format();
    if (format === 'timestamp') return date.getTime();
    if (format === 'iso') return date.toISOString();

    const pad = (value: number) => String(value).padStart(2, '0');
    const tokens: Record<string, string> = {
      yyyy: String(date.getFullYear()),
      MM: pad(date.getMonth() + 1),
      dd: pad(date.getDate()),
      HH: pad(date.getHours()),
      mm: pad(date.getMinutes())
    };
    const text = format.replace(/yyyy|MM|dd|HH|mm/g, (token) => tokens[token]);
    if (!this.showTime() || /HH|mm/.test(format)) return text;

    const time =
      this.hourFormat() === '12'
        ? `${pad(date.getHours() % 12 || 12)}:${tokens['mm']} ${date.getHours() < 12 ? 'AM' : 'PM'}`
        : `${tokens['HH']}:${tokens['mm']}`;
    return `${text} ${time}`;
  }

  private dateFor(day: number): Date {
    const month = this.month();
    return new Date(month.getFullYear(), month.getMonth(), day);
  }

  private midnight(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
