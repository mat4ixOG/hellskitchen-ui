import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import {
  HkChatbotDictation,
  HkChatbotSpeaker,
  hkChatbotDictationSupported,
  hkChatbotSpeechSupported
} from './hk-chatbot-voice';

export type HkChatbotRole = 'system' | 'user' | 'assistant';

export interface HkChatbotToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  state: 'running' | 'done' | 'error';
  result?: unknown;
  error?: string;
  /** Wall time in ms. */
  ms?: number;
}

export interface HkChatbotMessage {
  id: string;
  role: HkChatbotRole;
  content: string;
  /** Epoch ms, shown as the message time. */
  at: number;
  /** Set while tokens are still arriving for this message. */
  streaming?: boolean;
  toolCalls?: HkChatbotToolCall[];
  error?: string;
}

/** What the tool row needs to know about a registered tool. */
export interface HkChatbotTool {
  name: string;
  /** Icon class from your own icon font, e.g. `pi pi-cloud`. A wrench is drawn otherwise. */
  icon?: string;
}

/**
 * Whatever talks to your model. The component never calls a backend itself:
 * it hands the user's text to `send`, and renders the `messages` and `busy`
 * state you feed back.
 */
export interface HkChatbotEngine {
  send(text: string): unknown;
  /** Cancels the in-flight turn. */
  abort(): void;
  /** Clears the transcript. */
  reset(): void;
}

/**
 * The chat surface: transcript, composer, tool-call rows, and voice in both
 * directions (dictation and read-aloud), each feature-detected so an
 * unsupported browser simply does not show the button.
 */
@Component({
  selector: 'hk-chatbot',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-chatbot.component.html',
  styleUrl: './hk-chatbot.component.css'
})
export class HkChatbotComponent {
  /** The send / abort / reset logic. Bring your own — see `HkChatbotEngine`. */
  readonly engine = input<HkChatbotEngine | null>(null);
  /** The transcript to render. System messages are never shown. */
  readonly messages = input<HkChatbotMessage[]>([]);
  /** True while a turn is in flight. */
  readonly busy = input(false);
  /** Registered tools — counted in the toolbar and used for tool-row icons. */
  readonly tools = input<HkChatbotTool[]>([]);
  /** Read replies aloud as they stream, a sentence at a time. Two-way bindable. */
  readonly speakReplies = model(false);
  /** Transcript height. Falls back to `--hk-chat-log-height` (20rem). */
  readonly logHeight = input<string | null>(null);
  /** Hides the status / Clear row when the frame already has its own header. */
  readonly showToolbar = input(true);
  /** Prompts offered while the transcript is empty. */
  readonly suggestions = input<string[]>([]);
  readonly emptyMessage = input('Ask something to get started.');

  private readonly transcript = viewChild<ElementRef<HTMLElement>>('transcript');
  private readonly composer = viewChild<ElementRef<HTMLTextAreaElement>>('composer');

  readonly draft = signal('');
  readonly notice = signal('');
  readonly listening = signal(false);
  readonly interim = signal('');
  readonly canDictate = signal(false);
  readonly canSpeak = signal(false);

  readonly visible = computed(() => this.messages().filter((message) => message.role !== 'system'));
  readonly empty = computed(() => this.visible().length === 0);

  private readonly speaker = new HkChatbotSpeaker();
  private spokenUpTo = new Map<string, number>();

  private readonly dictation = new HkChatbotDictation({
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

  constructor() {
    // Feature detection after hydration, so server and client agree on first paint.
    afterNextRender(() => {
      this.canDictate.set(hkChatbotDictationSupported());
      this.canSpeak.set(hkChatbotSpeechSupported());
    });

    // Keep the newest message in view as the transcript grows.
    afterRenderEffect(() => {
      this.messages();
      const element = this.transcript()?.nativeElement;
      if (element) element.scrollTop = element.scrollHeight;
    });

    // Speak the tail of each reply as it streams in.
    effect(() => {
      const messages = this.messages();
      untracked(() => {
        if (this.speakReplies()) this.speakNew(messages);
      });
    });

    // Turning speech on starts from "now" — replaying the backlog would surprise.
    effect(() => {
      const on = this.speakReplies();
      untracked(() => {
        if (on) {
          for (const message of this.messages()) this.spokenUpTo.set(message.id, message.content.length);
        } else {
          this.speaker.stop();
        }
      });
    });

    inject(DestroyRef).onDestroy(() => {
      this.dictation.cancel();
      this.speaker.stop();
    });
  }

  focusComposer(): void {
    this.composer()?.nativeElement.focus();
  }

  // ── Sending ──────────────────────────────────────────────────
  send(): void {
    const text = this.draft().trim();
    if (!text || this.busy()) return;
    if (this.listening()) this.stopDictation();
    this.draft.set('');
    this.notice.set('');
    void this.engine()?.send(text);
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
    // Enter sends, Shift+Enter is a newline.
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    this.send();
  }

  stop(): void {
    this.engine()?.abort();
    this.speaker.stop();
  }

  clear(): void {
    this.engine()?.reset();
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
    this.speakReplies.set(!this.speakReplies());
  }

  /** Speaks only the tail that has arrived since last time. */
  private speakNew(messages: HkChatbotMessage[]): void {
    for (const message of messages) {
      if (message.role !== 'assistant') continue;
      const already = this.spokenUpTo.get(message.id) ?? 0;
      const content = message.content;
      if (content.length <= already) continue;
      const tail = content.slice(already);
      // The last terminator of any kind — picking '.' over a later '?' would
      // cut the sentence in half.
      const boundary = Math.max(tail.lastIndexOf('.'), tail.lastIndexOf('!'), tail.lastIndexOf('?'));
      const ready = message.streaming ? tail.slice(0, boundary + 1) : tail;
      if (!ready.trim()) continue;
      this.speaker.speak(ready);
      this.spokenUpTo.set(message.id, already + ready.length);
    }
  }

  // ── Rendering helpers ────────────────────────────────────────
  timeOf(message: HkChatbotMessage): string {
    return new Date(message.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  resultOf(call: HkChatbotToolCall): string {
    if (call.state === 'error') return call.error ?? 'failed';
    if (call.state === 'running') return '…';
    return JSON.stringify(call.result);
  }

  argsOf(call: HkChatbotToolCall): string {
    return Object.entries(call.args)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  }

  iconOf(name: string): string | null {
    return this.tools().find((tool) => tool.name === name)?.icon ?? null;
  }
}
