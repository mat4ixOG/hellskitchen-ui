import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type HkTagTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type HkTagSize = 'sm' | 'md';

let nextTagId = 0;

/** Compact label with a tone, an optional icon and a remove button that actually removes. */
@Component({
  selector: 'hk-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (icon()) {
      <i class="hk-tag-icon" [class]="icon()" aria-hidden="true"></i>
    }
    <span [id]="labelId"><ng-content /></span>
    @if (removable()) {
      <!-- Labelled by its own "Remove" plus the tag text: "Remove canary". -->
      <button type="button" class="hk-tag-remove" [id]="buttonId"
        [attr.aria-labelledby]="buttonId + ' ' + labelId" (click)="removed.emit()">
        <span class="hk-sr">Remove</span><span aria-hidden="true">&times;</span>
      </button>
    }
  `,
  styleUrl: './hk-tag.component.css',
  host: {
    class: 'hk-tag',
    '[attr.data-tone]': 'tone()',
    '[attr.data-size]': 'size()'
  }
})
export class HkTagComponent {
  readonly tone = input<HkTagTone>('neutral');
  /** Leading icon class, e.g. `pi pi-check` from your icon font. */
  readonly icon = input('');
  readonly removable = input(false);
  readonly size = input<HkTagSize>('md');

  readonly removed = output<void>();

  private readonly uid = nextTagId++;
  readonly labelId = `hk-tag-label-${this.uid}`;
  readonly buttonId = `hk-tag-remove-${this.uid}`;
}
