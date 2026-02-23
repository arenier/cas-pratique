import { AsyncLocalStorage } from 'node:async_hooks';

import { Inject, Injectable } from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';

import type { TransactionRunner } from '@repo/backend/shared';

const transactionStorage = new AsyncLocalStorage<EntityManager>();

/**
 * Resolve the active EntityManager for the current transaction scope.
 * @param dataSource DataSource instance.
 * @returns EntityManager bound to the current transaction or the default manager.
 */
export const resolveEntityManager = (dataSource: DataSource): EntityManager =>
  transactionStorage.getStore() ?? dataSource.manager;

@Injectable()
export class TypeOrmTransactionRunner implements TransactionRunner {
  /**
   * Create a new TypeOrmTransactionRunner.
   * @param dataSource DataSource for transactions.
   */
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  /**
   * Execute a callback inside a database transaction.
   * @param fn Callback to execute.
   * @returns The callback result.
   * @throws {Error} If the transaction fails.
   */
  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) => transactionStorage.run(manager, fn));
  }
}
