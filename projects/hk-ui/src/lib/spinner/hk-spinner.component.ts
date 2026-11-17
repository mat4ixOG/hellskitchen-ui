import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type HkSpinnerVariant = 'ring' | 'dots' | 'bars' | 'pulse' | 'orbit' | 'comet' | 'morph';

/**
 * Seven spinners, all sized in `em`, so the same component works in a button,
 * a card or a full-page overlay without a size prop.
 */
@Component({
  selector: 'hk-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hk-spinner',
    role: 'status',
    'aria-live': 'polite',
    '[class.is-inherit]': 'inherit()'
  },
  template: `
    @if (visible()) {
      @switch (variant()) {
        @case ('dots') {
          <span class="sp-dots" aria-hidden="true">
            @for (i of dots; track i) { <span [style.animation-delay.ms]="i * 140"></span> }
          </span>
        }
        @case ('bars') {
          <span class="sp-bars" aria-hidden="true">
            @for (i of bars; track i) { <span [style.animation-delay.ms]="i * 110"></span> }
          </span>
        }
        @case ('pulse') { <span class="sp-pulse" aria-hidden="true"></span> }
        @case ('orbit') { <span class="sp-orbit" aria-hidden="true"></span> }
        @case ('comet') { <span class="sp-comet" aria-hidden="true"></span> }
        @case ('morph') { <span class="sp-morph" aria-hidden="true"></span> }
        @default { <span class="sp-ring" aria-hidden="true"></span> }
      }
      <span class="hk-sr">{{ label() }}</span>
    }
  `,
  styles: `
    @layer components {
      /* Colour comes from --hk-spinner-accent, or currentColor when it sits
         inside a coloured control. */
      :host {
        --sp-accent: var(--hk-spinner-accent, #dc2626);
        --sp-track: var(--hk-spinner-track, rgb(15 23 42 / 0.12));
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
      }
      :host-context(.dark) {
        --sp-track: var(--hk-spinner-track, rgb(255 255 255 / 0.12));
      }
      :host(.is-inherit) {
        --sp-accent: currentColor;
        --sp-track: color-mix(in srgb, currentColor 35%, transparent);
      }

      .sp-ring {
        display: inline-block;
        width: 1.6em;
        height: 1.6em;
        box-sizing: border-box;
        border: 0.16em solid var(--sp-track);
        border-top-color: var(--sp-accent);
        border-radius: 50%;
        animation: sp-spin var(--hk-spinner-speed, 0.7s) linear infinite;
      }
      /* Inside a filled control there is no track to speak of. */
      :host(.is-inherit) .sp-ring { width: 1.1em; height: 1.1em; }

      .sp-dots { display: inline-flex; align-items: center; gap: 0.28em; }
      .sp-dots > span {
        width: 0.42em;
        height: 0.42em;
        border-radius: 50%;
        background: var(--sp-accent);
        animation: sp-bounce 0.9s ease-in-out infinite;
      }

      .sp-bars { display: inline-flex; align-items: flex-end; gap: 0.16em; height: 1.6em; }
      .sp-bars > span {
        width: 0.22em;
        height: 100%;
        border-radius: 0.1em;
        background: var(--sp-accent);
        transform-origin: bottom;
        animation: sp-stretch 1s ease-in-out infinite;
      }

      .sp-pulse {
        display: inline-block;
        width: 1.6em;
        height: 1.6em;
        border-radius: 50%;
        background: var(--sp-accent);
        animation: sp-throb 1.2s ease-in-out infinite;
      }

      @keyframes sp-spin { to { transform: rotate(360deg); } }
      @keyframes sp-bounce {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
        40%           { transform: translateY(-0.45em); opacity: 1; }
      }
      @keyframes sp-stretch {
        0%, 100% { transform: scaleY(0.35); opacity: 0.55; }
        50%      { transform: scaleY(1); opacity: 1; }
      }
      @keyframes sp-throb {
        0%, 100% { transform: scale(0.65); opacity: 0.45; }
        50%      { transform: scale(1); opacity: 1; }
      }

      /* Orbit — two satellites on tilted rings. */
      .sp-orbit { position: relative; display: inline-block; width: 2em; height: 2em; }
      .sp-orbit::before,
      .sp-orbit::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 0.1em solid transparent;
        border-top-color: var(--sp-accent);
        border-bottom-color: color-mix(in srgb, var(--sp-accent) 35%, transparent);
        animation: sp-spin 1.1s cubic-bezier(0.45, 0, 0.55, 1) infinite;
      }
      .sp-orbit::after {
        inset: 0.3em;
        border-top-color: color-mix(in srgb, var(--sp-accent) 55%, transparent);
        border-bottom-color: var(--sp-accent);
        animation-direction: reverse;
        animation-duration: 0.8s;
      }

      /* Comet — a conic sweep masked into a ring. */
      .sp-comet {
        display: inline-block;
        width: 2em;
        height: 2em;
        border-radius: 50%;
        background: conic-gradient(
          from 0deg,
          transparent 0deg,
          color-mix(in srgb, var(--sp-accent) 20%, transparent) 120deg,
          var(--sp-accent) 340deg,
          transparent 360deg
        );
        -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 0.22em), #000 calc(100% - 0.2em));
        mask: radial-gradient(farthest-side, transparent calc(100% - 0.22em), #000 calc(100% - 0.2em));
        animation: sp-spin 0.9s linear infinite;
      }

      /* Morph — a squircle that rolls corner to corner. */
      .sp-morph {
        display: inline-block;
        width: 1.7em;
        height: 1.7em;
        background: linear-gradient(135deg, var(--sp-accent), color-mix(in srgb, var(--sp-accent) 45%, #f59e0b));
        animation: sp-morph-roll 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
      }
      @keyframes sp-morph-roll {
        0%   { border-radius: 42% 58% 60% 40% / 45% 42% 58% 55%; transform: rotate(0deg) scale(1); }
        25%  { border-radius: 60% 40% 35% 65% / 62% 55% 45% 38%; transform: rotate(90deg) scale(0.92); }
        50%  { border-radius: 35% 65% 55% 45% / 40% 60% 40% 60%; transform: rotate(180deg) scale(1); }
        75%  { border-radius: 58% 42% 45% 55% / 55% 38% 62% 45%; transform: rotate(270deg) scale(0.92); }
        100% { border-radius: 42% 58% 60% 40% / 45% 42% 58% 55%; transform: rotate(360deg) scale(1); }
      }

      /* Still says "busy" without motion: hold a legible static state. */
      @media (prefers-reduced-motion: reduce) {
        .sp-ring, .sp-dots > span, .sp-bars > span, .sp-pulse,
        .sp-orbit::before, .sp-orbit::after, .sp-comet, .sp-morph { animation: none; }
        .sp-dots > span, .sp-bars > span { opacity: 0.7; }
        .sp-bars > span { transform: scaleY(0.7); }
        .sp-pulse { transform: scale(0.85); opacity: 0.7; }
        .sp-comet { opacity: 0.8; }
        .sp-morph { border-radius: 42% 58% 60% 40% / 45% 42% 58% 55%; opacity: 0.8; }
      }

      .hk-sr {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    }
  `
})
export class HkSpinnerComponent {
  readonly variant = input<HkSpinnerVariant>('ring');
  /** Takes colour from currentColor, for use inside a filled control. */
  readonly inherit = input(false);
  /** Text announced to assistive tech. */
  readonly label = input('Loading');
  /** Milliseconds to wait before showing — avoids a flash on fast responses. */
  readonly delay = input(0);

  readonly dots = [0, 1, 2];
  readonly bars = [0, 1, 2, 3];

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly visible = signal(true);

  constructor() {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const clear = (): void => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };

    effect(() => {
      const wait = this.delay();
      clear();
      // The server has no time to wait out; render nothing until the client does.
      if (wait <= 0) {
        this.visible.set(true);
        return;
      }
      this.visible.set(false);
      if (this.isBrowser) timer = setTimeout(() => this.visible.set(true), wait);
    });

    inject(DestroyRef).onDestroy(clear);
  }
}
