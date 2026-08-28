import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RevealDirective } from '../../directives/reveal.directive';

/** Scroll-triggered entrance with a stagger, reduced-motion aware. */
@Component({
  selector: 'app-reveal-demo',
  imports: [RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <div class="h-44 overflow-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
        <p class="pb-24 text-center text-xs text-slate-600 dark:text-gray-400">↓ scroll this box</p>
        @for (card of cards; track card; let i = $index) {
          <div appReveal [revealDelay]="i * 90" [revealThreshold]="0.2"
            class="mb-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-3 py-2.5 text-xs text-slate-700 dark:text-gray-300">
            {{ card }}
          </div>
        }
        <p class="pt-4 text-center text-[0.72rem] text-slate-600 dark:text-gray-400">each card fades in once</p>
      </div>

      <button type="button" (click)="reset()"
        class="mt-3 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white">
        Replay
      </button>
    </div>
  `
})
export class RevealDemoComponent {
  readonly cards = ['Observes once, then unhooks', 'Delay drives the stagger', 'Honours prefers-reduced-motion'];
  readonly nonce = signal(0);

  /** Re-keys nothing structural — the directive re-runs on re-entry. */
  reset(): void {
    this.nonce.update((value) => value + 1);
    document.querySelectorAll('app-reveal-demo [data-reveal]').forEach((element) => {
      element.classList.remove('is-visible');
    });
  }
}
