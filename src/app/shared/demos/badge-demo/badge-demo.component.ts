import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** Count, dot and overflow ("99+"), anchored to whatever you like. */
@Component({
  selector: 'app-badge-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <div class="flex items-center gap-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-6">
        <span class="relative inline-block">
          <i class="pi pi-bell text-xl text-slate-700 dark:text-gray-300"></i>
          @if (count() > 0) {
            <span class="absolute -right-2 -top-2 min-w-4 rounded-full bg-red-600 px-1 text-center text-[0.72rem] font-bold leading-4 text-white">
              {{ label() }}
            </span>
          }
        </span>

        <span class="relative inline-block">
          <i class="pi pi-inbox text-xl text-slate-700 dark:text-gray-300"></i>
          @if (count() > 0) {
            <span class="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-black"></span>
          }
        </span>

        <button type="button"
          class="relative rounded-xl border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs text-slate-700 dark:text-gray-300">
          Inbox
          <span class="ml-2 rounded-full bg-slate-200 dark:bg-white/10 px-1.5 text-[0.72rem] font-bold text-slate-900 dark:text-white">{{ label() }}</span>
        </button>
      </div>

      <div class="mt-3 flex gap-1.5">
        @for (step of [0, 3, 42, 128]; track step) {
          <button type="button" (click)="count.set(step)"
            class="rounded-lg border px-2.5 py-1 text-xs transition-colors"
            [class]="count() === step ? 'border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-950/40 text-slate-900 dark:text-white' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400'">
            {{ step }}
          </button>
        }
      </div>
    </div>
  `
})
export class BadgeDemoComponent {
  readonly count = signal(42);

  /** Anything past 99 collapses, so the badge never widens the layout. */
  label(): string {
    return this.count() > 99 ? '99+' : String(this.count());
  }
}
