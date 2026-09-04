import { Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { ChatPanelComponent } from './chat-panel.component';
import { HkTool } from './chat-engine';
import { ChatLauncherService } from '../../services/chat-launcher.service';

/**
 * The docs stage: the shared chat panel, plus the two things only a docs page
 * needs — a live look at the tool registry, and the code that adds to it.
 */
@Component({
  selector: 'app-chatbot-demo',
  imports: [ChatPanelComponent],
  templateUrl: './chatbot-demo.component.html',
  styleUrl: './chatbot-demo.component.css'
})
export class ChatbotDemoComponent {
  // Not `required`: the launcher variant takes the inline panel out of the
  // DOM, which is the whole point of that variant.
  private readonly panel = viewChild(ChatPanelComponent);
  private readonly launcher = inject(ChatLauncherService);
  private readonly destroyRef = inject(DestroyRef);

  readonly variant = signal<'inline' | 'launcher'>('inline');
  readonly customAdded = signal(false);
  readonly tools = signal<HkTool[]>([]);

  onToolsChanged(tools: HkTool[]): void {
    this.tools.set(tools);
  }

  /**
   * Switching to the launcher variant summons the real one, in the corner —
   * and switching back dismisses it entirely, button included. The corner
   * button exists only while this page is asking for it.
   */
  showVariant(variant: 'inline' | 'launcher'): void {
    this.variant.set(variant);
    if (variant === 'launcher') this.launcher.open();
    else this.launcher.disable();
  }

  openLauncher(): void {
    this.launcher.open();
  }

  constructor() {
    // Leaving this page ends the demo. Without this the button would follow
    // the reader onto every other route, which is exactly what it must not do.
    this.destroyRef.onDestroy(() => this.launcher.disable());
  }

  /**
   * The extension point, exercised live: this is exactly what a consumer
   * writes in their own app, and the assistant can call it immediately.
   */
  addCustomTool(): void {
    this.panel()?.registerTool({
      name: 'roll_dice',
      description: 'Roll one or more dice.',
      icon: 'pi-box',
      parameters: [
        { name: 'sides', type: 'number', description: 'Faces per die. Defaults to 6.' },
        { name: 'count', type: 'number', description: 'How many dice. Defaults to 1.' }
      ],
      run: ({ sides, count }) => {
        const faces = Math.max(2, Math.min(100, Number(sides) || 6));
        const dice = Math.max(1, Math.min(10, Number(count) || 1));
        const rolls = Array.from({ length: dice }, () => 1 + Math.floor(Math.random() * faces));
        return { rolls, total: rolls.reduce((sum, roll) => sum + roll, 0), faces };
      }
    });
    this.customAdded.set(true);
  }

  chip(active: boolean): string {
    return [
      'rounded-md px-2.5 py-1 text-[0.7rem] font-semibold transition cursor-pointer',
      active
        ? 'bg-red-600 text-white'
        : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
    ].join(' ');
  }
}
