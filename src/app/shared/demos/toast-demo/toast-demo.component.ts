import { Component, DestroyRef, inject, signal } from '@angular/core';

type Tone = 'success' | 'info' | 'warn' | 'danger';

interface DemoToast {
  id: number;
  tone: Tone;
  title: string;
  body: string;
}

@Component({
  selector: 'app-toast-demo',
  imports: [],
  templateUrl: './toast-demo.component.html',
  styleUrl: './toast-demo.component.css'
})
export class ToastDemoComponent {
  readonly toasts = signal<DemoToast[]>([]);

  /** Drives the trigger row, so a new tone is one entry rather than a button. */
  readonly tones: { tone: Tone; label: string }[] = [
    { tone: 'success', label: 'Push success' },
    { tone: 'info', label: 'Push info' },
    { tone: 'warn', label: 'Push warning' },
    { tone: 'danger', label: 'Push error' }
  ];

  private seq = 0;
  private readonly destroyRef = inject(DestroyRef);

  push(tone: Tone): void {
    const copy: Record<Tone, { title: string; body: string }> = {
      success: { title: 'Deployed', body: 'v0.1.4 is live in 3 regions.' },
      info: { title: 'Heads up', body: 'A new component landed on main.' },
      warn: { title: 'Quota at 82%', body: 'eu-west-1 will throttle at 100%.' },
      danger: { title: 'Build failed', body: 'Two type errors in ui/switch.' }
    };

    const id = ++this.seq;
    // Stack caps at three, oldest first — same rule as the real host.
    this.toasts.update((list) => [...list, { id, tone, ...copy[tone] }].slice(-3));

    const timer = setTimeout(() => this.dismiss(id), 4200);
    this.destroyRef.onDestroy(() => clearTimeout(timer));
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }

  /** The toast surface. Light theme gets a tint, dark gets a deep wash. */
  toneClass(tone: Tone): string {
    return {
      success:
        'border-emerald-200 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
      info: 'border-sky-200 dark:border-sky-700/50 bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300',
      warn: 'border-orange-200 dark:border-orange-600/50 bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300',
      danger:
        'border-red-200 dark:border-red-700/60 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300'
    }[tone];
  }

  /** The trigger button. Same hue as its toast, one step quieter. */
  triggerClass(tone: Tone): string {
    const base =
      'rounded-lg border px-4 py-2 text-xs font-semibold transition cursor-pointer';
    return `${base} ${
      {
        success:
          'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/70',
        info: 'border-sky-200 dark:border-sky-800/50 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950/70',
        warn: 'border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950/70',
        danger:
          'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/70'
      }[tone]
    }`;
  }

  toneIcon(tone: Tone): string {
    return {
      success: 'pi pi-check-circle',
      info: 'pi pi-info-circle',
      warn: 'pi pi-exclamation-triangle',
      danger: 'pi pi-times-circle'
    }[tone];
  }
}
