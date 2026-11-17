import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  contentChild,
  input,
  output
} from '@angular/core';

export type HkCardMediaPosition = 'top' | 'left';

/** Marks the media slot of an `hk-card`. */
@Directive({ selector: '[hkCardMedia]', standalone: true })
export class HkCardMediaDirective {}

/** Marks the header slot of an `hk-card`. */
@Directive({ selector: '[hkCardHeader]', standalone: true })
export class HkCardHeaderDirective {}

/** Marks the body slot of an `hk-card`. */
@Directive({ selector: '[hkCardBody]', standalone: true })
export class HkCardBodyDirective {}

/** Marks the footer slot of an `hk-card`. */
@Directive({ selector: '[hkCardFooter]', standalone: true })
export class HkCardFooterDirective {}

/**
 * A surface with four optional slots — media, header, body, footer. None of
 * them implies another; the card supplies only the padding and the rules
 * between whatever is actually present, so an omitted slot leaves no stray
 * line or gap.
 */
@Component({
  selector: 'hk-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hk-card',
    '[attr.data-media]': 'hasMedia() ? mediaPosition() : null',
    '[class.is-interactive]': 'interactive()',
    '[class.has-dividers]': 'dividers()',
    '[attr.tabindex]': 'interactive() ? 0 : null',
    '[attr.role]': 'interactive() ? "button" : null',
    '[style.--hk-card-pad]': 'padding()',
    '(click)': 'onActivate($event)',
    '(keydown.enter)': 'onActivate($event)',
    '(keydown.space)': 'onActivate($event)'
  },
  template: `
    @if (hasMedia()) {
      <div class="hk-card-media"><ng-content select="[hkCardMedia]" /></div>
    }
    <div class="hk-card-content">
      @if (hasHeader()) {
        <div class="hk-card-header" [class.is-alone]="!hasBody()"><ng-content select="[hkCardHeader]" /></div>
      }
      @if (hasBody()) {
        <div class="hk-card-body" [class.after-header]="hasHeader()"><ng-content select="[hkCardBody]" /></div>
      }
      @if (hasFooter()) {
        <div class="hk-card-footer" [class.is-ruled]="hasHeader() || hasBody()"><ng-content select="[hkCardFooter]" /></div>
      }
      <ng-content />
    </div>
  `,
  styles: `
    @layer components {
      :host {
        --hk-card-surface: var(--hk-card-bg, #ffffff);
        --hk-card-line: var(--hk-card-border, #e2e8f0);
        --hk-card-rule: rgb(226 232 240 / 0.6);
        display: block;
        overflow: hidden;
        border: 1px solid var(--hk-card-line);
        border-radius: var(--hk-card-radius, 16px);
        background: var(--hk-card-surface);
      }
      :host-context(.dark) {
        --hk-card-surface: var(--hk-card-bg, #0a0a0a);
        --hk-card-line: var(--hk-card-border, rgb(255 255 255 / 0.1));
        --hk-card-rule: rgb(255 255 255 / 0.05);
      }

      :host([data-media='left']) { display: flex; }
      :host([data-media='left']) .hk-card-media { flex: 0 0 auto; }
      :host([data-media='left']) .hk-card-content { flex: 1; min-width: 0; }

      .hk-card-media { display: block; }

      .hk-card-header { padding: 1rem 1rem 0; }
      .hk-card-header.is-alone { padding-bottom: 1rem; }

      .hk-card-body { padding: var(--hk-card-pad, 1rem); }
      .hk-card-body.after-header { padding-top: 0.75rem; padding-bottom: 0.75rem; }

      .hk-card-footer { padding: 0.625rem 1rem; }
      :host(.has-dividers) .hk-card-footer.is-ruled { border-top: 1px solid var(--hk-card-rule); }

      :host(.is-interactive) {
        cursor: pointer;
        transition: transform 160ms ease, box-shadow 160ms ease;
      }
      :host(.is-interactive:hover) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgb(15 23 42 / 0.08);
      }
      :host(.is-interactive:focus-visible) {
        outline: 2px solid var(--hk-accent, #dc2626);
        outline-offset: 2px;
      }
      @media (prefers-reduced-motion: reduce) {
        :host(.is-interactive) { transition: none; }
        :host(.is-interactive:hover) { transform: none; }
      }
    }
  `
})
export class HkCardComponent {
  /** Media above the content, or beside it as a rail. */
  readonly mediaPosition = input<HkCardMediaPosition>('top');
  /** Rules between the slots that are actually present. */
  readonly dividers = input(true);
  /** Adds hover lift and makes the whole card the click target. */
  readonly interactive = input(false);
  /** Inner padding for the body slot. */
  readonly padding = input('1rem');

  /** Emits on click or Enter when interactive. */
  readonly activated = output<Event>();

  private readonly media = contentChild(HkCardMediaDirective);
  private readonly header = contentChild(HkCardHeaderDirective);
  private readonly body = contentChild(HkCardBodyDirective);
  private readonly footer = contentChild(HkCardFooterDirective);

  readonly hasMedia = computed(() => !!this.media());
  readonly hasHeader = computed(() => !!this.header());
  readonly hasBody = computed(() => !!this.body());
  readonly hasFooter = computed(() => !!this.footer());

  onActivate(event: Event): void {
    if (!this.interactive()) return;
    if (event instanceof KeyboardEvent) {
      // Keys pressed inside a nested control belong to that control.
      if (event.target !== event.currentTarget) return;
      event.preventDefault();
    }
    this.activated.emit(event);
  }
}
