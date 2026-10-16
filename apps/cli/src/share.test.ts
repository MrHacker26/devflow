import { describe, expect, test } from 'bun:test';

import { fetchSharedWorkflow, isShareToken } from './share';

const token = 'df_abcdefghijklmnopqrstuv';
const workflow = {
  version: 1,
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Shared',
  nodes: [{ id: 'start', type: 'start', data: { label: 'Start' } }],
  edges: [],
  layout: {},
};

describe('share tokens', () => {
  test('accepts a share token and rejects a workflow id', () => {
    expect(isShareToken(token)).toBe(true);
    expect(isShareToken('11111111-1111-1111-1111-111111111111')).toBe(false);
    expect(isShareToken('df_short')).toBe(false);
  });

  test('fetches a shared workflow', async () => {
    const result = await fetchSharedWorkflow(token, {
      baseUrl: 'http://localhost:3000/',
      fetchImpl: async (input) => {
        expect(String(input)).toBe(`http://localhost:3000/api/share/${token}`);
        return Response.json(workflow);
      },
    });

    expect(result.name).toBe('Shared');
  });

  test('reports a missing share link', async () => {
    await expect(
      fetchSharedWorkflow(token, {
        fetchImpl: async () =>
          Response.json({ message: 'Shared workflow not found' }, { status: 404 }),
      }),
    ).rejects.toThrow('Shared workflow not found.');
  });
});
