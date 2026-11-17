import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HkSliderComponent, HkSliderRange } from 'hellskitchen-ui';

/** Two thumbs over one track, with the value bubble following the active one. */
@Component({
  selector: 'app-slider-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkSliderComponent],
  template: `
    <div class="w-full max-w-sm space-y-8">
      <hk-slider [(value)]="single" [min]="1" [max]="64" [step]="1" label="Memory limit" suffix=" GB" />

      <div>
        <hk-slider [(range)]="pods" [min]="0" [max]="40" label="Autoscale range" suffix=" pods" />
        <p class="mt-3 text-xs text-slate-600 dark:text-gray-400">Scales out at {{ target() }}% CPU.</p>
      </div>
    </div>
  `
})
export class SliderDemoComponent {
  readonly single = signal(16);
  readonly pods = signal<HkSliderRange | null>([4, 18]);
  readonly target = computed(() => 60 + Math.round((this.pods()?.[1] ?? 0) / 2));
}
