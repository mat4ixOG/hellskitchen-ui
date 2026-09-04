/**
 * The starter kit: three working tools, and the local transport that drives
 * them with no network.
 *
 * Copy this file, keep the shape, replace the bodies. A tool is a name, a
 * description, a parameter list and an ordinary function — there is no
 * framework underneath it to learn.
 */
import { HkChatChunk, HkChatRequest, HkChatTransport, HkTool } from './chat-engine';

// ── Starter tools ────────────────────────────────────────────────

/**
 * Arithmetic without `eval`.
 *
 * A starter people paste into their own app is exactly where `eval` must not
 * appear: the argument comes from a model, which got it from a user, and
 * `eval` there is remote code execution with extra steps. This is a small
 * recursive-descent parser over + - * / % ^ and parentheses instead.
 */
export function evaluateExpression(input: string): number {
  const source = input.replace(/\s+/g, '');
  let position = 0;

  const peek = (): string => source[position] ?? '';
  const eat = (char: string): boolean => {
    if (peek() !== char) return false;
    position++;
    return true;
  };

  // expression := term (('+' | '-') term)*
  const expression = (): number => {
    let value = term();
    for (;;) {
      if (eat('+')) value += term();
      else if (eat('-')) value -= term();
      else return value;
    }
  };

  // term := power (('*' | '/' | '%') power)*
  const term = (): number => {
    let value = power();
    for (;;) {
      if (eat('*')) value *= power();
      else if (eat('/')) {
        const divisor = power();
        if (divisor === 0) throw new Error('Division by zero.');
        value /= divisor;
      } else if (eat('%')) {
        const divisor = power();
        if (divisor === 0) throw new Error('Division by zero.');
        value %= divisor;
      } else return value;
    }
  };

  // power := unary ('^' power)?  — right associative, as maths expects.
  const power = (): number => {
    const base = unary();
    return eat('^') ? base ** power() : base;
  };

  const unary = (): number => {
    if (eat('-')) return -unary();
    if (eat('+')) return unary();
    return primary();
  };

  const primary = (): number => {
    if (eat('(')) {
      const value = expression();
      if (!eat(')')) throw new Error('Unbalanced parentheses.');
      return value;
    }
    const start = position;
    while (/[0-9.]/.test(peek())) position++;
    if (start === position) throw new Error(`Unexpected "${peek() || 'end of input'}".`);
    const value = Number(source.slice(start, position));
    if (Number.isNaN(value)) throw new Error(`"${source.slice(start, position)}" is not a number.`);
    return value;
  };

  const result = expression();
  if (position < source.length) throw new Error(`Unexpected "${peek()}".`);
  if (!Number.isFinite(result)) throw new Error('Result is not a finite number.');
  return result;
}

/** Stable pseudo-weather, so the same city always reads the same. */
function hash(text: string): number {
  let value = 0;
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(value);
}

export const STARTER_TOOLS: HkTool[] = [
  {
    name: 'get_weather',
    description: 'Current conditions for a city.',
    icon: 'pi-cloud',
    parameters: [
      { name: 'city', type: 'string', description: 'City name, e.g. "Bergen".', required: true },
      { name: 'unit', type: 'string', description: '"c" or "f". Defaults to "c".' }
    ],
    run: ({ city, unit }) => {
      const name = String(city ?? '').trim();
      if (!name) throw new Error('A city is required.');
      const seed = hash(name.toLowerCase());
      const celsius = (seed % 34) - 6;
      const conditions = ['clear', 'overcast', 'light rain', 'snow', 'fog', 'windy'][seed % 6];
      const fahrenheit = Math.round((celsius * 9) / 5 + 32);
      const useF = String(unit ?? 'c').toLowerCase().startsWith('f');
      return {
        city: name,
        temperature: useF ? fahrenheit : celsius,
        unit: useF ? '°F' : '°C',
        conditions,
        humidity: `${40 + (seed % 50)}%`
      };
    }
  },
  {
    name: 'calculate',
    description: 'Evaluate an arithmetic expression.',
    icon: 'pi-calculator',
    parameters: [
      { name: 'expression', type: 'string', description: 'e.g. "(12 + 8) * 3".', required: true }
    ],
    run: ({ expression }) => {
      const source = String(expression ?? '');
      if (!source.trim()) throw new Error('An expression is required.');
      return { expression: source, result: evaluateExpression(source) };
    }
  },
  {
    name: 'create_ticket',
    description: 'File a ticket in the tracker.',
    icon: 'pi-ticket',
    parameters: [
      { name: 'title', type: 'string', description: 'Short summary.', required: true },
      { name: 'priority', type: 'string', description: 'low | normal | high. Defaults to normal.' }
    ],
    run: async ({ title, priority }) => {
      const summary = String(title ?? '').trim();
      if (!summary) throw new Error('A title is required.');
      // Stands in for the network call a real tracker would make.
      await new Promise((resolve) => setTimeout(resolve, 420));
      const allowed = ['low', 'normal', 'high'];
      const level = String(priority ?? 'normal').toLowerCase();
      return {
        id: `HK-${1000 + (hash(summary) % 9000)}`,
        title: summary,
        priority: allowed.includes(level) ? level : 'normal',
        status: 'open'
      };
    }
  }
];

// ── Transports ───────────────────────────────────────────────────

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Streams a string the way a model would — a few tokens at a time. */
async function* streamText(
  text: string,
  signal: AbortSignal,
  speed = 18
): AsyncGenerator<HkChatChunk> {
  const tokens = text.match(/\S+\s*/g) ?? [];
  for (const token of tokens) {
    if (signal.aborted) return;
    await sleep(speed);
    yield { type: 'text', text: token };
  }
}

/**
 * The offline transport. It reads the last user message, decides whether a
 * registered tool applies, and narrates the result — enough to exercise the
 * whole streaming + tool-call loop with no key and no network.
 *
 * Replace it with `streamFromEndpoint` and the rest of the app is unchanged.
 */
export function createLocalTransport(): HkChatTransport {
  return async function* (request: HkChatRequest): AsyncGenerator<HkChatChunk> {
    const { messages, tools, signal } = request;
    const lastUser = [...messages].reverse().find((message) => message.role === 'user');
    const text = (lastUser?.content ?? '').toLowerCase();

    // A round that already produced tool results just summarises them.
    const lastAssistant = messages[messages.length - 1];
    const pending = lastAssistant?.toolCalls?.filter((call) => call.state !== 'running') ?? [];
    if (pending.length) {
      for (const call of pending) {
        if (call.state === 'error') {
          yield* streamText(`That call failed: ${call.error} `, signal);
          continue;
        }
        yield* streamText(`${describeResult(call.name, call.result)} `, signal);
      }
      return;
    }

    const has = (name: string): boolean => tools.some((tool) => tool.name === name);

    const math = text.match(/(?:calculate|compute|what(?:'s| is))\s+([0-9(][0-9+\-*/%^(). ]*)/);
    if (math && has('calculate')) {
      yield* streamText('Running that through the calculator. ', signal);
      yield { type: 'tool', name: 'calculate', args: { expression: math[1] } };
      return;
    }

    const weather = text.match(/weather (?:in|for|at) ([a-zÀ-ɏ .'-]+)/);
    if (weather && has('get_weather')) {
      yield* streamText('Let me look that up. ', signal);
      yield {
        type: 'tool',
        name: 'get_weather',
        args: { city: weather[1].replace(/[.?!]+$/, '').trim() }
      };
      return;
    }

    const ticket = text.match(/(?:ticket|issue|bug)(?: for| about|:)? (.+)/);
    if (ticket && has('create_ticket')) {
      yield* streamText('Filing that now. ', signal);
      yield {
        type: 'tool',
        name: 'create_ticket',
        args: {
          title: ticket[1].replace(/[.?!]+$/, '').trim(),
          priority: /urgent|critical|asap|high/.test(text) ? 'high' : 'normal'
        }
      };
      return;
    }

    if (/^(hi|hello|hey)\b/.test(text)) {
      yield* streamText(
        'Hello. I am running on the local transport, so there is no model behind me — but the streaming, the tool calls and the voice are all real. Try "weather in Bergen", "calculate (12 + 8) * 3", or "file a ticket for the flaky export".',
        signal
      );
      return;
    }

    if (/what can you do|help|tools?/.test(text)) {
      yield* streamText(`I have ${tools.length} tools registered: `, signal);
      yield* streamText(
        `${tools.map((tool) => tool.name).join(', ')}. Point a real model at the same registry and it can call every one of them.`,
        signal
      );
      return;
    }

    yield* streamText(
      'This demo answers from a local transport rather than a model, so it only recognises a few intents. Ask about the weather, some arithmetic, or filing a ticket — or swap in your own endpoint and this becomes a real assistant.',
      signal
    );
  };
}

function describeResult(name: string, result: unknown): string {
  const value = result as Record<string, unknown>;
  if (name === 'get_weather') {
    return `It is ${value['temperature']}${value['unit']} and ${value['conditions']} in ${value['city']}, humidity ${value['humidity']}.`;
  }
  if (name === 'calculate') {
    return `${value['expression']} = ${value['result']}.`;
  }
  if (name === 'create_ticket') {
    return `Filed ${value['id']} — "${value['title']}" at ${value['priority']} priority.`;
  }
  return `Done: ${JSON.stringify(result)}.`;
}

/**
 * The shape a real transport takes: POST the transcript, read back an SSE-ish
 * stream, yield chunks. Wire your own endpoint here — the engine, the tools
 * and the UI all stay exactly as they are.
 *
 * Never call a model provider straight from the browser: the key would ship to
 * every visitor. `url` is your own server, which holds the key and proxies.
 */
export function streamFromEndpoint(url: string): HkChatTransport {
  return async function* (request: HkChatRequest): AsyncGenerator<HkChatChunk> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: request.signal,
      body: JSON.stringify({
        messages: request.messages.map(({ role, content }) => ({ role, content })),
        tools: request.tools.map(({ name, description, parameters }) => ({
          name,
          description,
          parameters
        }))
      })
    });

    if (!response.ok || !response.body) {
      yield { type: 'error', message: `Request failed: ${response.status} ${response.statusText}` };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // One JSON object per line — the smallest framing that survives a
      // chunk boundary landing in the middle of a payload.
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          yield JSON.parse(trimmed) as HkChatChunk;
        } catch {
          yield { type: 'text', text: trimmed };
        }
      }
    }
  };
}
