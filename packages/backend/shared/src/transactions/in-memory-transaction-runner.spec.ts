import { describe, expect, it } from 'vitest';
import { InMemoryTransactionRunner } from './in-memory-transaction-runner';

describe('InMemoryTransactionRunner', () => {
  it('executes the callback and returns its result', async () => {
    const runner = new InMemoryTransactionRunner();

    const result = await runner.runInTransaction(async () => 'ok');

    expect(result).toBe('ok');
  });
});
