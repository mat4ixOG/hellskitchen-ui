import { Component, DestroyRef, inject } from '@angular/core';
import { HkToastHostComponent, HkToastService, HkToastTone } from 'hellskitchen-ui';

@Component({
  selector: 'app-toast-demo',
  imports: [HkToastHostComponent],
  templateUrl: './toast-demo.component.html',
  styleUrl: './toast-demo.component.css'
})
export class ToastDemoComponent {
  readonly toast = inject(HkToastService);

  /** Drives the trigger row, so a new tone is one entry rather than a button. */
  readonly tones: { tone: HkToastTone; label: string }[] = [
    { tone: 'success', label: 'Push success' },
    { tone: 'info', label: 'Push info' },
    { tone: 'warn', label: 'Push warning' },
    { tone: 'danger', label: 'Push error' }
  ];

  constructor() {
    // The stack lives in a root service; leave nothing behind for the next page.
    inject(DestroyRef).onDestroy(() => this.toast.clear());
  }

  push(tone: HkToastTone): void {
    const copy: Record<HkToastTone, { title: string; body: string }> = {
      success: { title: 'Deployed', body: 'v0.1.4 is live in 3 regions.' },
      info: { title: 'Heads up', body: 'A new component landed on main.' },
      warn: { title: 'Quota at 82%', body: 'eu-west-1 will throttle at 100%.' },
      danger: { title: 'Build failed', body: 'Two type errors in ui/switch.' }
    };

    this.toast.push({ tone, ...copy[tone], duration: 4200 });
  }

  /** The trigger button. Same hue as its toast, one step quieter. */
  triggerClass(tone: HkToastTone): string {
    const base =
      'rounded-lg border px-4 py-2 text-xs font-semibold transition cursor-pointer';
    return `${base} ${
      {
        success:
          'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/70',
        info: 'border-sky-200 dark:border-sky-800/50 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950/70',
        warn: 'border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950/70',
        danger:
          'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/70'
      }[tone]
    }`;
  }
}
