import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type HkDividerOrientation = 'horizontal' | 'vertical';

/**
 * A rule that can carry a label. Horizontal or vertical, and decorative by
 * default so it does not clutter the accessibility tree.
 */
@Component({
  selector: 'hk-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hk-divider',
    '[attr.data-orientation]': 'orientation()',
    '[class.has-label]': '!!label()',
    // A labelled rule keeps its text readable, so only a bare one is hidden.
    '[attr.aria-hidden]': 'decorative() && !label() ? "true" : null',
    '[attr.role]': 'decorative() ? null : "separator"',
    '[attr.aria-orientation]': 'decorative() ? null : orientation()',
    '[attr.aria-label]': 'decorative() ? null : label() || null'
  },
  template: `
    @if (label() && orientation() === 'horizontal') {
      <span class="hk-divider-line"></span>
      <span class="hk-divider-label">{{ label() }}</span>
      <span class="hk-divider-line"></span>
    }
  `,
  styles: `
    @layer components {
      :host {
        --hk-divider-rule: var(--hk-divider-color, #e2e8f0);
        --hk-divider-ink: #475569;
      }
      :host-context(.dark) {
        --hk-divider-rule: var(--hk-divider-color, rgb(255 255 255 / 0.1));
        --hk-divider-ink: #9ca3af;
      }

      :host([data-orientation='horizontal']) {
        display: block;
        height: var(--hk-divider-thickness, 1px);
        margin: 1rem 0;
        background: var(--hk-divider-rule);
      }
      :host([data-orientation='horizontal'].has-label) {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        height: auto;
        background: none;
      }

      :host([data-orientation='vertical']) {
        display: inline-block;
        align-self: center;
        flex-shrink: 0;
        width: var(--hk-divider-thickness, 1px);
        height: 1rem;
        background: var(--hk-divider-rule);
      }

      .hk-divider-line {
        flex: 1;
        height: var(--hk-divider-thickness, 1px);
        background: var(--hk-divider-rule);
      }
      .hk-divider-label {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--hk-divider-ink);
      }
    }
  `
})
export class HkDividerComponent {
  readonly orientation = input<HkDividerOrientation>('horizontal');
  /** Centred text that breaks the rule. */
  readonly label = input('');
  /** Hides it from assistive tech. Set false when it separates real sections. */
  readonly decorative = input(true);
}
