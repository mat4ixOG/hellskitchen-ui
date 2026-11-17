import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal
} from '@angular/core';

/**
 * Page links that window with an ellipsis, so the control keeps a stable width
 * on page 2 or page 200. The page-size control is a button and a panel rather
 * than a native select, whose OS-painted option list ignores the theme.
 */
@Component({
  selector: 'hk-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-pagination.component.html',
  styleUrl: './hk-pagination.component.css'
})
export class HkPaginationComponent {
  /** Current page, 1-based. */
  readonly page = model(1);
  /** Rows per page. */
  readonly pageSize = model(10);
  /** Total record count. */
  readonly total = input(0);
  /** How many numbered links to show, counting the first and last page. */
  readonly pageLinks = input(5);
  /** Page sizes offered. Empty hides the selector. */
  readonly pageSizeOptions = input<number[]>([]);

  readonly sizeOpen = signal(false);

  readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))));
  readonly firstRow = computed(() => (this.total() ? (this.page() - 1) * this.pageSize() + 1 : 0));
  readonly lastRow = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  /** `0` marks an ellipsis so the template stays declarative. */
  readonly items = computed<number[]>(() => {
    const count = this.pages();
    const current = this.page();
    const links = Math.max(3, this.pageLinks());
    if (count <= links + 2) return Array.from({ length: count }, (_, i) => i + 1);

    const span = links - 2;
    const start = current - Math.floor(span / 2);
    const window = Array.from({ length: span }, (_, i) => start + i).filter(
      (page) => page > 1 && page < count
    );
    const out = [1, ...window, count];
    const withGaps: number[] = [];
    out.forEach((page, index) => {
      if (index > 0 && page - out[index - 1] > 1) withGaps.push(0);
      withGaps.push(page);
    });
    return withGaps;
  });

  go(page: number): void {
    const next = Math.min(Math.max(1, page), this.pages());
    if (next !== this.page()) this.page.set(next);
  }

  /** Keeps the first visible record in view instead of snapping to page 1. */
  resize(size: number): void {
    this.sizeOpen.set(false);
    if (size === this.pageSize()) return;
    const firstIndex = (this.page() - 1) * this.pageSize();
    this.pageSize.set(size);
    this.go(Math.floor(firstIndex / size) + 1);
  }
}
