import { ChangeDetectionStrategy, Component, computed, effect, signal, viewChild, ElementRef } from '@angular/core';

/** Grows with its content and stops at a max height rather than jumping. */
@Component({
  selector: 'app-textarea-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-md">
      <div class="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 focus-within:border-red-500 dark:focus-within:border-red-600/70">
        <textarea #box rows="2" maxlength="280"
          class="block w-full resize-none bg-transparent px-3.5 py-3 text-sm leading-relaxed text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-gray-500"
          placeholder="What shipped this week?"
          [value]="text()" (input)="onInput($any($event.target).value)"></textarea>
        <div class="flex items-center justify-between border-t border-slate-200/60 dark:border-white/5 px-3.5 py-2">
          <span class="text-xs text-slate-600 dark:text-gray-400">Markdown supported</span>
          <span class="text-xs font-semibold"
            [class]="remaining() < 30 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-gray-400'">{{ remaining() }}</span>
        </div>
      </div>
    </div>
  `
})
export class TextareaDemoComponent {
  private readonly box = viewChild<ElementRef<HTMLTextAreaElement>>('box');
  readonly text = signal('Rolled the new grid out behind a flag.');
  readonly remaining = computed(() => 280 - this.text().length);

  constructor() {
    // Resize after the value lands, so the first paint is already the right size.
    effect(() => {
      this.text();
      const element = this.box()?.nativeElement;
      if (!element) return;
      element.style.height = 'auto';
      element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
    });
  }

  onInput(value: string): void {
    this.text.set(value);
  }
}
