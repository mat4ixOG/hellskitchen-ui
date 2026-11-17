import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';

type HkHotkeyHandler = () => void;

interface ParsedCombo {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean | null;
  meta: boolean;
}

interface Binding {
  keys: string;
  steps: ParsedCombo[];
  handler: HkHotkeyHandler;
}

/** A layer of bindings that shadows everything beneath it while it exists. */
export interface HkHotkeyScope {
  readonly name: string;
  bind(keys: string, handler: () => void): void;
  unbind(keys: string): void;
  /** Removes the scope and its bindings; global bindings apply again. */
  destroy(): void;
}

const SEQUENCE_TIMEOUT = 1000;

/** Tries to pick up the caller's DestroyRef, so bindings die with their component. */
function callerDestroyRef(): DestroyRef | null {
  try {
    return inject(DestroyRef, { optional: true });
  } catch {
    // Not in an injection context — the caller unbinds by hand.
    return null;
  }
}

/**
 * Keyboard shortcuts that unbind themselves with the component that
 * registered them, and never fire while the user is typing in a field.
 *
 *   hotkeys.bind('mod+k', () => openPalette());   // Cmd on macOS, Ctrl elsewhere
 *   hotkeys.bind('g d', () => goToDeploys());     // a two-key sequence
 */
@Injectable({ providedIn: 'root' })
export class HkHotkeyService implements OnDestroy {
  /** Supports two-key runs such as "g d". */
  sequences = true;

  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly mac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  private readonly global = new Map<string, Binding>();
  private readonly scopes: { name: string; bindings: Map<string, Binding> }[] = [];
  private pending: ParsedCombo[] = [];
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;
  private listening = false;

  private readonly onKeydown = (event: KeyboardEvent): void => this.handle(event);

  /** Registers a shortcut. Called from a component, it is unbound when that component is destroyed. */
  bind(keys: string, handler: () => void): void {
    this.add(this.global, keys, handler);
    callerDestroyRef()?.onDestroy(() => {
      if (this.global.get(keys)?.handler === handler) this.global.delete(keys);
    });
  }

  /** Removes one binding early. */
  unbind(keys: string): void {
    this.global.delete(keys);
  }

  /** Creates a scope so, for example, a dialog can shadow global bindings. */
  scope(name: string): HkHotkeyScope {
    const layer = { name, bindings: new Map<string, Binding>() };
    this.scopes.push(layer);
    const scope: HkHotkeyScope = {
      name,
      bind: (keys, handler) => this.add(layer.bindings, keys, handler),
      unbind: (keys) => layer.bindings.delete(keys),
      destroy: () => {
        const index = this.scopes.indexOf(layer);
        if (index >= 0) this.scopes.splice(index, 1);
      }
    };
    callerDestroyRef()?.onDestroy(() => scope.destroy());
    return scope;
  }

  ngOnDestroy(): void {
    if (this.listening) this.document.removeEventListener('keydown', this.onKeydown);
    this.clearPending();
  }

  private add(target: Map<string, Binding>, keys: string, handler: HkHotkeyHandler): void {
    target.set(keys, { keys, steps: this.parse(keys), handler });
    if (!this.listening && this.browser) {
      this.document.addEventListener('keydown', this.onKeydown);
      this.listening = true;
    }
  }

  private parse(keys: string): ParsedCombo[] {
    // A lone space is a key, not a separator.
    const steps = keys === ' ' ? [' '] : keys.trim().split(/\s+/);
    return steps.map((step) => {
      const parts = step === '+' ? ['+'] : step.split('+');
      const key = parts.pop() ?? '';
      const mods = parts.map((part) => part.toLowerCase());
      const mod = mods.includes('mod');
      return {
        key: key.toLowerCase(),
        ctrl: mods.includes('ctrl') || (mod && !this.mac),
        alt: mods.includes('alt') || mods.includes('option'),
        shift: mods.includes('shift') ? true : null,
        meta: mods.includes('meta') || mods.includes('cmd') || (mod && this.mac)
      };
    });
  }

  private matches(combo: ParsedCombo, event: KeyboardEvent): boolean {
    if (combo.key !== event.key.toLowerCase()) return false;
    if (combo.ctrl !== event.ctrlKey || combo.alt !== event.altKey || combo.meta !== event.metaKey) {
      return false;
    }
    // Shift is only checked when asked for, or for letters: "?" already implies it.
    if (combo.shift !== null) return combo.shift === event.shiftKey;
    return /^[a-z]$/.test(combo.key) ? !event.shiftKey : true;
  }

  private handle(event: KeyboardEvent): void {
    // Never steal a key from a field the user is typing in.
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;

    // Innermost scope first, then the global layer; the first match wins.
    const layers = [...this.scopes.map((scope) => scope.bindings).reverse(), this.global];
    const bindings = layers.flatMap((layer) => [...layer.values()]);

    if (this.sequences && this.pending.length) {
      const prefix = this.pending;
      const done = bindings.find(
        (binding) =>
          binding.steps.length === prefix.length + 1 &&
          prefix.every((step, i) => this.sameCombo(step, binding.steps[i])) &&
          this.matches(binding.steps[prefix.length], event)
      );
      this.clearPending();
      if (done) {
        event.preventDefault();
        done.handler();
        return;
      }
    }

    const single = bindings.find((binding) => binding.steps.length === 1 && this.matches(binding.steps[0], event));
    if (single) {
      event.preventDefault();
      single.handler();
      return;
    }

    if (!this.sequences) return;
    const starter = bindings.find((binding) => binding.steps.length > 1 && this.matches(binding.steps[0], event));
    if (starter) {
      this.pending = [starter.steps[0]];
      this.pendingTimer = setTimeout(() => this.clearPending(), SEQUENCE_TIMEOUT);
    }
  }

  private sameCombo(a: ParsedCombo, b: ParsedCombo): boolean {
    return a.key === b.key && a.ctrl === b.ctrl && a.alt === b.alt && a.meta === b.meta && a.shift === b.shift;
  }

  private clearPending(): void {
    if (this.pendingTimer !== null) clearTimeout(this.pendingTimer);
    this.pendingTimer = null;
    this.pending = [];
  }
}
