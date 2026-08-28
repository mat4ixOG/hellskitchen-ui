import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * The grid's pager. Standalone on purpose — it is useful on its own above a
 * card list, and keeping it out of the table keeps both templates readable.
 */
@Component({
  selector: 'hk-table-paginator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hk-pager', role: 'navigation', '[attr.aria-label]': '"Pagination"' },
  template: `
    <div class="hk-pager-info">
      @if (totalRecords() > 0) {
        Showing <b>{{ first() + 1 }}</b>–<b>{{ lastIndex() }}</b> of <b>{{ totalRecords() }}</b>
      } @else {
        No records
      }
    </div>

    <div class="hk-pager-controls">
      @if (rowsPerPageOptions().length) {
        <label class="hk-pager-size">
          <span>Rows</span>
          <select [value]="rows()" (change)="onRowsChange($event)" aria-label="Rows per page">
            @for (option of rowsPerPageOptions(); track option) {
              <option [value]="option">{{ option }}</option>
            }
          </select>
        </label>
      }

      <button type="button" class="hk-pager-btn" [disabled]="page() === 0"
        (click)="go(0)" aria-label="First page">«</button>
      <button type="button" class="hk-pager-btn" [disabled]="page() === 0"
        (click)="go(page() - 1)" aria-label="Previous page">‹</button>

      @for (item of pageItems(); track $index) {
        @if (item === -1) {
          <span class="hk-pager-gap" aria-hidden="true">…</span>
        } @else {
          <button type="button" class="hk-pager-btn"
            [class.is-active]="item === page()"
            [attr.aria-current]="item === page() ? 'page' : null"
            [attr.aria-label]="'Page ' + (item + 1)"
            (click)="go(item)">{{ item + 1 }}</button>
        }
      }

      <button type="button" class="hk-pager-btn" [disabled]="page() >= pageCount() - 1"
        (click)="go(page() + 1)" aria-label="Next page">›</button>
      <button type="button" class="hk-pager-btn" [disabled]="page() >= pageCount() - 1"
        (click)="go(pageCount() - 1)" aria-label="Last page">»</button>

      @if (showJump() && pageCount() > 1) {
        <label class="hk-pager-jump">
          <span>Go to</span>
          <input type="number" min="1" [max]="pageCount()" [value]="page() + 1"
            (change)="onJump($event)" aria-label="Go to page" />
        </label>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
      gap: .75rem; padding: calc(.6rem * var(--hk-table-density, 1)) .75rem;
      border-top: 1px solid var(--hk-table-border);
      background: var(--hk-table-footer-bg, transparent);
      font-size: var(--hk-table-font-sm, .8rem); color: var(--hk-table-muted);
      color-scheme: var(--hk-table-scheme, light);
    }
    .hk-pager-info b { color: var(--hk-table-text); font-weight: 600; }
    .hk-pager-controls { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem; }
    .hk-pager-size, .hk-pager-jump { display: inline-flex; align-items: center; gap: .35rem; margin-right: .4rem; }
    .hk-pager-size select, .hk-pager-jump input {
      appearance: none;
      background: var(--hk-table-control-bg, var(--hk-table-input-bg));
      color: var(--hk-table-text);
      border: 1px solid var(--hk-table-border); border-radius: calc(var(--hk-table-radius) / 2);
      padding: .2rem .4rem; font: inherit;
    }
    .hk-pager-size option {
      background-color: var(--hk-table-control-bg, #fff);
      color: var(--hk-table-text);
    }
    .hk-pager-jump input { width: 3.5rem; }
    .hk-pager-btn {
      min-width: 1.75rem; height: 1.75rem; padding: 0 .35rem;
      display: inline-flex; align-items: center; justify-content: center;
      background: transparent; color: var(--hk-table-muted); cursor: pointer;
      border: 1px solid transparent; border-radius: calc(var(--hk-table-radius) / 2);
      font: inherit; line-height: 1;
      transition: background var(--hk-table-motion, 160ms), color var(--hk-table-motion, 160ms);
    }
    .hk-pager-btn:hover:not(:disabled) { background: var(--hk-table-row-hover); color: var(--hk-table-text); }
    .hk-pager-btn:disabled { opacity: .35; cursor: not-allowed; }
    .hk-pager-btn.is-active {
      background: var(--hk-table-accent); border-color: var(--hk-table-accent);
      color: var(--hk-table-accent-contrast, #fff); font-weight: 600;
    }
    .hk-pager-btn:focus-visible, select:focus-visible, input:focus-visible {
      outline: 2px solid var(--hk-table-accent); outline-offset: 1px;
    }
    .hk-pager-gap { padding: 0 .15rem; }
  `]
})
export class HkTablePaginatorComponent {
  readonly first = input(0);
  readonly rows = input(10);
  readonly totalRecords = input(0);
  readonly rowsPerPageOptions = input<number[]>([]);
  readonly showJump = input(false);
  /** How many numbered buttons to show around the current page. */
  readonly pageLinks = input(5);

  readonly pageChange = output<{ first: number; rows: number }>();

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.totalRecords() / Math.max(1, this.rows()))));
  readonly page = computed(() => Math.floor(this.first() / Math.max(1, this.rows())));
  readonly lastIndex = computed(() => Math.min(this.first() + this.rows(), this.totalRecords()));

  /** Windowed page list; -1 marks an ellipsis. */
  readonly pageItems = computed<number[]>(() => {
    const count = this.pageCount();
    const current = this.page();
    const span = Math.max(1, this.pageLinks());
    if (count <= span + 2) return Array.from({ length: count }, (_, index) => index);

    const half = Math.floor(span / 2);
    let start = Math.max(0, current - half);
    let end = Math.min(count - 1, start + span - 1);
    start = Math.max(0, end - span + 1);

    const items: number[] = [];
    if (start > 0) {
      items.push(0);
      if (start > 1) items.push(-1);
    }
    for (let index = start; index <= end; index++) items.push(index);
    if (end < count - 1) {
      if (end < count - 2) items.push(-1);
      items.push(count - 1);
    }
    return items;
  });

  go(page: number): void {
    const clamped = Math.min(Math.max(0, page), this.pageCount() - 1);
    this.pageChange.emit({ first: clamped * this.rows(), rows: this.rows() });
  }

  onRowsChange(event: Event): void {
    const rows = Number((event.target as HTMLSelectElement).value) || this.rows();
    // Keep the first visible record in view rather than snapping to page 1.
    const anchor = Math.floor(this.first() / rows) * rows;
    this.pageChange.emit({ first: anchor, rows });
  }

  onJump(event: Event): void {
    const input = event.target as HTMLInputElement;
    const page = Number(input.value) - 1;
    if (Number.isNaN(page)) return;
    this.go(page);
    input.value = String(this.page() + 1);
  }
}
