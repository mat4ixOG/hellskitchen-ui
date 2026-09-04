import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

/**
 * Ellipsis windowing that never jumps width as you page through.
 *
 * The page-size control is a button and a panel rather than a native `select`.
 * A native option list is painted by the OS, not the page: it ignores the
 * component's classes and comes back white on a dark theme. Owning the panel is
 * the only way the dropdown can follow the theme the rest of the row is using.
 */
@Component({
  selector: 'app-pagination-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-md">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-neutral-950">
        <span class="text-xs text-slate-600 dark:text-gray-400">
          {{ (page() - 1) * size() + 1 }}–{{ lastRow() }} of {{ total }}
        </span>

        <div class="flex items-center gap-1">
          <button type="button" class="h-7 w-7 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/5"
            [disabled]="page() === 1" (click)="go(page() - 1)" aria-label="Previous">‹</button>

          @for (item of items(); track $index) {
            @if (item === 0) {
              <span class="px-1 text-slate-400 dark:text-gray-500">…</span>
            } @else {
              <button type="button" (click)="go(item)"
                class="h-7 min-w-7 rounded-lg px-1.5 text-xs transition-colors"
                [class]="item === page()
                  ? 'bg-red-700 font-semibold text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-white/5'"
                [attr.aria-current]="item === page() ? 'page' : null">{{ item }}</button>
            }
          }

          <button type="button" class="h-7 w-7 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-white/5"
            [disabled]="page() === pages()" (click)="go(page() + 1)" aria-label="Next">›</button>
        </div>

        <!-- Page size -->
        <div class="relative">
          <button type="button" (click)="sizeOpen.set(!sizeOpen())" [attr.aria-expanded]="sizeOpen()"
            aria-haspopup="listbox" aria-label="Rows per page"
            class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 transition-colors hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200 dark:hover:border-white/20">
            {{ size() }} / page
            <span class="text-slate-500 transition-transform dark:text-gray-400" [class.rotate-180]="sizeOpen()">▾</span>
          </button>

          @if (sizeOpen()) {
            <ul role="listbox" aria-label="Rows per page"
              class="absolute bottom-full right-0 z-20 mb-1 w-28 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-neutral-950 dark:shadow-black/60">
              @for (option of sizes; track option) {
                <li>
                  <button type="button" role="option" [attr.aria-selected]="size() === option"
                    (click)="resize(option)"
                    class="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                    [class]="size() === option
                      ? 'font-semibold text-red-600 dark:text-red-400'
                      : 'text-slate-700 dark:text-gray-300'">
                    {{ option }} / page
                    @if (size() === option) { <span>✓</span> }
                  </button>
                </li>
              }
            </ul>
          }
        </div>
      </div>
    </div>
  `
})
export class PaginationDemoComponent {
  readonly total = 487;
  readonly sizes = [10, 25, 50, 100];

  readonly page = signal(6);
  readonly size = signal(10);
  readonly sizeOpen = signal(false);

  readonly pages = computed(() => Math.ceil(this.total / this.size()));
  readonly lastRow = computed(() => Math.min(this.page() * this.size(), this.total));

  /** 0 marks an ellipsis so the template stays declarative. */
  readonly items = computed<number[]>(() => {
    const count = this.pages();
    const current = this.page();
    if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);

    const window = [current - 1, current, current + 1].filter((page) => page > 1 && page < count);
    const out = [1, ...window, count];
    const withGaps: number[] = [];
    out.forEach((page, index) => {
      if (index > 0 && page - out[index - 1] > 1) withGaps.push(0);
      withGaps.push(page);
    });
    return withGaps;
  });

  go(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.pages()));
  }

  resize(size: number): void {
    this.size.set(size);
    this.sizeOpen.set(false);
    this.go(1);
  }
}
