import type { TransactionRunner } from '@repo/backend/shared';

import type { ActionRepository } from '../../domain/ports/action-repository';
import type { CompleteActionCommand } from '../commands/complete-action.command';
import { ActionNotFound } from '../errors/action-not-found';

export class CompleteActionUseCase {
  /**
   * Create a new CompleteActionUseCase.
   * @param actionRepository Repository for actions.
   * @param transactionRunner Transaction runner.
   * @returns CompleteActionUseCase instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(
    private readonly actionRepository: ActionRepository,
    private readonly transactionRunner: TransactionRunner,
  ) {}

  /**
   * Transition an action from TO_VALIDATE to DONE.
   * @param command Complete action command.
   * @returns void
   * @throws {ActionNotFound} If the action does not exist.
   */
  async execute(command: CompleteActionCommand): Promise<void> {
    return this.transactionRunner.runInTransaction(async () => {
      const action = await this.actionRepository.getById({
        organizationId: command.organizationId,
        actionId: command.actionId,
      });

      if (!action) {
        throw new ActionNotFound(command.actionId, command.organizationId);
      }

      action.complete({
        role: command.actorRole,
        expectedVersion: command.expectedVersion,
      });

      await this.actionRepository.save(action);
    });
  }
}
