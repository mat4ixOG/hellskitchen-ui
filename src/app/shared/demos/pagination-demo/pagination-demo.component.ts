import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkPaginationComponent } from 'hellskitchen-ui';

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
  imports: [HkPaginationComponent],
  template: `
    <div class="w-full max-w-md">
      <hk-pagination [(page)]="page" [(pageSize)]="size" [total]="total" [pageSizeOptions]="sizes" />
    </div>
  `
})
export class PaginationDemoComponent {
  readonly total = 487;
  readonly sizes = [10, 25, 50, 100];

  readonly page = signal(6);
  readonly size = signal(10);
}
