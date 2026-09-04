import { Component, signal } from '@angular/core';

export type StepperVariant = 'rail' | 'panels' | 'progress';

/**
 * Three presentations of one stepper.
 *
 * The state is deliberately shared: `step()` and the navigation are written
 * once and every variant reads them, which is the point — swapping `variant`
 * changes how a wizard looks, never how it behaves or what it emits.
 */
@Component({
  selector: 'app-stepper-demo',
  imports: [],
  templateUrl: './stepper-demo.component.html',
  styleUrl: './stepper-demo.component.css'
})
export class StepperDemoComponent {
  readonly variants: { id: StepperVariant; label: string }[] = [
    { id: 'rail', label: 'Rail' },
    { id: 'panels', label: 'Panels' },
    { id: 'progress', label: 'Progress' }
  ];

  readonly steps = [
    { label: 'Install', detail: 'Add the package and register the theme preset in app.config.ts.' },
    { label: 'Configure', detail: 'Point the token layer at your accent, radius and density scale.' },
    { label: 'Ship', detail: 'Import the components you use. Nothing you skip reaches the bundle.' }
  ];

  readonly variant = signal<StepperVariant>('rail');
  readonly step = signal(1);

  chip(active: boolean): string {
    const base = 'cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors';
    return active
      ? `${base} border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300`
      : `${base} border-slate-200 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-white`;
  }

  go(index: number): void {
    this.step.set(index);
  }

  next(): void {
    this.step.update((s) => Math.min(s + 1, this.steps.length - 1));
  }

  prev(): void {
    this.step.update((s) => Math.max(s - 1, 0));
  }

  /** Rail stops at the last marker rather than the container edge. */
  railWidth(): number {
    return (this.step() / (this.steps.length - 1)) * 88;
  }
}
