import type { TransactionRunner } from '@repo/backend/shared';

import type { ActionRepository } from '../../domain/ports/action-repository';
import type { RequestValidationActionCommand } from '../commands/request-validation-action.command';
import { ActionNotFound } from '../errors/action-not-found';

export class RequestValidationActionUseCase {
  /**
   * Create a new RequestValidationActionUseCase.
   * @param actionRepository Repository for actions.
   * @param transactionRunner Transaction runner.
   * @returns RequestValidationActionUseCase instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(
    private readonly actionRepository: ActionRepository,
    private readonly transactionRunner: TransactionRunner,
  ) {}

  /**
   * Transition an action from IN_PROGRESS to TO_VALIDATE.
   * @param command Request validation command.
   * @returns void
   * @throws {ActionNotFound} If the action does not exist.
   */
  async execute(command: RequestValidationActionCommand): Promise<void> {
    return this.transactionRunner.runInTransaction(async () => {
      const action = await this.actionRepository.getById({
        organizationId: command.organizationId,
        actionId: command.actionId,
      });

      if (!action) {
        throw new ActionNotFound(command.actionId, command.organizationId);
      }

      action.requestValidation({
        role: command.actorRole,
        expectedVersion: command.expectedVersion,
      });

      await this.actionRepository.save(action);
    });
  }
}
