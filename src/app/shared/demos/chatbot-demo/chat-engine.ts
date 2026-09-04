/**
 * The chatbot's core, with no Angular and no vendor in it.
 *
 * Everything a real deployment has to swap is a parameter: the transport that
 * talks to a model, and the tools the model is allowed to call. The demo runs
 * on a local transport so the docs page works with no key and no network, and
 * swapping in a real endpoint is one function — see `streamFromEndpoint`.
 */

export type HkChatRole = 'system' | 'user' | 'assistant';

export interface HkToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  state: 'running' | 'done' | 'error';
  result?: unknown;
  error?: string;
  /** Wall time in ms — worth showing, tool latency is usually the slow part. */
  ms?: number;
}

export interface HkChatMessage {
  id: string;
  role: HkChatRole;
  content: string;
  at: number;
  /** Set while tokens are still arriving for this message. */
  streaming?: boolean;
  toolCalls?: HkToolCall[];
  error?: string;
}

export interface HkToolParam {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required?: boolean;
}

/**
 * One capability the assistant may invoke.
 *
 * This is the extension point: `name`, `description` and `parameters` are what
 * a model sees, and `run` is ordinary code. Register your own with
 * `engine.registerTool({...})` — nothing else has to change.
 */
export interface HkTool {
  name: string;
  description: string;
  parameters: HkToolParam[];
  run: (args: Record<string, unknown>) => unknown | Promise<unknown>;
  /** Shown on the tool chip in the transcript. */
  icon?: string;
}

export type HkChatChunk =
  | { type: 'text'; text: string }
  | { type: 'tool'; name: string; args: Record<string, unknown> }
  | { type: 'error'; message: string };

export interface HkChatRequest {
  messages: HkChatMessage[];
  tools: HkTool[];
  signal: AbortSignal;
}

/** Anything that turns a request into a stream of chunks. */
export type HkChatTransport = (request: HkChatRequest) => AsyncIterable<HkChatChunk>;

let counter = 0;
const nextId = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${counter++}`;

export function createMessage(role: HkChatRole, content = ''): HkChatMessage {
  return { id: nextId(role), role, content, at: Date.now() };
}

/** What the caller watches to render. Deliberately plain — no signals here. */
export interface HkChatEngineOptions {
  transport: HkChatTransport;
  systemPrompt?: string;
  tools?: HkTool[];
  /** Called on every mutation, so a UI layer can push it into a signal. */
  onChange: (messages: HkChatMessage[]) => void;
  onStateChange?: (busy: boolean) => void;
  /** Fired for each finished tool call — handy for logging and telemetry. */
  onToolCall?: (call: HkToolCall) => void;
  /** Guards against a tool loop: how many tool rounds one turn may take. */
  maxToolRounds?: number;
}

export class HkChatEngine {
  private messages: HkChatMessage[] = [];
  private readonly tools = new Map<string, HkTool>();
  private controller: AbortController | null = null;
  private busy = false;

  constructor(private readonly options: HkChatEngineOptions) {
    if (options.systemPrompt) {
      this.messages.push(createMessage('system', options.systemPrompt));
    }
    for (const tool of options.tools ?? []) this.registerTool(tool);
  }

  // ── Tools ──────────────────────────────────────────────────────
  /** Add or replace a tool. Safe to call at any time, including mid-chat. */
  registerTool(tool: HkTool): void {
    this.tools.set(tool.name, tool);
  }

  removeTool(name: string): void {
    this.tools.delete(name);
  }

  listTools(): HkTool[] {
    return [...this.tools.values()];
  }

  // ── Transcript ─────────────────────────────────────────────────
  history(): HkChatMessage[] {
    return this.messages;
  }

  isBusy(): boolean {
    return this.busy;
  }

  reset(): void {
    this.abort();
    this.messages = this.options.systemPrompt
      ? [createMessage('system', this.options.systemPrompt)]
      : [];
    this.emit();
  }

  abort(): void {
    this.controller?.abort();
    this.controller = null;
    // Whatever was mid-stream is now final, not still streaming.
    for (const message of this.messages) message.streaming = false;
    this.setBusy(false);
    this.emit();
  }

  private emit(): void {
    // A new array each time: consumers diff by reference.
    this.options.onChange([...this.messages]);
  }

  private setBusy(value: boolean): void {
    if (this.busy === value) return;
    this.busy = value;
    this.options.onStateChange?.(value);
  }

  // ── Turn ───────────────────────────────────────────────────────
  async send(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || this.busy) return;

    this.messages.push({ ...createMessage('user', trimmed) });
    this.setBusy(true);
    this.emit();

    this.controller = new AbortController();
    const signal = this.controller.signal;

    try {
      let rounds = 0;
      const maxRounds = this.options.maxToolRounds ?? 3;

      // One round per model turn. A tool call means the model needs another
      // look at the transcript, so the loop runs again with the result in it.
      while (rounds <= maxRounds) {
        const calledTools = await this.runOneRound(signal);
        if (!calledTools || signal.aborted) break;
        rounds++;
      }
    } catch (error) {
      if (!signal.aborted) this.failLast(error);
    } finally {
      if (this.controller?.signal === signal) this.controller = null;
      this.setBusy(false);
      this.emit();
    }
  }

  /** Streams one assistant message. Returns true if it invoked any tool. */
  private async runOneRound(signal: AbortSignal): Promise<boolean> {
    const assistant = createMessage('assistant');
    assistant.streaming = true;
    this.messages.push(assistant);
    this.emit();

    let usedTools = false;

    for await (const chunk of this.options.transport({
      messages: [...this.messages],
      tools: this.listTools(),
      signal
    })) {
      if (signal.aborted) break;

      if (chunk.type === 'text') {
        assistant.content += chunk.text;
        this.emit();
        continue;
      }

      if (chunk.type === 'error') {
        assistant.error = chunk.message;
        this.emit();
        continue;
      }

      usedTools = true;
      await this.invokeTool(assistant, chunk.name, chunk.args);
    }

    assistant.streaming = false;
    this.emit();
    return usedTools;
  }

  private async invokeTool(
    message: HkChatMessage,
    name: string,
    args: Record<string, unknown>
  ): Promise<void> {
    const call: HkToolCall = { id: nextId('call'), name, args, state: 'running' };
    message.toolCalls = [...(message.toolCalls ?? []), call];
    this.emit();

    const startedAt = Date.now();
    const tool = this.tools.get(name);

    if (!tool) {
      // An unknown name is the model's mistake, not a crash. It goes back into
      // the transcript so the next round can correct itself.
      call.state = 'error';
      call.error = `No tool named "${name}" is registered.`;
      call.ms = Date.now() - startedAt;
      this.options.onToolCall?.(call);
      this.emit();
      return;
    }

    try {
      call.result = await tool.run(args);
      call.state = 'done';
    } catch (error) {
      call.state = 'error';
      call.error = error instanceof Error ? error.message : String(error);
    }
    call.ms = Date.now() - startedAt;
    this.options.onToolCall?.(call);
    this.emit();
  }

  private failLast(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    const last = this.messages[this.messages.length - 1];
    if (last?.role === 'assistant') {
      last.error = message;
      last.streaming = false;
    } else {
      const failed = createMessage('assistant');
      failed.error = message;
      this.messages.push(failed);
    }
  }
}
