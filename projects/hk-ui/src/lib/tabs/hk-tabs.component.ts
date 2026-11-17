import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChildren,
  inject,
  input,
  linkedSignal,
  model,
  output
} from '@angular/core';

export type HkTabsOrientation = 'horizontal' | 'vertical';
export type HkTabsBadgeStyle = 'count' | 'dot';

let nextTabsId = 0;

/**
 * One tab in an `hk-tabs` strip. The element itself is the `role="tab"`
 * control, so its content is the label.
 */
@Component({
  selector: 'hk-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
    @if (hasBadge()) {
      @if (tabs.badgeStyle() === 'dot') {
        <span class="hk-tab-dot" [attr.aria-label]="shownBadge() + ' unread'"></span>
      } @else {
        <span class="hk-tab-badge" [attr.aria-label]="shownBadge() + ' unread'">{{ badgeLabel() }}</span>
      }
    }
  `,
  styleUrl: './hk-tab.component.css',
  host: {
    role: 'tab',
    '[id]': 'tabId()',
    '[class.is-active]': 'isActive()',
    '[class.is-disabled]': 'disabled()',
    '[attr.aria-selected]': 'isActive()',
    '[attr.aria-controls]': 'panelId()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.tabindex]': 'isActive() ? 0 : -1',
    '(click)': 'tabs.select(value())',
    '(keydown.enter)': 'onActivateKey($event)',
    '(keydown.space)': 'onActivateKey($event)'
  }
})
export class HkTabComponent {
  readonly value = input.required<string>();
  readonly disabled = input(false);
  /** A numeric 0 renders nothing. */
  readonly badge = input<number | string | null>(null);

  readonly tabs = inject(HkTabsComponent);
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Follows the bound count, but can be cleared locally when the tab is opened. */
  readonly shownBadge = linkedSignal<number | string | null>(() => this.badge());

  readonly isActive = computed(() => this.tabs.current() === this.value());
  readonly tabId = computed(() => `${this.tabs.baseId}-tab-${this.value()}`);
  readonly panelId = computed(() => `${this.tabs.baseId}-panel-${this.value()}`);

  readonly hasBadge = computed(() => {
    const badge = this.shownBadge();
    if (badge === null || badge === '') return false;
    return typeof badge === 'number' ? badge > 0 : true;
  });

  readonly badgeLabel = computed(() => {
    const badge = this.shownBadge();
    const max = this.tabs.badgeMax();
    return typeof badge === 'number' && badge > max ? `${max}+` : String(badge ?? '');
  });

  clearBadge(): void {
    this.shownBadge.set(null);
  }

  onActivateKey(event: Event): void {
    event.preventDefault();
    this.tabs.select(this.value());
  }
}

/**
 * Tab strip with a sliding indicator. Every tab is the same width, so the
 * indicator's offset is arithmetic — `index / count` — and nothing is measured.
 */
@Component({
  selector: 'hk-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hk-tabs-list" role="tablist" [attr.aria-orientation]="orientation()" (keydown)="onKey($event)">
      @if (tabs().length) {
        <span class="hk-tabs-indicator" aria-hidden="true"
          [style.width]="orientation() === 'horizontal' ? 'calc((100% - 0.5rem) / ' + tabs().length + ')' : null"
          [style.height]="orientation() === 'vertical' ? 'calc((100% - 0.5rem) / ' + tabs().length + ')' : null"
          [style.transform]="(orientation() === 'horizontal' ? 'translateX(' : 'translateY(') + index() * 100 + '%)'"></span>
      }
      <ng-content select="hk-tab" />
    </div>
    <ng-content />
  `,
  styleUrl: './hk-tabs.component.css',
  host: {
    '[class.is-vertical]': 'orientation() === "vertical"'
  }
})
export class HkTabsComponent {
  /** Value of the selected tab. Empty means the first enabled tab. */
  readonly active = model('');
  readonly orientation = input<HkTabsOrientation>('horizontal');
  /** Whether arrow keys select as they move, or only move focus. */
  readonly activateOnFocus = input(true);
  readonly badgeStyle = input<HkTabsBadgeStyle>('count');
  readonly badgeMax = input(99);
  readonly clearBadgeOnSelect = input(true);

  readonly changed = output<string>();

  readonly tabs = contentChildren(HkTabComponent);
  readonly baseId = `hk-tabs-${nextTabsId++}`;

  readonly current = computed(
    () => this.active() || this.tabs().find((tab) => !tab.disabled())?.value() || ''
  );

  /** Drives the sliding indicator. */
  readonly index = computed(() =>
    Math.max(0, this.tabs().findIndex((tab) => tab.value() === this.current()))
  );

  /** Programmatic selection. Opening a tab is what "read" means, so its badge clears. */
  select(value: string): void {
    const tab = this.tabs().find((item) => item.value() === value);
    if (!tab || tab.disabled()) return;
    if (this.clearBadgeOnSelect()) tab.clearBadge();
    if (value === this.current()) return;
    this.active.set(value);
    this.changed.emit(value);
  }

  onKey(event: KeyboardEvent): void {
    const tabs = this.tabs().filter((tab) => !tab.disabled());
    if (!tabs.length) return;
    const vertical = this.orientation() === 'vertical';
    const target = event.target as HTMLElement | null;
    const focused = tabs.findIndex((tab) => tab.element.nativeElement === target);
    const current = focused === -1 ? 0 : focused;
    const last = tabs.length - 1;
    let next: number | null = null;

    if (event.key === (vertical ? 'ArrowDown' : 'ArrowRight')) next = current === last ? 0 : current + 1;
    if (event.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) next = current === 0 ? last : current - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = last;

    if (next === null) return;
    event.preventDefault();
    const tab = tabs[next];
    tab.element.nativeElement.focus();
    if (this.activateOnFocus()) this.select(tab.value());
  }
}

/** Panel shown while its `value` is the active tab. Place it inside `hk-tabs`. */
@Component({
  selector: 'hk-tab-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styleUrl: './hk-tab-panel.component.css',
  host: {
    role: 'tabpanel',
    '[id]': 'tabs.baseId + "-panel-" + value()',
    '[attr.aria-labelledby]': 'tabs.baseId + "-tab-" + value()',
    '[hidden]': 'tabs.current() !== value()'
  }
})
export class HkTabPanelComponent {
  readonly value = input.required<string>();
  readonly tabs = inject(HkTabsComponent);
}
