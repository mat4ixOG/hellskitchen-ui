import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';

export type HkScrollAreaAxis = 'y' | 'x' | 'both';

/** Which vertical edges of an `hk-scroll-area` are currently reached. */
export interface HkScrollAreaEdges {
  top: boolean;
  bottom: boolean;
}

/**
 * Styled scrollbars with edge fades that track the real scroll position, so a
 * fade only appears when there is genuinely more content that way.
 */
@Component({
  selector: 'hk-scroll-area',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hk-scroll-area' },
  template: `
    @if (fade() && !atTop()) {
      <span class="hk-scroll-fade is-top" aria-hidden="true"></span>
    }
    <div #viewport class="hk-scroll-viewport" tabindex="0"
      [attr.data-axis]="axis()"
      [style.max-height]="maxHeight()"
      (scroll)="measure()">
      <ng-content />
    </div>
    @if (fade() && !atBottom()) {
      <span class="hk-scroll-fade is-bottom" aria-hidden="true"></span>
    }
  `,
  styles: `
    @layer components {
      :host {
        --hk-scroll-bar: var(--hk-scroll-thumb, #e2e8f0);
        --hk-scroll-bar-hot: #ef4444;
        --hk-scroll-fade-from: #ffffff;
        position: relative;
        display: block;
        overflow: hidden;
      }
      :host-context(.dark) {
        --hk-scroll-bar: var(--hk-scroll-thumb, #3f1010);
        --hk-scroll-bar-hot: #7f1d1d;
        --hk-scroll-fade-from: #0a0a0a;
      }

      .hk-scroll-viewport {
        overflow: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--hk-scroll-bar) transparent;
      }
      .hk-scroll-viewport[data-axis='y'] { overflow-x: hidden; overflow-y: auto; }
      .hk-scroll-viewport[data-axis='x'] { overflow-x: auto; overflow-y: hidden; }
      .hk-scroll-viewport:focus-visible {
        outline: 2px solid var(--hk-accent, #dc2626);
        outline-offset: -2px;
      }
      .hk-scroll-viewport::-webkit-scrollbar {
        width: var(--hk-scroll-width, 8px);
        height: var(--hk-scroll-width, 8px);
      }
      .hk-scroll-viewport::-webkit-scrollbar-thumb { background: var(--hk-scroll-bar); border-radius: 999px; }
      .hk-scroll-viewport::-webkit-scrollbar-thumb:hover { background: var(--hk-scroll-bar-hot); }

      .hk-scroll-fade {
        position: absolute;
        left: 0;
        right: 0;
        z-index: 10;
        height: var(--hk-scroll-fade, 2rem);
        pointer-events: none;
      }
      .hk-scroll-fade.is-top { top: 0; background: linear-gradient(to bottom, var(--hk-scroll-fade-from), transparent); }
      .hk-scroll-fade.is-bottom { bottom: 0; background: linear-gradient(to top, var(--hk-scroll-fade-from), transparent); }
    }
  `
})
export class HkScrollAreaComponent {
  /** Height before the area scrolls. */
  readonly maxHeight = input('20rem');
  /** Shows gradient affordances at the scrollable edges. */
  readonly fade = input(true);
  /** Which direction scrolls. */
  readonly axis = input<HkScrollAreaAxis>('y');

  /** Emits when an edge is reached or left. */
  readonly scrolled = output<HkScrollAreaEdges>();

  readonly atTop = signal(true);
  readonly atBottom = signal(true);

  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');

  constructor() {
    // Measured, never assumed: the bottom fade only shows once the browser
    // says there is more content below.
    afterNextRender(() => this.measure());
  }

  /** Re-reads the scroll position. Call after changing the content size. */
  measure(): void {
    const element = this.viewport().nativeElement;
    const top = element.scrollTop <= 1;
    const bottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
    if (top === this.atTop() && bottom === this.atBottom()) return;
    this.atTop.set(top);
    this.atBottom.set(bottom);
    this.scrolled.emit({ top, bottom });
  }
}
