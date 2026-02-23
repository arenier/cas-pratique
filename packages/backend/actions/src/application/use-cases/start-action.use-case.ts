import type { TransactionRunner } from '@repo/backend/shared';

import type { ActionRepository } from '../../domain/ports/action-repository';
import type { StartActionCommand } from '../commands/start-action.command';
import { ActionNotFound } from '../errors/action-not-found';
import type { ActionSnapshotResult } from '../results/action-snapshot.result';

export class StartActionUseCase {
  /**
   * Create a new StartActionUseCase.
   * @param actionRepository Repository for actions.
   * @param transactionRunner Transaction runner.
   * @returns StartActionUseCase instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(
    private readonly actionRepository: ActionRepository,
    private readonly transactionRunner: TransactionRunner,
  ) {}

  /**
   * Transition an action from TODO to IN_PROGRESS.
   * @param command Start action command.
   * @returns Action snapshot after the transition.
   * @throws {ActionNotFound} If the action does not exist.
   */
  async execute(command: StartActionCommand): Promise<ActionSnapshotResult> {
    return this.transactionRunner.runInTransaction(async () => {
      const action = await this.actionRepository.getById({
        organizationId: command.organizationId,
        actionId: command.actionId,
      });

      if (!action) {
        throw new ActionNotFound(command.actionId, command.organizationId);
      }

      action.start({
        role: command.actorRole,
        expectedVersion: command.expectedVersion,
      });

      await this.actionRepository.save(action);

      return {
        actionId: action.id,
        state: action.state,
        version: action.version,
        updatedAt: action.updatedAt,
      };
    });
  }
}
