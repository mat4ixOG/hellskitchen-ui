import { Component, DestroyRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { HkChatbotComponent, HkChatbotTool } from 'hellskitchen-ui';
import { HkChatEngine, HkChatMessage, HkTool } from './chat-engine';
import { STARTER_TOOLS, createLocalTransport } from './chat-tools';

/**
 * The site's assistant: the library's `<hk-chatbot>` surface, driven by the
 * engine and local transport that live here in the site.
 *
 * Shared by the docs demo and the floating launcher, so both are the *same*
 * chat in two frames rather than two copies that drift apart.
 */
@Component({
  selector: 'app-chat-panel',
  imports: [HkChatbotComponent],
  templateUrl: './chat-panel.component.html'
})
export class ChatPanelComponent {
  private readonly chat = viewChild(HkChatbotComponent);

  /** Transcript height. The launcher wants a taller, narrower column. */
  readonly logHeight = input('20rem');
  /** Hides the status/Clear row when the frame already has its own header. */
  readonly showToolbar = input(true);
  readonly suggestions = input<string[]>([
    'What can you do?',
    'Weather in Bergen',
    'Calculate (12 + 8) * 3',
    'File a ticket for the flaky CSV export'
  ]);
  readonly emptyMessage = input(
    'Streaming, tool calls and voice are all live. There is no model behind this — it runs on a local transport so the page works offline.'
  );

  /** Lets a host register extra tools and read what is registered. */
  readonly toolsChanged = output<HkTool[]>();

  readonly messages = signal<HkChatMessage[]>([]);
  readonly busy = signal(false);
  readonly speakReplies = signal(false);

  readonly engine = new HkChatEngine({
    transport: createLocalTransport(),
    systemPrompt: "You are the Hell's Kitchen UI assistant. Be brief and concrete.",
    tools: STARTER_TOOLS,
    onChange: (messages) => this.messages.set(messages),
    onStateChange: (busy) => this.busy.set(busy)
  });

  readonly tools = signal<HkTool[]>(this.engine.listTools());
  /** The site's tool icons are PrimeIcons names; the library takes a full class. */
  readonly toolChips = computed<HkChatbotTool[]>(() =>
    this.tools().map((tool) => ({ name: tool.name, icon: `pi ${tool.icon ?? 'pi-wrench'}` }))
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.engine.abort());
  }

  /** The host's handle on the registry — see the docs demo's roll_dice card. */
  registerTool(tool: HkTool): void {
    this.engine.registerTool(tool);
    this.tools.set(this.engine.listTools());
    this.toolsChanged.emit(this.tools());
  }

  focusComposer(): void {
    this.chat()?.focusComposer();
  }
}
