import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type HkBreadcrumbVariant = 'slash' | 'chevron' | 'pills';

export interface HkBreadcrumbItem {
  label: string;
  /** Plain link target. Without one the crumb is a button that emits `navigate`. */
  href?: string;
  /** SVG path data for a 24×24 stroked icon. */
  icon?: string;
}

/**
 * A route trail that collapses its middle when it gets long, keeping the root
 * and the last crumbs — the ones people actually navigate by. The library has
 * no router dependency: give a crumb an `href`, or listen to `navigate`.
 */
@Component({
  selector: 'hk-breadcrumb',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-breadcrumb.component.html',
  styleUrl: './hk-breadcrumb.component.css'
})
export class HkBreadcrumbComponent {
  /** Trail, root first. */
  readonly items = input<HkBreadcrumbItem[]>([]);
  /** Crumbs shown before the middle collapses behind an ellipsis. */
  readonly maxVisible = input(4);
  readonly variant = input<HkBreadcrumbVariant>('slash');
  /** Character drawn between crumbs. Ignored by chevron and pills. */
  readonly separator = input('/');
  /** Renders each crumb's icon. Always on under the chevron variant. */
  readonly icons = input(false);

  readonly navigate = output<HkBreadcrumbItem>();

  /** Expanding via the ellipsis lasts until the trail or the limit changes. */
  readonly expanded = linkedSignal<unknown, boolean>({
    source: () => [this.items(), this.maxVisible()],
    computation: () => false
  });

  /** How many trailing crumbs survive a collapse. */
  private readonly tail = computed(() => Math.max(1, this.maxVisible() - 2));

  /** `null` marks the collapsed gap, so the template stays declarative. */
  readonly shown = computed<(HkBreadcrumbItem | null)[]>(() => {
    const items = this.items();
    if (this.expanded() || items.length <= this.maxVisible()) return items;
    return [items[0], null, ...items.slice(-this.tail())];
  });

  readonly hidden = computed(() => Math.max(0, this.items().length - 1 - this.tail()));

  readonly showIcons = computed(() => this.icons() || this.variant() === 'chevron');

  activate(item: HkBreadcrumbItem): void {
    this.navigate.emit(item);
  }
}
