import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  untracked
} from '@angular/core';

let nextAccordionPanelId = 0;

/**
 * One panel of an `hk-accordion`. The header is a real button inside a
 * heading, and the body animates on grid-template-rows so content of unknown
 * height still eases properly.
 */
@Component({
  selector: 'hk-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hk-panel' },
  template: `
    <h3 class="hk-panel-heading">
      <button type="button" class="hk-panel-header"
        [id]="headerId()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="regionId()"
        [disabled]="disabled()"
        (click)="toggle()"
        (keydown)="onKey($event)">
        <span>{{ header() }}</span>
        <svg class="hk-panel-chevron" [class.is-open]="isOpen()" viewBox="0 0 16 16" width="12" height="12"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3.5 6 8 10.5 12.5 6" />
        </svg>
      </button>
    </h3>

    <div class="hk-panel-region" role="region"
      [id]="regionId()"
      [attr.aria-labelledby]="headerId()"
      [attr.inert]="isOpen() ? null : ''"
      [class.is-open]="isOpen()">
      <div class="hk-panel-body"><ng-content /></div>
    </div>
  `,
  styles: `
    @layer components {
      :host {
        display: block;
        --hk-accordion-ink: #334155;
        --hk-accordion-ink-strong: #0f172a;
        --hk-accordion-body: #475569;
        --hk-accordion-chevron: var(--hk-accent, #dc2626);
      }
      :host-context(.dark) {
        --hk-accordion-ink: #d1d5db;
        --hk-accordion-ink-strong: #ffffff;
        --hk-accordion-body: #9ca3af;
        --hk-accordion-chevron: #f87171;
        --hk-accordion-divider: rgb(255 255 255 / 0.05);
      }
      :host + :host { border-top: 1px solid var(--hk-accordion-divider, #e2e8f0); }

      .hk-panel-heading { margin: 0; font: inherit; }

      .hk-panel-header {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.25rem;
        border: 0;
        background: transparent;
        text-align: left;
        font: inherit;
        font-size: 0.875rem;
        line-height: 1.25rem;
        font-weight: 600;
        color: var(--hk-accordion-ink);
        cursor: pointer;
        transition: color 150ms ease;
      }
      .hk-panel-header:hover { color: var(--hk-accordion-ink-strong); }
      .hk-panel-header:disabled { cursor: not-allowed; opacity: 0.4; color: var(--hk-accordion-ink); }
      .hk-panel-header:focus-visible {
        outline: 2px solid var(--hk-accent, #dc2626);
        outline-offset: -2px;
      }

      .hk-panel-chevron {
        flex-shrink: 0;
        color: var(--hk-accordion-chevron);
        transition: transform 300ms ease;
      }
      .hk-panel-chevron.is-open { transform: rotate(180deg); }

      .hk-panel-region {
        display: grid;
        grid-template-rows: 0fr;
        overflow: hidden;
        opacity: 0;
        transition: grid-template-rows 300ms ease-out, opacity 300ms ease-out;
      }
      .hk-panel-region.is-open { grid-template-rows: 1fr; opacity: 1; }

      .hk-panel-body {
        min-height: 0;
        padding: 0 1.25rem 1rem;
        font-size: 0.875rem;
        line-height: 1.625;
        color: var(--hk-accordion-body);
      }

      @media (prefers-reduced-motion: reduce) {
        .hk-panel-region, .hk-panel-chevron { transition: none; }
      }
    }
  `
})
export class HkAccordionPanelComponent {
  /** Panel id, as used by the accordion's `open` list. */
  readonly id = input<string>(`hk-panel-${nextAccordionPanelId++}`);
  readonly header = input('');
  /** A disabled header is skipped by the arrow keys rather than focused. */
  readonly disabled = input(false);

  private readonly accordion = inject(forwardRef(() => HkAccordionComponent));
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly headerId = computed(() => `hk-acc-header-${this.id()}`);
  readonly regionId = computed(() => `hk-acc-panel-${this.id()}`);
  readonly isOpen = computed(() => this.accordion.open().includes(this.id()));

  toggle(): void {
    this.accordion.toggle(this.id());
  }

  onKey(event: KeyboardEvent): void {
    this.accordion.onKey(event, this);
  }

  /** @internal */
  focus(): void {
    this.host.nativeElement.querySelector<HTMLButtonElement>('.hk-panel-header')?.focus();
  }
}

/**
 * Height-animated panels, single or multi expand.
 *
 * Headers behave as one widget: arrows move between them and wrap, Home and
 * End jump to the ends, and disabled headers are skipped.
 */
@Component({
  selector: 'hk-accordion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hk-accordion' },
  template: `<ng-content />`,
  styles: `
    @layer components {
      :host {
        display: block;
        border: 1px solid #e2e8f0;
        border-radius: var(--hk-accordion-radius, 0.75rem);
        background: #f8fafc;
      }
      :host-context(.dark) {
        border-color: rgb(255 255 255 / 0.1);
        background: rgb(255 255 255 / 0.03);
      }
    }
  `
})
export class HkAccordionComponent {
  /**
   * Allows more than one panel open. Switching back to single keeps only the
   * first, so the mode is never contradicted by the state.
   */
  readonly multiple = model(false);
  /** Ids of open panels. Two-way bindable. */
  readonly open = model<string[]>([]);
  /** Whether the last open panel can be closed. */
  readonly collapsible = input(true);

  /** Emits the panel id that changed. */
  readonly toggled = output<string>();

  readonly panels = contentChildren(HkAccordionPanelComponent);
  private readonly enabled = computed(() => this.panels().filter((panel) => !panel.disabled()));

  constructor() {
    // Single mode must never be left holding a multi-open state.
    effect(() => {
      if (this.multiple()) return;
      const ids = untracked(this.open);
      if (ids.length > 1) untracked(() => this.open.set(ids.slice(0, 1)));
    });
  }

  isOpen(id: string): boolean {
    return this.open().includes(id);
  }

  toggle(id: string): void {
    const panel = this.panels().find((item) => item.id() === id);
    if (panel?.disabled()) return;
    const isOpen = this.isOpen(id);
    if (isOpen && !this.collapsible() && this.open().length === 1) return;

    if (this.multiple()) {
      this.open.update((ids) => (isOpen ? ids.filter((item) => item !== id) : [...ids, id]));
    } else {
      this.open.set(isOpen ? [] : [id]);
    }
    this.toggled.emit(id);
  }

  /** Opens every enabled panel; implies multiple. */
  expandAll(): void {
    this.open.set(this.enabled().map((panel) => panel.id()));
    this.multiple.set(true);
  }

  /** Closes every panel. */
  collapseAll(): void {
    this.open.set([]);
  }

  /** @internal */
  onKey(event: KeyboardEvent, panel: HkAccordionPanelComponent): void {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    const order = this.enabled();
    const last = order.length - 1;
    const current = order.indexOf(panel);
    if (current === -1) return;

    let next = current;
    if (event.key === 'ArrowDown') next = current === last ? 0 : current + 1;
    if (event.key === 'ArrowUp') next = current === 0 ? last : current - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = last;

    event.preventDefault();
    order[next].focus();
  }
}
