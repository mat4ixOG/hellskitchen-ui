import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  COMPONENTS,
  GLOBAL_TOKENS,
  Status,
  findComponent
} from '../../../shared/data/component-catalog';
import { CodeBlockComponent } from '../../../shared/components/code-block/code-block.component';
import { DemoRendererComponent, DemoId } from '../../../shared/demos/demo-renderer/demo-renderer.component';
import { hasDemo, isWideDemo } from '../../../shared/demos/demo-registry';

@Component({
  selector: 'app-component-doc',
  imports: [RouterLink, CodeBlockComponent, DemoRendererComponent],
  templateUrl: './component-doc.component.html',
  styleUrl: './component-doc.component.css'
})
export class ComponentDocComponent {
  /** Bound from the :slug route param via withComponentInputBinding(). */
  readonly slug = input<string>('');

  readonly globalTokens = GLOBAL_TOKENS;
  readonly entry = computed(() => findComponent(this.slug()));

  readonly inputs = computed(() => this.entry()?.api?.filter((row) => row.kind === 'input') ?? []);
  readonly outputs = computed(() => this.entry()?.api?.filter((row) => row.kind === 'output') ?? []);
  readonly methods = computed(() => this.entry()?.api?.filter((row) => row.kind === 'method') ?? []);

  /** Neighbours in the same category, for the "see also" row. */
  readonly siblings = computed(() => {
    const current = this.entry();
    if (!current) return [];
    return COMPONENTS.filter(
      (item) => item.category === current.category && item.slug !== current.slug
    ).slice(0, 4);
  });

  readonly panel = signal<'preview' | 'code'>('preview');

  /** A wide demo overflows the prose column into the free space beside it. */
  readonly wideDemo = computed(() => {
    const slug = this.entry()?.slug;
    return !!slug && isWideDemo(slug);
  });

  demoId(): DemoId | null {
    const slug = this.entry()?.slug;
    return slug && hasDemo(slug) ? slug : null;
  }

  statusClass(status: Status): string {
    const map: Record<Status, string> = {
      stable: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
      new: 'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
    };
    return map[status];
  }
}
