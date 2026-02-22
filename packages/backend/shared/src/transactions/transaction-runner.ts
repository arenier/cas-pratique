export interface TransactionRunner {
  /**
   * Execute a callback within a transaction boundary.
   * @param fn Callback to execute.
   * @returns The callback result.
   * @throws {Error} If the transaction fails.
   */
  runInTransaction<T>(fn: () => Promise<T>): Promise<T>;
}
