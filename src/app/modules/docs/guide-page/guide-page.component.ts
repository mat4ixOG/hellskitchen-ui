import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VISIBLE_GUIDES, findGuide } from '../../../shared/data/guides';
import { DocBlocksComponent } from '../../../shared/components/doc-blocks/doc-blocks.component';

@Component({
  selector: 'app-guide-page',
  imports: [RouterLink, DocBlocksComponent],
  templateUrl: './guide-page.component.html',
  styleUrl: './guide-page.component.css'
})
export class GuidePageComponent {
  /** Bound from the :id route param via withComponentInputBinding(). */
  readonly id = input<string>('');

  readonly guide = computed(() => findGuide(this.id()));

  /** Section links for the on-this-page rail. */
  readonly headings = computed(
    () =>
      this.guide()
        ?.blocks.filter((block) => block.kind === 'h')
        .map((block) => block as { kind: 'h'; text: string; id: string }) ?? []
  );

  readonly nextGuide = computed(() => {
    const index = VISIBLE_GUIDES.findIndex((guide) => guide.id === this.id());
    return index >= 0 && index < VISIBLE_GUIDES.length - 1 ? VISIBLE_GUIDES[index + 1] : undefined;
  });

  readonly prevGuide = computed(() => {
    const index = VISIBLE_GUIDES.findIndex((guide) => guide.id === this.id());
    return index > 0 ? VISIBLE_GUIDES[index - 1] : undefined;
  });
}
