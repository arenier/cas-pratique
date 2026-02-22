import { TransactionRunner } from './transaction-runner';

export class InMemoryTransactionRunner implements TransactionRunner {
  /**
   * Execute a callback without an actual transaction.
   * @param fn Callback to execute.
   * @returns The callback result.
   * @throws {Error} Never thrown in the current implementation.
   */
  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}
