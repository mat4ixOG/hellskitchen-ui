import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface Node {
  label: string;
  children?: Node[];
}

/** Expandable tree with a checkbox cascade that reports partial state. */
@Component({
  selector: 'app-tree-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-3">
      <ul role="tree">
        @for (node of roots; track node.label) {
          <li role="treeitem" [attr.aria-expanded]="node.children ? isOpen(node) : null">
            <div class="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-white/5">
              @if (node.children) {
                <button type="button" class="w-3 text-slate-600 dark:text-gray-400 transition-transform"
                  [class.rotate-90]="isOpen(node)" (click)="toggle(node)"
                  [attr.aria-label]="'Toggle ' + node.label">›</button>
              } @else {
                <span class="w-3"></span>
              }
              <button type="button" (click)="check(node)"
                class="grid h-3.5 w-3.5 place-items-center rounded border text-[0.55rem]"
                [class]="state(node) === 'all' ? 'border-red-600 bg-red-600 text-white'
                       : state(node) === 'some' ? 'border-red-600 text-red-600 dark:text-red-400' : 'border-slate-300 dark:border-white/20'">
                {{ state(node) === 'all' ? '✓' : state(node) === 'some' ? '–' : '' }}
              </button>
              <span class="text-xs text-slate-700 dark:text-gray-300">{{ node.label }}</span>
            </div>

            @if (node.children && isOpen(node)) {
              <ul role="group" class="ml-5 border-l border-slate-200 dark:border-white/10 pl-2">
                @for (child of node.children; track child.label) {
                  <li role="treeitem">
                    <div class="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-white/5">
                      <span class="w-3"></span>
                      <button type="button" (click)="check(child)"
                        class="grid h-3.5 w-3.5 place-items-center rounded border text-[0.55rem]"
                        [class]="picked().includes(child.label) ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300 dark:border-white/20'">
                        {{ picked().includes(child.label) ? '✓' : '' }}
                      </button>
                      <span class="text-xs text-slate-600 dark:text-gray-400">{{ child.label }}</span>
                    </div>
                  </li>
                }
              </ul>
            }
          </li>
        }
      </ul>
      <p class="mt-2 border-t border-slate-200/60 dark:border-white/5 pt-2 text-xs text-slate-600 dark:text-gray-400">
        {{ picked().length }} selected
      </p>
    </div>
  `
})
export class TreeDemoComponent {
  readonly roots: Node[] = [
    { label: 'Americas', children: ['us-east-1', 'us-west-2', 'sa-east-1'].map((label) => ({ label })) },
    { label: 'EMEA', children: ['eu-west-1', 'eu-central-1'].map((label) => ({ label })) },
    { label: 'Edge (no children)' }
  ];

  readonly open = signal<string[]>(['Americas']);
  readonly picked = signal<string[]>(['us-east-1']);

  isOpen(node: Node): boolean {
    return this.open().includes(node.label);
  }

  toggle(node: Node): void {
    const current = this.open();
    this.open.set(
      current.includes(node.label) ? current.filter((label) => label !== node.label) : [...current, node.label]
    );
  }

  /** A parent reports all / some / none from its children, not its own flag. */
  state(node: Node): 'all' | 'some' | 'none' {
    if (!node.children) return this.picked().includes(node.label) ? 'all' : 'none';
    const hits = node.children.filter((child) => this.picked().includes(child.label)).length;
    if (hits === 0) return 'none';
    return hits === node.children.length ? 'all' : 'some';
  }

  check(node: Node): void {
    const labels = node.children?.map((child) => child.label) ?? [node.label];
    const current = this.picked();
    const allOn = labels.every((label) => current.includes(label));
    this.picked.set(
      allOn
        ? current.filter((label) => !labels.includes(label))
        : [...current, ...labels.filter((label) => !current.includes(label))]
    );
  }
}
