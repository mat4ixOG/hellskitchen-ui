import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';

export type HkSliderRange = [number, number];

/**
 * One thumb or two over a native range track. In range mode the thumbs clamp
 * against each other rather than swapping, which is what makes a range feel
 * solid instead of glitchy.
 */
@Component({
  selector: 'hk-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-slider.component.html',
  styleUrl: './hk-slider.component.css'
})
export class HkSliderComponent {
  /** Single-thumb value. Two-way bindable via `[(value)]`. */
  readonly value = model(0);
  /** Two-thumb value. Takes over from value when set. */
  readonly range = model<HkSliderRange | null>(null);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  /** Draws a mark at each step. */
  readonly ticks = input(false);
  readonly label = input('');
  /** Unit appended to the displayed value. */
  readonly suffix = input('');

  /** Emits once on release — use this to persist. */
  readonly committed = output<number | HkSliderRange>();

  readonly span = computed(() => Math.max(this.max() - this.min(), 1));

  readonly display = computed(() => {
    const range = this.range();
    return range ? `${range[0]} – ${range[1]}${this.suffix()}` : `${this.value()}${this.suffix()}`;
  });

  readonly fillLeft = computed(() => {
    const range = this.range();
    return range ? ((range[0] - this.min()) / this.span()) * 100 : 0;
  });

  readonly fillWidth = computed(() => {
    const range = this.range();
    return range ? ((range[1] - range[0]) / this.span()) * 100 : 0;
  });

  readonly tickMarks = computed(() => {
    if (!this.ticks()) return [];
    const step = this.step() > 0 ? this.step() : 1;
    const count = Math.floor(this.span() / step);
    return Array.from({ length: count + 1 }, (_, i) => ((i * step) / this.span()) * 100);
  });

  setValue(value: number): void {
    this.value.set(value);
  }

  /** Thumbs may not cross — clamp instead of swapping, which feels broken. */
  setLow(value: number, element: HTMLInputElement): void {
    const range = this.range();
    if (!range) return;
    const low = Math.min(value, range[1] - this.step());
    element.value = String(low);
    this.range.set([low, range[1]]);
  }

  setHigh(value: number, element: HTMLInputElement): void {
    const range = this.range();
    if (!range) return;
    const high = Math.max(value, range[0] + this.step());
    element.value = String(high);
    this.range.set([range[0], high]);
  }

  commit(): void {
    const range = this.range();
    this.committed.emit(range ? [range[0], range[1]] : this.value());
  }
}
