import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Illustration, message and call to action — for nothing yet, nothing
 * matching, or something broke.
 */
@Component({
  selector: 'hk-empty',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hk-empty' },
  template: `
    @if (icon()) {
      <span class="hk-empty-badge" aria-hidden="true"><i [class]="icon()"></i></span>
    }
    @if (title()) {
      <h3 class="hk-empty-title">{{ title() }}</h3>
    }
    @if (body()) {
      <p class="hk-empty-body">{{ body() }}</p>
    }
    @if (actionLabel()) {
      <button type="button" class="hk-empty-action" (click)="action.emit()">{{ actionLabel() }}</button>
    }
  `,
  styles: `
    @layer components {
      :host {
        --hk-empty-surface: #f8fafc;
        --hk-empty-line: #e2e8f0;
        --hk-empty-ink: #0f172a;
        --hk-empty-muted: #475569;
        display: block;
        padding: var(--hk-empty-pad, 2.5rem 1.5rem);
        border: 1px solid var(--hk-empty-line);
        border-radius: 1rem;
        background: var(--hk-empty-surface);
        text-align: center;
      }
      :host-context(.dark) {
        --hk-empty-surface: rgb(255 255 255 / 0.03);
        --hk-empty-line: rgb(255 255 255 / 0.1);
        --hk-empty-ink: #ffffff;
        --hk-empty-muted: #9ca3af;
      }

      .hk-empty-badge {
        display: grid;
        place-items: center;
        width: 3rem;
        height: 3rem;
        margin: 0 auto 1rem;
        border: 1px solid var(--hk-empty-line);
        border-radius: 1rem;
        background: var(--hk-empty-surface);
        font-size: 1.125rem;
        line-height: 1.75rem;
        color: var(--hk-empty-icon, var(--hk-empty-muted));
      }

      .hk-empty-title {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.25rem;
        font-weight: 600;
        color: var(--hk-empty-ink);
      }
      .hk-empty-body {
        max-width: 22rem;
        margin: 0.375rem auto 0;
        font-size: 0.75rem;
        line-height: 1.625;
        color: var(--hk-empty-muted);
      }

      .hk-empty-action {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        border: 0;
        border-radius: 0.75rem;
        background: linear-gradient(to right, #dc2626, #991b1b);
        color: #ffffff;
        font: inherit;
        font-size: 0.75rem;
        line-height: 1rem;
        font-weight: 600;
        cursor: pointer;
      }
      .hk-empty-action:focus-visible { outline: 2px solid var(--hk-accent, #dc2626); outline-offset: 2px; }
    }
  `
})
export class HkEmptyComponent {
  /** Icon class (from the consumer's icon font) shown above the title. */
  readonly icon = input('');
  readonly title = input('');
  /** Supporting sentence — say what to do next. */
  readonly body = input('');
  /** Primary button label. Omit for no button. */
  readonly actionLabel = input('');

  /** Emits when the button is pressed. */
  readonly action = output<void>();
}
