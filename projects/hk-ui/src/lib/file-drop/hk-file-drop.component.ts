import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';

/** A file that was turned away, and why. */
export interface HkFileDropRejection {
  file: File;
  reason: 'type' | 'size';
}

/** One row of the list under the zone. */
export interface HkFileDropItem {
  file: File;
  progress: number;
}

/**
 * Drop zone with a real browse fallback and per-file progress.
 *
 * Accepted files are emitted through `(files)`; each then gets a row whose
 * progress is ticked along by the component, and `(uploaded)` fires as it
 * reaches 100%. The bar is a progress indicator, not a receipt: once a file is
 * up it leaves (unless `keepProgress`) and the row reads "Uploaded".
 */
@Component({
  selector: 'hk-file-drop',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-file-drop.component.html',
  styleUrl: './hk-file-drop.component.css'
})
export class HkFileDropComponent {
  /** MIME types (`image/*` allowed) or extensions (`.pdf`). Empty accepts anything. */
  readonly accept = input<readonly string[]>([]);
  readonly multiple = input(true);
  /** Per-file byte ceiling. */
  readonly maxSize = input<number | null>(null);
  readonly disabled = input(false);
  readonly keepProgress = input(false);

  readonly files = output<File[]>();
  readonly uploaded = output<File>();
  readonly rejected = output<HkFileDropRejection[]>();

  readonly hot = signal(false);
  readonly items = signal<HkFileDropItem[]>([]);
  readonly rejections = signal<HkFileDropRejection[]>([]);

  private readonly timers = new Set<ReturnType<typeof setInterval>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach((timer) => clearInterval(timer)));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled()) this.hot.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.hot.set(false);
    if (this.disabled()) return;
    this.take([...(event.dataTransfer?.files ?? [])]);
  }

  onPick(event: Event): void {
    const field = event.target as HTMLInputElement;
    this.take([...(field.files ?? [])]);
    field.value = '';
  }

  acceptAttr(): string | null {
    return this.accept().length ? this.accept().join(',') : null;
  }

  reasonText(rejection: HkFileDropRejection): string {
    return rejection.reason === 'size' ? 'too large' : 'type not accepted';
  }

  private take(incoming: File[]): void {
    if (!incoming.length) return;
    const candidates = this.multiple() ? incoming : incoming.slice(0, 1);
    const accepted: File[] = [];
    const rejected: HkFileDropRejection[] = [];

    for (const file of candidates) {
      if (!this.matchesType(file)) rejected.push({ file, reason: 'type' });
      else if (this.maxSize() !== null && file.size > this.maxSize()!) rejected.push({ file, reason: 'size' });
      else accepted.push(file);
    }

    this.rejections.set(rejected);
    if (rejected.length) this.rejected.emit(rejected);
    if (!accepted.length) return;

    this.files.emit(accepted);
    for (const file of accepted) {
      this.items.update((list) => [...list, { file, progress: 0 }]);
      this.tick(file);
    }
  }

  private matchesType(file: File): boolean {
    const accept = this.accept();
    if (!accept.length) return true;
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return accept.some((rule) => {
      const pattern = rule.trim().toLowerCase();
      if (pattern.startsWith('.')) return name.endsWith(pattern);
      if (pattern.endsWith('/*')) return type.startsWith(pattern.slice(0, -1));
      return type === pattern;
    });
  }

  /** Stands in for the transfer so the progress bar has something to show. */
  private tick(target: File): void {
    const timer = setInterval(() => {
      let done = false;
      this.items.update((list) =>
        list.map((item) => {
          if (item.file !== target) return item;
          const progress = Math.min(100, item.progress + 12);
          done = progress === 100;
          return { ...item, progress };
        })
      );
      if (done) {
        clearInterval(timer);
        this.timers.delete(timer);
        this.uploaded.emit(target);
      }
    }, 220);
    this.timers.add(timer);
  }
}
