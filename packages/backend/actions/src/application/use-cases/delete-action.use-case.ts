import type { TransactionRunner } from '@repo/backend/shared';

import type { ActionRepository } from '../../domain/ports/action-repository';
import type { DeleteActionCommand } from '../commands/delete-action.command';
import { ActionNotFound } from '../errors/action-not-found';

export class DeleteActionUseCase {
  /**
   * Create a new DeleteActionUseCase.
   * @param actionRepository Repository for actions.
   * @param transactionRunner Transaction runner.
   * @returns DeleteActionUseCase instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(
    private readonly actionRepository: ActionRepository,
    private readonly transactionRunner: TransactionRunner,
  ) {}

  /**
   * Delete an action (transition to DELETED).
   * @param command Delete action command.
   * @returns void
   * @throws {ActionNotFound} If the action does not exist.
   */
  async execute(command: DeleteActionCommand): Promise<void> {
    return this.transactionRunner.runInTransaction(async () => {
      const action = await this.actionRepository.getById({
        organizationId: command.organizationId,
        actionId: command.actionId,
      });

      if (!action) {
        throw new ActionNotFound(command.actionId, command.organizationId);
      }

      action.delete({
        role: command.actorRole,
        expectedVersion: command.expectedVersion,
      });

      await this.actionRepository.save(action);
    });
  }
}
