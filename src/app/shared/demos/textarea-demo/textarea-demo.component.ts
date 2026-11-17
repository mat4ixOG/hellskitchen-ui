import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkTextareaComponent } from 'hellskitchen-ui';

/** Grows with its content and stops at a max height rather than jumping. */
@Component({
  selector: 'app-textarea-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkTextareaComponent],
  template: `
    <div class="w-full max-w-md">
      <hk-textarea
        [(value)]="text"
        label="What shipped this week?"
        placeholder="What shipped this week?"
        [rows]="2"
        [maxRows]="8"
        [maxlength]="280"
        [counter]="true">
        Markdown supported
      </hk-textarea>
    </div>
  `
})
export class TextareaDemoComponent {
  readonly text = signal('Rolled the new grid out behind a flag.');
}
