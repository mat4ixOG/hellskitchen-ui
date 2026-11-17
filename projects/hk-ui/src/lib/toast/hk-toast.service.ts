import { Injectable, signal } from '@angular/core';

export type HkToastTone = 'success' | 'info' | 'warn' | 'danger';

export interface HkToastAction {
  label: string;
  run: () => void;
}

/** What `push()` takes. */
export interface HkToast {
  /** `warn` is orange: something needs attention, but nothing has failed yet. */
  tone?: HkToastTone;
  title: string;
  body?: string;
  /** Milliseconds before auto-dismiss. 0 keeps it until dismissed. */
  duration?: number;
  action?: HkToastAction;
}

/** A toast on the stack. */
export interface HkToastItem extends HkToast {
  id: string;
  tone: HkToastTone;
}

interface HkToastTimer {
  handle: ReturnType<typeof setTimeout> | null;
  remaining: number;
  startedAt: number;
}

/**
 * Pushes toasts to the `<hk-toast-host>` you drop in once. The stack caps
 * itself (oldest drops out), and timers pause while the host is hovered or
 * focused.
 */
@Injectable({ providedIn: 'root' })
export class HkToastService {
  private readonly stack = signal<HkToastItem[]>([]);
  /** The toasts currently on the stack, oldest first. */
  readonly toasts = this.stack.asReadonly();

  /** Stack cap. Set by the host's `max` input. */
  max = 3;

  private seq = 0;
  private paused = false;
  private readonly timers = new Map<string, HkToastTimer>();

  /** Queues a toast and returns its id. */
  push(toast: HkToast): string {
    const id = `hk-toast-${++this.seq}`;
    const item: HkToastItem = { ...toast, id, tone: toast.tone ?? 'info' };
    const next = [...this.stack(), item];
    const dropped = next.slice(0, Math.max(0, next.length - this.max));
    dropped.forEach((old) => this.stopTimer(old.id));
    this.stack.set(next.slice(dropped.length));

    const duration = toast.duration ?? 4200;
    if (duration > 0) {
      this.timers.set(id, { handle: null, remaining: duration, startedAt: 0 });
      if (!this.paused) this.startTimer(id);
    }
    return id;
  }

  /** Removes one toast early. */
  dismiss(id: string): void {
    this.stopTimer(id);
    this.stack.update((list) => list.filter((toast) => toast.id !== id));
  }

  /** Empties the stack. */
  clear(): void {
    [...this.timers.keys()].forEach((id) => this.stopTimer(id));
    this.stack.set([]);
  }

  /** Freezes every timer — used while the host is hovered or focused. */
  pause(): void {
    if (this.paused) return;
    this.paused = true;
    const now = Date.now();
    for (const timer of this.timers.values()) {
      if (timer.handle === null) continue;
      clearTimeout(timer.handle);
      timer.handle = null;
      timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
    }
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    for (const id of this.timers.keys()) this.startTimer(id);
  }

  private startTimer(id: string): void {
    const timer = this.timers.get(id);
    if (!timer || timer.handle !== null) return;
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => this.dismiss(id), timer.remaining);
  }

  private stopTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer?.handle != null) clearTimeout(timer.handle);
    this.timers.delete(id);
  }
}
