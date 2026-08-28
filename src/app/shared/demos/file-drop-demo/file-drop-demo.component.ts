import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** Drop zone with per-file progress, driven by a fake upload tick. */
@Component({
  selector: 'app-file-drop-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <div (dragover)="onDragOver($event)" (dragleave)="hot.set(false)" (drop)="onDrop($event)"
        class="rounded-2xl border-2 border-dashed p-6 text-center transition-colors"
        [class]="hot() ? 'border-red-500 dark:border-red-600/70 bg-red-50 dark:bg-red-950/40' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]'">
        <p class="text-sm text-slate-700 dark:text-gray-300">Drop files here</p>
        <p class="mt-1 text-xs text-slate-600 dark:text-gray-400">or</p>
        <label class="mt-2 inline-block cursor-pointer rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-white/25">
          Browse
          <input type="file" multiple class="hidden" (change)="onPick($event)" />
        </label>
      </div>

      @if (files().length) {
        <ul class="mt-3 space-y-2">
          @for (file of files(); track file.name) {
            <li class="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-2.5">
              <div class="flex items-center justify-between gap-2 text-xs">
                <span class="truncate text-slate-700 dark:text-gray-300">{{ file.name }}</span>
                @if (file.progress === 100) {
                  <span class="flex shrink-0 items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <i class="pi pi-check-circle text-[0.7rem]"></i> Uploaded
                  </span>
                } @else {
                  <span class="shrink-0 font-mono text-slate-600 dark:text-gray-400">{{ file.progress }}%</span>
                }
              </div>

              <!-- The bar is a progress indicator, not a receipt: once the file
                   is up it has nothing left to say, so it leaves. -->
              @if (file.progress < 100) {
                <div class="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <span class="block h-full rounded-full bg-gradient-to-r from-red-600 to-red-800 transition-[width] duration-200"
                    [style.width.%]="file.progress"></span>
                </div>
              }
            </li>
          }
        </ul>
      }
    </div>
  `
})
export class FileDropDemoComponent {
  readonly hot = signal(false);
  readonly files = signal<{ name: string; progress: number }[]>([
    { name: 'q3-forecast.xlsx', progress: 100 }
  ]);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.hot.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.hot.set(false);
    this.accept([...(event.dataTransfer?.files ?? [])].map((file) => file.name));
  }

  onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.accept([...(input.files ?? [])].map((file) => file.name));
    input.value = '';
  }

  private accept(names: string[]): void {
    const incoming = names.length ? names : ['dropped-asset.png'];
    for (const name of incoming) {
      this.files.update((list) => [...list, { name, progress: 0 }]);
      this.tick(name);
    }
  }

  /** Stands in for an upload so the progress bar has something to show. */
  private tick(name: string): void {
    const timer = setInterval(() => {
      let done = false;
      this.files.update((list) =>
        list.map((file) => {
          if (file.name !== name) return file;
          const progress = Math.min(100, file.progress + 12);
          done = progress === 100;
          return { ...file, progress };
        })
      );
      if (done) clearInterval(timer);
    }, 220);
  }
}
