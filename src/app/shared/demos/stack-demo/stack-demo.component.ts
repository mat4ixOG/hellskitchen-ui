import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** Direction, gap and alignment off tokens — no utility-class soup. */
@Component({
  selector: 'app-stack-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <div class="flex rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4"
        [class.flex-col]="vertical()" [style.gap.rem]="gap()"
        [style.align-items]="vertical() ? 'stretch' : 'center'">
        @for (item of [1, 2, 3]; track item) {
          <div class="grid h-12 flex-1 place-items-center rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 text-xs text-red-800 dark:text-red-200">
            item {{ item }}
          </div>
        }
      </div>

      <div class="mt-3 flex items-center gap-3">
        <button type="button" (click)="vertical.set(!vertical())"
          class="rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white">
          {{ vertical() ? 'Row' : 'Column' }}
        </button>
        <label class="flex-1 text-xs text-slate-600 dark:text-gray-400">
          gap {{ gap() }}rem
          <input type="range" min="0" max="2" step="0.25" [value]="gap()"
            (input)="gap.set(+$any($event.target).value)" class="mt-1 w-full accent-red-600" />
        </label>
      </div>
    </div>
  `
})
export class StackDemoComponent {
  readonly vertical = signal(false);
  readonly gap = signal(0.75);
}
