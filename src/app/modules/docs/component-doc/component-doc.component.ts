import { Component, computed, inject, input, signal } from '@angular/core';
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
import { StackblitzService } from '../../../shared/services/stackblitz.service';

@Component({
  selector: 'app-component-doc',
  imports: [RouterLink, CodeBlockComponent, DemoRendererComponent],
  templateUrl: './component-doc.component.html',
  styleUrl: './component-doc.component.css'
})
export class ComponentDocComponent {
  private readonly stackblitz = inject(StackblitzService);

  /** Bound from the :slug route param via withComponentInputBinding(). */
  readonly slug = input<string>('');

  // Wired but not surfaced: the StackBlitz button in the template is
  // commented out until the pattern components actually ship. See the note
  // there. Kept live so re-enabling is a template change only.
  readonly sandboxBusy = this.stackblitz.busy;
  readonly sandboxError = this.stackblitz.error;

  /**
   * Opens the demo's real source as a runnable project. Works for patterns as
   * well as packaged components — for a pattern the copied source *is* the
   * component, which is exactly what someone reading a pattern page needs.
   */
  openInStackblitz(): void {
    const entry = this.entry();
    if (!entry) return;
    void this.stackblitz.open(entry.slug, entry.name, entry.packaged);
  }

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
