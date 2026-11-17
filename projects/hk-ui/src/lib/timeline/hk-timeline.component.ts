import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, input } from '@angular/core';

export type HkTimelineTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
export type HkTimelineOrientation = 'vertical' | 'horizontal';

export interface HkTimelineEvent {
  /** Displayed time, e.g. "09:02". */
  at: string;
  title: string;
  body?: string;
  tone?: HkTimelineTone;
  /** Machine-readable value for the `<time datetime>` attribute. */
  datetime?: string;
}

export interface HkTimelineMarkerContext {
  $implicit: HkTimelineEvent;
  index: number;
}

/** An event rail, vertical or horizontal, with a marker per tone. Built as an ordered list. */
@Component({
  selector: 'hk-timeline',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="hk-timeline" [attr.data-orientation]="orientation()">
      @for (event of events(); track $index) {
        <li class="hk-timeline-item">
          <span class="hk-timeline-marker" [attr.data-tone]="event.tone ?? 'brand'"
            [class.is-custom]="!!markerTemplate()" aria-hidden="true">
            @if (markerTemplate(); as marker) {
              <ng-container *ngTemplateOutlet="marker; context: { $implicit: event, index: $index }" />
            }
          </span>
          <p class="hk-timeline-title">{{ event.title }}</p>
          @if (orientation() === 'vertical') {
            <p class="hk-timeline-body">
              <time [attr.datetime]="event.datetime ?? null">{{ event.at }}</time>
              @if (event.body) { · {{ event.body }} }
            </p>
          } @else {
            <p class="hk-timeline-at"><time [attr.datetime]="event.datetime ?? null">{{ event.at }}</time></p>
          }
        </li>
      }
    </ol>
  `,
  styleUrl: './hk-timeline.component.css'
})
export class HkTimelineComponent {
  readonly events = input<HkTimelineEvent[]>([]);
  readonly orientation = input<HkTimelineOrientation>('vertical');
  /** Replaces the default dot. Context: the event as `$implicit`, plus `index`. */
  readonly markerTemplate = input<TemplateRef<HkTimelineMarkerContext> | null>(null);
}
