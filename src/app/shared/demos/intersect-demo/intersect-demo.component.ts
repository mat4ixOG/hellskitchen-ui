import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, signal } from '@angular/core';

/** Emits on enter and on exit — the "is this still on screen" primitive. */
@Component({
  selector: 'app-intersect-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <div #viewport class="h-44 overflow-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
        <p class="pb-28 text-center text-xs text-slate-600 dark:text-gray-400">↓ scroll the target into view</p>
        <div #target class="rounded-xl border px-3 py-6 text-center text-xs transition-colors duration-300"
          [class]="visible()
            ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-gray-400'">
          {{ visible() ? 'visible' : 'out of view' }}
        </div>
        <p class="pt-28 text-center text-[0.72rem] text-slate-600 dark:text-gray-400">keep going — it fires on exit too</p>
      </div>

      <p class="mt-2 text-xs text-slate-600 dark:text-gray-400">
        Enters: <b class="text-slate-900 dark:text-white">{{ enters() }}</b> · Exits: <b class="text-slate-900 dark:text-white">{{ exits() }}</b>
      </p>
    </div>
  `
})
export class IntersectDemoComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly visible = signal(false);
  readonly enters = signal(0);
  readonly exits = signal(0);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const root = this.host.nativeElement.querySelector<HTMLElement>('[class*="overflow-auto"]');
      const target = this.host.nativeElement.querySelector<HTMLElement>('[class*="py-6"]');
      if (!root || !target) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          const showing = entry.isIntersecting;
          if (showing === this.visible()) return;
          this.visible.set(showing);
          (showing ? this.enters : this.exits).update((count) => count + 1);
        },
        { root, threshold: 0.5 }
      );
      observer.observe(target);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
