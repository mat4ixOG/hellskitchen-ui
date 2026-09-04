import {
  AfterViewChecked,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { HkChatEngine, HkChatMessage, HkTool, HkToolCall } from './chat-engine';
import { STARTER_TOOLS, createLocalTransport } from './chat-tools';
import { HkDictation, HkSpeaker, dictationSupported, speechSupported } from './chat-voice';

/**
 * The chat surface itself: transcript, composer, voice.
 *
 * Split out from the docs demo so the inline page and the floating launcher
 * are the *same* component in two frames rather than two copies of a chat UI
 * that drift apart. Everything docs-specific — the tool registry card, the
 * code sample — stays in the demo that wraps this.
 */
@Component({
  selector: 'app-chat-panel',
  imports: [],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chatbot-demo.component.css'
})
export class ChatPanelComponent implements AfterViewChecked {
  private readonly destroyRef = inject(DestroyRef);
  private readonly transcript = viewChild<ElementRef<HTMLElement>>('transcript');

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
  readonly draft = signal('');
  readonly notice = signal('');

  readonly canDictate = dictationSupported();
  readonly canSpeak = speechSupported();
  readonly listening = signal(false);
  readonly speakReplies = signal(false);
  readonly interim = signal('');

  private readonly speaker = new HkSpeaker();
  private spokenUpTo = new Map<string, number>();

  private readonly dictation = new HkDictation({
    onTranscript: (text, final) => {
      if (final) {
        this.draft.update(
          (current) => `${current}${current && !current.endsWith(' ') ? ' ' : ''}${text}`.trimStart()
        );
        this.interim.set('');
      } else {
        this.interim.set(text);
      }
    },
    onError: (message) => {
      this.notice.set(message);
      this.listening.set(false);
      this.interim.set('');
    },
    onEnd: () => {
      this.listening.set(false);
      this.interim.set('');
    }
  });

  private readonly engine = new HkChatEngine({
    transport: createLocalTransport(),
    systemPrompt: "You are the Hell's Kitchen UI assistant. Be brief and concrete.",
    tools: STARTER_TOOLS,
    onChange: (messages) => {
      this.messages.set(messages);
      if (this.speakReplies()) this.speakNew(messages);
      this.shouldScroll = true;
    },
    onStateChange: (busy) => this.busy.set(busy)
  });

  readonly tools = signal<HkTool[]>(this.engine.listTools());
  readonly visible = computed(() => this.messages().filter((message) => message.role !== 'system'));
  readonly empty = computed(() => this.visible().length === 0);

  private shouldScroll = false;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.engine.abort();
      this.dictation.cancel();
      this.speaker.stop();
    });
  }

  ngAfterViewChecked(): void {
    if (!this.shouldScroll) return;
    this.shouldScroll = false;
    const element = this.transcript()?.nativeElement;
    if (element) element.scrollTop = element.scrollHeight;
  }

  /** The host's handle on the registry — see the docs demo's roll_dice card. */
  registerTool(tool: HkTool): void {
    this.engine.registerTool(tool);
    this.tools.set(this.engine.listTools());
    this.toolsChanged.emit(this.tools());
  }

  focusComposer(): void {
    this.composerEl()?.nativeElement.focus();
  }

  private readonly composerEl = viewChild<ElementRef<HTMLTextAreaElement>>('composer');

  // ── Sending ──────────────────────────────────────────────────
  send(): void {
    const text = this.draft().trim();
    if (!text || this.busy()) return;
    if (this.listening()) this.stopDictation();
    this.draft.set('');
    this.notice.set('');
    void this.engine.send(text);
  }

  ask(text: string): void {
    this.draft.set(text);
    this.send();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.busy()) {
      event.preventDefault();
      this.stop();
      return;
    }
    // Enter sends, Shift+Enter is a newline — the convention everywhere else.
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    this.send();
  }

  stop(): void {
    this.engine.abort();
    this.speaker.stop();
  }

  clear(): void {
    this.engine.reset();
    this.speaker.stop();
    this.spokenUpTo = new Map();
    this.notice.set('');
  }

  // ── Voice ────────────────────────────────────────────────────
  toggleDictation(): void {
    if (this.listening()) this.stopDictation();
    else this.startDictation();
  }

  private startDictation(): void {
    this.notice.set('');
    if (!this.dictation.start()) {
      this.notice.set('Dictation could not start in this browser.');
      return;
    }
    this.listening.set(true);
  }

  private stopDictation(): void {
    this.dictation.stop();
    this.listening.set(false);
    this.interim.set('');
  }

  toggleSpeech(): void {
    const next = !this.speakReplies();
    this.speakReplies.set(next);
    if (next) {
      // Only speak from here on — replaying the backlog would be a surprise.
      for (const message of this.messages()) this.spokenUpTo.set(message.id, message.content.length);
    } else {
      this.speaker.stop();
    }
  }

  /**
   * Speaks only the tail that has arrived since last time, so a streaming
   * reply is read out as it lands instead of repeated from the top.
   */
  private speakNew(messages: HkChatMessage[]): void {
    for (const message of messages) {
      if (message.role !== 'assistant') continue;
      const already = this.spokenUpTo.get(message.id) ?? 0;
      const content = message.content;
      if (content.length <= already) continue;
      const tail = content.slice(already);
      // The last terminator of any kind — picking '.' over a later '?' would
      // cut the sentence in half.
      const boundary = Math.max(
        tail.lastIndexOf('.'),
        tail.lastIndexOf('!'),
        tail.lastIndexOf('?')
      );
      const ready = message.streaming ? tail.slice(0, boundary + 1) : tail;
      if (!ready.trim()) continue;
      this.speaker.speak(ready);
      this.spokenUpTo.set(message.id, already + ready.length);
    }
  }

  // ── Rendering helpers ────────────────────────────────────────
  timeOf(message: HkChatMessage): string {
    return new Date(message.at).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  resultOf(call: HkToolCall): string {
    if (call.state === 'error') return call.error ?? 'failed';
    if (call.state === 'running') return '…';
    return JSON.stringify(call.result);
  }

  argsOf(call: HkToolCall): string {
    return Object.entries(call.args)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  }

  iconOf(name: string): string {
    return this.tools().find((tool) => tool.name === name)?.icon ?? 'pi-wrench';
  }
}
