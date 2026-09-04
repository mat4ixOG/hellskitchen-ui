import { Component, input } from '@angular/core';
import { Block } from '../../data/guides';
import { CodeBlockComponent } from '../code-block/code-block.component';

/** Renders a guide's structured content. One place to restyle all docs prose. */
@Component({
  selector: 'app-doc-blocks',
  imports: [CodeBlockComponent],
  templateUrl: './doc-blocks.component.html',
  styleUrl: './doc-blocks.component.css'
})
export class DocBlocksComponent {
  readonly blocks = input.required<Block[]>();

  noteClass(tone: string): string {
    const map: Record<string, string> = {
      info: 'border-sky-200 dark:border-sky-800/50 bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-200',
      warn: 'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200',
      good: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200'
    };
    return map[tone] ?? 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-gray-300';
  }

  noteIcon(tone: string): string {
    const map: Record<string, string> = {
      info: 'pi pi-info-circle',
      warn: 'pi pi-exclamation-triangle',
      good: 'pi pi-check-circle'
    };
    return map[tone] ?? 'pi pi-info-circle';
  }
}
