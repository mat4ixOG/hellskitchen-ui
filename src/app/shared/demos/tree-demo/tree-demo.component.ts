import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkTreeComponent, HkTreeNode } from 'hellskitchen-ui';

/** Expandable tree with a checkbox cascade that reports partial state. */
@Component({
  selector: 'app-tree-demo',
  imports: [HkTreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <hk-tree [nodes]="roots" [(checked)]="picked" [(expanded)]="open" />
      <p class="mt-2 px-3 text-xs text-slate-600 dark:text-gray-400">
        {{ picked().length }} selected
      </p>
    </div>
  `
})
export class TreeDemoComponent {
  readonly roots: HkTreeNode[] = [
    { label: 'Americas', children: ['us-east-1', 'us-west-2', 'sa-east-1'].map((label) => ({ label })) },
    { label: 'EMEA', children: ['eu-west-1', 'eu-central-1'].map((label) => ({ label })) },
    { label: 'Edge (no children)' }
  ];

  readonly open = signal<string[]>(['Americas']);
  readonly picked = signal<string[]>(['us-east-1']);
}
