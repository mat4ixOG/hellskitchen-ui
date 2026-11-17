import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/**
 * A radio group wearing stars. The icon defaults to a built-in SVG star; pass
 * any icon class through `icon` to use your own set instead.
 */
@Component({
  selector: 'hk-rating',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-rating.component.html',
  styleUrl: './hk-rating.component.css'
})
export class HkRatingComponent {
  /** Current score. Two-way bindable via `[(value)]`. */
  readonly value = model(0);
  readonly count = input(5);
  /** Allows half-step selection. */
  readonly half = input(false);
  /** Icon class for each item. Empty renders the built-in SVG star. */
  readonly icon = input('');
  /** Display only — skips focus and pointer handling. */
  readonly readonly = input(false);

  readonly hovered = signal(0);

  readonly items = computed(() => Array.from({ length: this.count() }, (_, i) => i + 1));
  readonly stepSize = computed(() => (this.half() ? 0.5 : 1));
  readonly shown = computed(() => this.hovered() || this.value());

  /** 1 = full, 0.5 = half, 0 = empty. */
  fill(item: number): number {
    const shown = this.shown();
    if (item <= shown) return 1;
    return item - 0.5 <= shown ? 0.5 : 0;
  }

  /** On a half rating, the left half of an icon picks the half step. */
  private pick(item: number, event: MouseEvent | PointerEvent): number {
    if (!this.half()) return item;
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return item;
    const rect = target.getBoundingClientRect();
    return event.clientX - rect.left < rect.width / 2 ? item - 0.5 : item;
  }

  select(item: number, event: MouseEvent): void {
    if (this.readonly()) return;
    this.value.set(this.pick(item, event));
  }

  hover(item: number, event: PointerEvent): void {
    if (this.readonly()) return;
    this.hovered.set(this.pick(item, event));
  }

  onKey(event: KeyboardEvent): void {
    if (this.readonly()) return;
    const max = this.count();
    const step = this.stepSize();
    if (event.key === 'ArrowRight') this.value.update((v) => Math.min(v + step, max));
    else if (event.key === 'ArrowLeft') this.value.update((v) => Math.max(v - step, 0));
    else if (event.key === 'Home') this.value.set(step);
    else if (event.key === 'End') this.value.set(max);
    else if (event.key === '0') this.value.set(0);
    else return;

    event.preventDefault();
  }
}
