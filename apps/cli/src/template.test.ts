import { describe, expect, test } from 'bun:test';

import { applyTemplate } from './template';

describe('applyTemplate', () => {
  test('replaces named placeholders and leaves unknown ones as errors', () => {
    const filled = applyTemplate('echo {{ gitEmail }}', new Map([['gitEmail', 'dev@example.com']]));
    expect(filled).toEqual({ ok: true, value: 'echo dev@example.com' });

    const missing = applyTemplate('echo {{gitEmail}}', new Map());
    expect(missing).toEqual({ ok: false, message: 'Variable "gitEmail" is not set.' });
  });
});
