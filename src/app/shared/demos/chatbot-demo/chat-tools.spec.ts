import { STARTER_TOOLS, evaluateExpression } from './chat-tools';

describe('evaluateExpression', () => {
  it('respects precedence and associativity', () => {
    expect(evaluateExpression('2 + 3 * 4')).toBe(14);
    expect(evaluateExpression('(2 + 3) * 4')).toBe(20);
    expect(evaluateExpression('10 - 4 - 3')).toBe(3);
    // Exponentiation is right associative: 2^(3^2), not (2^3)^2.
    expect(evaluateExpression('2 ^ 3 ^ 2')).toBe(512);
    expect(evaluateExpression('-3 + 10')).toBe(7);
    expect(evaluateExpression('7 % 4')).toBe(3);
  });

  it('handles decimals and nesting', () => {
    expect(evaluateExpression('((1.5 + 2.5) * 2) / 4')).toBe(2);
  });

  /**
   * The point of hand-parsing rather than reaching for `eval`: the argument
   * arrives from a model, which got it from a user. Anything that is not
   * arithmetic has to be rejected rather than run.
   */
  it('refuses anything that is not arithmetic', () => {
    for (const attack of [
      'alert(1)',
      'globalThis',
      '1;alert(1)',
      'process.exit()',
      'constructor',
      '[].map',
      ''
    ]) {
      expect(() => evaluateExpression(attack)).toThrow();
    }
  });

  it('rejects unbalanced parentheses and division by zero', () => {
    expect(() => evaluateExpression('(1 + 2')).toThrow();
    expect(() => evaluateExpression('1 / 0')).toThrow();
    expect(() => evaluateExpression('1 % 0')).toThrow();
  });
});

describe('starter tools', () => {
  const byName = (name: string) => STARTER_TOOLS.find((tool) => tool.name === name)!;

  it('describes every parameter it accepts', () => {
    for (const tool of STARTER_TOOLS) {
      expect(tool.description.length).toBeGreaterThan(0);
      for (const parameter of tool.parameters) {
        expect(parameter.name).toBeTruthy();
        expect(parameter.description).toBeTruthy();
      }
    }
  });

  it('returns the same reading for the same city whatever the casing', () => {
    const first = byName('get_weather').run({ city: 'Bergen' }) as Record<string, unknown>;
    const second = byName('get_weather').run({ city: 'bergen' }) as Record<string, unknown>;
    // The city is echoed back as the caller spelled it; the reading is what
    // has to be stable.
    expect(first['temperature']).toBe(second['temperature']);
    expect(first['conditions']).toBe(second['conditions']);
    expect(first['humidity']).toBe(second['humidity']);
    expect(first['city']).toBe('Bergen');
  });

  it('converts units on request', () => {
    const celsius = byName('get_weather').run({ city: 'Oslo' }) as Record<string, unknown>;
    const fahrenheit = byName('get_weather').run({ city: 'Oslo', unit: 'f' }) as Record<string, unknown>;
    expect(celsius['unit']).toBe('°C');
    expect(fahrenheit['unit']).toBe('°F');
    expect(fahrenheit['temperature']).toBe(
      Math.round(((celsius['temperature'] as number) * 9) / 5 + 32)
    );
  });

  it('rejects a missing required argument rather than inventing one', async () => {
    expect(() => byName('get_weather').run({})).toThrow();
    expect(() => byName('calculate').run({ expression: '  ' })).toThrow();
    // create_ticket is async, so it rejects rather than throwing synchronously.
    await expectAsync(Promise.resolve(byName('create_ticket').run({}))).toBeRejected();
  });

  it('falls back to a valid priority when handed junk', async () => {
    const ticket = (await byName('create_ticket').run({
      title: 'Flaky export',
      priority: 'catastrophic'
    })) as Record<string, unknown>;
    expect(ticket['priority']).toBe('normal');
    expect(ticket['status']).toBe('open');
  });
});
