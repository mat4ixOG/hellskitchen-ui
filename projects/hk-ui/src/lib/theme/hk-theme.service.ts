import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type HkThemeMode = 'light' | 'dark';

export interface HkAccent {
  name: string;
  value: string;
}

/** The built-in palette. A shortcut, not the API — any CSS colour works. */
export const HK_ACCENTS: readonly HkAccent[] = [
  { name: 'Crimson', value: '#dc2626' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Lime', value: '#65a30d' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Slate', value: '#64748b' }
];

/**
 * Reads, writes and persists the token layer at runtime.
 *
 * `.dark` on <html> is the one class every component's dark mode hangs off,
 * and `--hk-*` custom properties on <html> retune every component at once. The
 * stored choice wins; only a first-time visitor's OS preference gets a say.
 */
@Injectable({ providedIn: 'root' })
export class HkThemeService {
  private readonly document = inject(DOCUMENT);

  /** Where the choice is remembered. */
  storageKey = 'hk-theme';
  /** The built-in palette, Crimson through Slate. */
  readonly accents: readonly HkAccent[] = HK_ACCENTS;

  private readonly current = signal<HkThemeMode>(this.restore());
  /** Current theme, readable as a signal. */
  readonly theme = this.current.asReadonly();

  constructor() {
    effect(() => this.apply(this.current()));
  }

  /** Flips between light and dark. */
  toggle(): void {
    this.set(this.current() === 'dark' ? 'light' : 'dark');
  }

  /** Applies a theme and persists the choice. */
  set(theme: HkThemeMode): void {
    this.current.set(theme);
    try {
      this.document.defaultView?.localStorage.setItem(this.storageKey, theme);
    } catch {
      // Private mode or a full quota — the theme still applies for this visit.
    }
  }

  /** Overrides one token at runtime, e.g. `setToken('--hk-radius', '6px')`. */
  setToken(name: string, value: string): void {
    this.document.documentElement?.style.setProperty(name, value);
  }

  /** Writes `--hk-accent`; every shade is derived from it with color-mix. */
  setAccent(colour: string): void {
    this.setToken('--hk-accent', colour);
  }

  private restore(): HkThemeMode {
    try {
      const saved = this.document.defaultView?.localStorage.getItem(this.storageKey);
      if (saved === 'light' || saved === 'dark') return saved;
      // No stored choice: honour a declared light preference, else stay dark.
      const prefersLight = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: light)');
      return prefersLight?.matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  }

  private apply(theme: HkThemeMode): void {
    const root = this.document.documentElement;
    if (!root) return;
    root.classList.toggle('dark', theme === 'dark');
    // Browser-drawn controls — scrollbars, pickers — follow color-scheme.
    root.style.colorScheme = theme;
  }
}
