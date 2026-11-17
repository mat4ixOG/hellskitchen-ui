import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type HkProgressVariant = 'linear' | 'circular';

const HK_PROGRESS_RADIUS = 19;
const HK_PROGRESS_CIRCUMFERENCE = 2 * Math.PI * HK_PROGRESS_RADIUS;

/**
 * Linear and circular progress off the same value, plus an indeterminate mode
 * for when there is genuinely no percentage to report.
 */
@Component({
  selector: 'hk-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hk-progress',
    role: 'progressbar',
    '[attr.data-variant]': 'variant()',
    '[class.is-indeterminate]': 'indeterminate()',
    '[attr.aria-label]': 'label() || null',
    // Omitted entirely when indeterminate: that is how a screen reader knows
    // the duration is unknown.
    '[attr.aria-valuenow]': 'indeterminate() ? null : clamped()',
    '[attr.aria-valuemin]': 'indeterminate() ? null : 0',
    '[attr.aria-valuemax]': 'indeterminate() ? null : 100'
  },
  template: `
    @if (variant() === 'circular') {
      <span class="hk-progress-ring">
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <circle class="hk-progress-ring-track" cx="22" cy="22" [attr.r]="radius" fill="none" stroke-width="4" />
          <circle class="hk-progress-ring-fill" cx="22" cy="22" [attr.r]="radius" fill="none" stroke-width="4"
            stroke-linecap="round"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="offset()" />
        </svg>
        @if (showValue() && !indeterminate()) {
          <span class="hk-progress-ring-value">{{ clamped() }}%</span>
        }
      </span>
    } @else {
      @if (label() || (showValue() && !indeterminate())) {
        <span class="hk-progress-head" aria-hidden="true">
          <span class="hk-progress-label">{{ label() }}</span>
          @if (showValue() && !indeterminate()) {
            <span class="hk-progress-value">{{ clamped() }}%</span>
          }
        </span>
      }
      <span class="hk-progress-track">
        <span class="hk-progress-fill" [style.width.%]="indeterminate() ? null : clamped()"></span>
      </span>
    }
  `,
  styles: `
    @layer components {
      :host {
        display: block;
        --hk-progress-track-color: var(--hk-progress-track, rgb(15 23 42 / 0.1));
        --hk-progress-label-ink: #475569;
        --hk-progress-value-ink: #0f172a;
      }
      :host-context(.dark) {
        --hk-progress-track-color: var(--hk-progress-track, rgb(255 255 255 / 0.1));
        --hk-progress-label-ink: #9ca3af;
        --hk-progress-value-ink: #ffffff;
      }

      .hk-progress-head {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 0.75rem;
        line-height: 1rem;
      }
      .hk-progress-label { color: var(--hk-progress-label-ink); }
      .hk-progress-value {
        color: var(--hk-progress-value-ink);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }

      .hk-progress-track {
        display: block;
        height: var(--hk-progress-height, 0.5rem);
        overflow: hidden;
        border-radius: 9999px;
        background: var(--hk-progress-track-color);
      }
      .hk-progress-fill {
        display: block;
        height: 100%;
        border-radius: 9999px;
        background: var(--hk-progress-fill, linear-gradient(90deg, #dc2626, #991b1b));
        transition: width 300ms ease;
      }
      :host(.is-indeterminate) .hk-progress-fill {
        width: 33.333%;
        opacity: 0.8;
        animation: hk-progress-slide 1.4s ease-in-out infinite;
      }

      @keyframes hk-progress-slide {
        from { transform: translateX(-100%); }
        to   { transform: translateX(300%); }
      }

      .hk-progress-ring {
        position: relative;
        display: inline-grid;
        place-items: center;
        width: 4rem;
        height: 4rem;
      }
      .hk-progress-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
      .hk-progress-ring-track { stroke: var(--hk-progress-track-color); }
      .hk-progress-ring-fill {
        stroke: var(--hk-accent, #dc2626);
        transition: stroke-dashoffset 300ms ease;
      }
      :host(.is-indeterminate) .hk-progress-ring svg { animation: hk-progress-spin 1s linear infinite; }
      @keyframes hk-progress-spin { to { transform: rotate(270deg); } }

      .hk-progress-ring-value {
        position: absolute;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--hk-progress-value-ink);
      }

      @media (prefers-reduced-motion: reduce) {
        .hk-progress-fill, .hk-progress-ring-fill { transition: none; }
        :host(.is-indeterminate) .hk-progress-fill { animation: none; transform: translateX(100%); }
        :host(.is-indeterminate) .hk-progress-ring svg { animation: none; }
      }
    }
  `
})
export class HkProgressComponent {
  /** Percentage, 0–100. */
  readonly value = input(0);
  readonly variant = input<HkProgressVariant>('linear');
  /** Unknown duration; ignores value. */
  readonly indeterminate = input(false);
  /** Accessible name for the bar. */
  readonly label = input('');
  /** Renders the percentage next to the bar. */
  readonly showValue = input(false);

  readonly radius = HK_PROGRESS_RADIUS;
  readonly circumference = HK_PROGRESS_CIRCUMFERENCE;

  readonly clamped = computed(() => Math.min(100, Math.max(0, Number(this.value()) || 0)));
  readonly offset = computed(() =>
    this.indeterminate()
      ? this.circumference * 0.7
      : this.circumference * (1 - this.clamped() / 100)
  );
}
