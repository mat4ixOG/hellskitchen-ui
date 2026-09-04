import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

/** Two thumbs over one track, with the value bubble following the active one. */
@Component({
  selector: 'app-slider-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm space-y-8">
      <div>
        <div class="mb-3 flex items-baseline justify-between">
          <span class="text-xs font-semibold text-slate-600 dark:text-gray-400">Memory limit</span>
          <span class="font-mono text-sm text-slate-900 dark:text-white">{{ single() }} GB</span>
        </div>
        <input type="range" min="1" max="64" step="1" [value]="single()"
          (input)="single.set(+$any($event.target).value)"
          class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-white/10 accent-red-600"
          aria-label="Memory limit" />
      </div>

      <div>
        <div class="mb-3 flex items-baseline justify-between">
          <span class="text-xs font-semibold text-slate-600 dark:text-gray-400">Autoscale range</span>
          <span class="font-mono text-sm text-slate-900 dark:text-white">{{ low() }} – {{ high() }} pods</span>
        </div>
        <div class="relative h-1.5 rounded-full bg-slate-200 dark:bg-white/10">
          <span class="absolute h-full rounded-full bg-gradient-to-r from-red-600 to-red-800"
            [style.left.%]="low() / 40 * 100" [style.width.%]="(high() - low()) / 40 * 100"></span>
          <input type="range" min="0" max="40" [value]="low()" aria-label="Minimum pods"
            (input)="setLow(+$any($event.target).value)"
            class="pointer-events-auto absolute -top-1.5 h-4 w-full appearance-none bg-transparent accent-red-500" />
          <input type="range" min="0" max="40" [value]="high()" aria-label="Maximum pods"
            (input)="setHigh(+$any($event.target).value)"
            class="pointer-events-auto absolute -top-1.5 h-4 w-full appearance-none bg-transparent accent-red-500" />
        </div>
        <p class="mt-3 text-xs text-slate-600 dark:text-gray-400">Scales out at {{ target() }}% CPU.</p>
      </div>
    </div>
  `
})
export class SliderDemoComponent {
  readonly single = signal(16);
  readonly low = signal(4);
  readonly high = signal(18);
  readonly target = computed(() => 60 + Math.round(this.high() / 2));

  /** Thumbs may not cross — clamp instead of swapping, which feels broken. */
  setLow(value: number): void {
    this.low.set(Math.min(value, this.high() - 1));
  }

  setHigh(value: number): void {
    this.high.set(Math.max(value, this.low() + 1));
  }
}
