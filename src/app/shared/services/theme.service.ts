import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type HkTheme = 'light' | 'dark';

const STORAGE_KEY = 'hk-theme';

/**
 * Owns the one class the whole theme hangs off.
 *
 * `.dark` on <html> drives Tailwind's dark variant, the `--hk-*` token layer
 * and PrimeNG's darkModeSelector, so one write retunes every component. Dark
 * is the default; an explicit choice is remembered, and only a first-time
 * visitor's OS preference gets a say.
 */
@Injectable({ providedIn: 'root' })
export class HkThemeService {
  private readonly document = inject(DOCUMENT);

  readonly theme = signal<HkTheme>(this.restore());

  constructor() {
    effect(() => this.apply(this.theme()));
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: HkTheme): void {
    this.theme.set(theme);
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private mode or a full quota — the theme still applies for this visit.
    }
  }

  private restore(): HkTheme {
    try {
      const saved = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
      // No stored choice: honour a declared light preference, else stay dark.
      const prefersLight = this.document.defaultView?.matchMedia('(prefers-color-scheme: light)');
      return prefersLight?.matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  }

  private apply(theme: HkTheme): void {
    const root = this.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }
}
