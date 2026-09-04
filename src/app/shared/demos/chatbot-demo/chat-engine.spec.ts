import { HkChatChunk, HkChatEngine, HkChatMessage, HkChatRequest } from './chat-engine';

/** A transport driven by a fixed script, so a turn is deterministic. */
function scripted(...rounds: HkChatChunk[][]): (r: HkChatRequest) => AsyncIterable<HkChatChunk> {
  let round = 0;
  return async function* () {
    const chunks = rounds[Math.min(round++, rounds.length - 1)] ?? [];
    for (const chunk of chunks) yield chunk;
  };
}

describe('HkChatEngine', () => {
  let seen: HkChatMessage[][] = [];
  const capture = (messages: HkChatMessage[]) => seen.push(messages);

  beforeEach(() => (seen = []));

  it('streams text chunks into one assistant message', async () => {
    const engine = new HkChatEngine({
      transport: scripted([
        { type: 'text', text: 'Hello' },
        { type: 'text', text: ' there' }
      ], []),
      onChange: capture
    });

    await engine.send('hi');
    const assistant = engine.history().filter((m) => m.role === 'assistant');
    expect(assistant.length).toBe(1);
    expect(assistant[0].content).toBe('Hello there');
    expect(assistant[0].streaming).toBeFalse();
  });

  it('keeps the system prompt out of nothing — it seeds the transcript', () => {
    const engine = new HkChatEngine({
      transport: scripted([]),
      systemPrompt: 'Be brief.',
      onChange: capture
    });
    expect(engine.history()[0].role).toBe('system');
    expect(engine.history()[0].content).toBe('Be brief.');
  });

  it('runs a registered tool and records args, result and elapsed time', async () => {
    const calls: string[] = [];
    const engine = new HkChatEngine({
      transport: scripted(
        [{ type: 'tool', name: 'echo', args: { value: 42 } }],
        [{ type: 'text', text: 'done' }]
      ),
      tools: [
        {
          name: 'echo',
          description: 'Echoes.',
          parameters: [{ name: 'value', type: 'number', description: 'Anything.' }],
          run: ({ value }) => {
            calls.push('echo');
            return { echoed: value };
          }
        }
      ],
      onChange: capture
    });

    await engine.send('echo 42');

    expect(calls).toEqual(['echo']);
    const withTool = engine.history().find((m) => m.toolCalls?.length)!;
    const call = withTool.toolCalls![0];
    expect(call.name).toBe('echo');
    expect(call.args).toEqual({ value: 42 });
    expect(call.state).toBe('done');
    expect(call.result).toEqual({ echoed: 42 });
    expect(call.ms).toBeGreaterThanOrEqual(0);
  });

  it('records a failing tool as an error rather than throwing the turn away', async () => {
    const engine = new HkChatEngine({
      transport: scripted([{ type: 'tool', name: 'boom', args: {} }], []),
      tools: [
        {
          name: 'boom',
          description: 'Always fails.',
          parameters: [],
          run: () => {
            throw new Error('nope');
          }
        }
      ],
      onChange: capture
    });

    await engine.send('go');
    const call = engine.history().find((m) => m.toolCalls?.length)!.toolCalls![0];
    expect(call.state).toBe('error');
    expect(call.error).toBe('nope');
    // The turn still finished cleanly.
    expect(engine.isBusy()).toBeFalse();
  });

  it('reports an unknown tool back into the transcript instead of crashing', async () => {
    const engine = new HkChatEngine({
      transport: scripted([{ type: 'tool', name: 'not_registered', args: {} }], []),
      onChange: capture
    });

    await engine.send('go');
    const call = engine.history().find((m) => m.toolCalls?.length)!.toolCalls![0];
    expect(call.state).toBe('error');
    expect(call.error).toContain('not_registered');
  });

  /**
   * A model that answers every tool result with another tool call would loop
   * forever; the cap is what makes that terminate.
   */
  it('stops calling tools once maxToolRounds is reached', async () => {
    let runs = 0;
    const engine = new HkChatEngine({
      // Always asks for a tool, every round.
      transport: scripted([{ type: 'tool', name: 'again', args: {} }]),
      maxToolRounds: 2,
      tools: [
        {
          name: 'again',
          description: 'Loops.',
          parameters: [],
          run: () => ++runs
        }
      ],
      onChange: capture
    });

    await engine.send('go');
    expect(runs).toBeLessThanOrEqual(3);
    expect(engine.isBusy()).toBeFalse();
  });

  it('registers and removes tools at any time', () => {
    const engine = new HkChatEngine({ transport: scripted([]), onChange: capture });
    expect(engine.listTools().length).toBe(0);

    engine.registerTool({ name: 'a', description: 'A.', parameters: [], run: () => 1 });
    expect(engine.listTools().map((t) => t.name)).toEqual(['a']);

    // Same name replaces rather than duplicating.
    engine.registerTool({ name: 'a', description: 'A2.', parameters: [], run: () => 2 });
    expect(engine.listTools().length).toBe(1);
    expect(engine.listTools()[0].description).toBe('A2.');

    engine.removeTool('a');
    expect(engine.listTools().length).toBe(0);
  });

  it('resets back to just the system prompt', async () => {
    const engine = new HkChatEngine({
      transport: scripted([{ type: 'text', text: 'hi' }]),
      systemPrompt: 'Be brief.',
      onChange: capture
    });
    await engine.send('hello');
    expect(engine.history().length).toBeGreaterThan(1);

    engine.reset();
    expect(engine.history().length).toBe(1);
    expect(engine.history()[0].role).toBe('system');
  });

  it('hands every subscriber a fresh array, so a signal actually updates', async () => {
    const engine = new HkChatEngine({
      transport: scripted([{ type: 'text', text: 'a' }]),
      onChange: capture
    });
    await engine.send('go');
    // Consecutive emissions must not be the same object.
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
  });

  it('surfaces a transport error on the message rather than rejecting', async () => {
    const engine = new HkChatEngine({
      transport: scripted([{ type: 'error', message: 'upstream 503' }]),
      onChange: capture
    });
    await engine.send('go');
    const assistant = engine.history().find((m) => m.role === 'assistant')!;
    expect(assistant.error).toBe('upstream 503');
  });

  it('ignores a send while a turn is already running', async () => {
    let started = 0;
    const engine = new HkChatEngine({
      transport: async function* () {
        started++;
        yield { type: 'text', text: 'x' } as HkChatChunk;
      },
      onChange: capture
    });

    const first = engine.send('one');
    // Not awaited: this lands while the first turn is still in flight.
    await engine.send('two');
    await first;
    expect(started).toBe(1);
    expect(engine.history().filter((m) => m.role === 'user').length).toBe(1);
  });
});
