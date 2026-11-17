import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

export type HkAlertTone = 'info' | 'success' | 'warning' | 'danger';

/**
 * An inline banner in four tones. Dismissal actually removes it, and the tone
 * is carried by an icon as well as colour.
 */
@Component({
  selector: 'hk-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hk-alert',
    '[attr.data-tone]': 'tone()',
    '[attr.role]': 'visible() ? role() : null',
    '[class.is-dismissed]': '!visible()'
  },
  template: `
    @if (visible()) {
      <span class="hk-alert-icon" aria-hidden="true">
        @if (icon()) {
          <i [class]="icon()"></i>
        } @else {
          <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            @switch (tone()) {
              @case ('success') { <circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" /> }
              @case ('warning') { <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /> }
              @case ('danger') { <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /> }
              @default { <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /> }
            }
          </svg>
        }
      </span>
      <div class="hk-alert-content">
        @if (title()) {
          <p class="hk-alert-title">{{ title() }}</p>
        }
        <div class="hk-alert-body"><ng-content /></div>
      </div>
      @if (dismissible()) {
        <button type="button" class="hk-alert-close" (click)="dismiss()"
          [attr.aria-label]="'Dismiss ' + (title() || 'alert')">&times;</button>
      }
    }
  `,
  styles: `
    @layer components {
      :host {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
        border: 1px solid var(--hk-alert-border);
        border-radius: var(--hk-alert-radius, 12px);
        background: var(--hk-alert-bg);
        color: var(--hk-alert-ink);
      }
      :host(.is-dismissed) { display: none; }

      :host([data-tone='info']) {
        --hk-alert-bg: var(--hk-alert-info-bg, #f0f9ff); --hk-alert-border: #bae6fd; --hk-alert-ink: #075985;
        --hk-alert-bg-dark: rgb(8 47 73 / 0.4); --hk-alert-border-dark: rgb(7 89 133 / 0.5); --hk-alert-ink-dark: #bae6fd;
      }
      :host([data-tone='success']) {
        --hk-alert-bg: var(--hk-alert-success-bg, #ecfdf5); --hk-alert-border: #a7f3d0; --hk-alert-ink: #065f46;
        --hk-alert-bg-dark: rgb(2 44 34 / 0.4); --hk-alert-border-dark: rgb(6 95 70 / 0.5); --hk-alert-ink-dark: #a7f3d0;
      }
      :host([data-tone='warning']) {
        --hk-alert-bg: var(--hk-alert-warning-bg, #fffbeb); --hk-alert-border: #fde68a; --hk-alert-ink: #92400e;
        --hk-alert-bg-dark: rgb(69 26 3 / 0.4); --hk-alert-border-dark: rgb(146 64 14 / 0.5); --hk-alert-ink-dark: #fde68a;
      }
      :host([data-tone='danger']) {
        --hk-alert-bg: var(--hk-alert-danger-bg, #fef2f2); --hk-alert-border: #fecaca; --hk-alert-ink: #991b1b;
        --hk-alert-bg-dark: rgb(69 10 10 / 0.4); --hk-alert-border-dark: rgb(153 27 27 / 0.5); --hk-alert-ink-dark: #fecaca;
      }
      /* Dark mode swaps the whole skin at once rather than per tone. */
      :host-context(.dark) {
        background: var(--hk-alert-bg-dark);
        border-color: var(--hk-alert-border-dark);
        color: var(--hk-alert-ink-dark);
      }

      .hk-alert-icon {
        display: inline-flex;
        margin-top: 0.125rem;
        font-size: 0.875rem;
        line-height: 1.25rem;
      }
      .hk-alert-content { flex: 1; min-width: 0; }
      .hk-alert-title { margin: 0; font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; }
      .hk-alert-body { margin-top: 0.125rem; font-size: 0.75rem; line-height: 1rem; opacity: 0.8; }
      .hk-alert-body:empty { display: none; }

      .hk-alert-close {
        border: 0;
        padding: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        line-height: 1.25rem;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 150ms ease;
      }
      .hk-alert-close:hover { opacity: 1; }
      .hk-alert-close:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; opacity: 1; }
    }
  `
})
export class HkAlertComponent {
  /** Sets the skin and the icon. */
  readonly tone = input<HkAlertTone>('info');
  /** Bold first line. */
  readonly title = input('');
  /** Shows the close button. */
  readonly dismissible = input(false);
  /** Icon class that overrides the built-in tone icon. */
  readonly icon = input<string | null>(null);

  /** Emits when closed. */
  readonly dismissed = output<void>();

  readonly visible = signal(true);

  /** Danger and warning interrupt; info and success do not. */
  readonly role = computed(() =>
    this.tone() === 'danger' || this.tone() === 'warning' ? 'alert' : 'status'
  );

  dismiss(): void {
    this.visible.set(false);
    this.dismissed.emit();
  }
}
