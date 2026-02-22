import type { TransactionRunner } from '@repo/backend/shared';

import type { ActionPlanRepository } from '../../domain/ports/action-plan-repository';
import type { UpdateActionPlanDetailsCommand } from '../commands/update-action-plan-details.command';
import { ActionPlanNotFound } from '../errors/action-plan-not-found';
import type { UpdateActionPlanDetailsResult } from '../results/update-action-plan-details.result';

export class UpdateActionPlanDetailsUseCase {
  /**
   * Create a new UpdateActionPlanDetailsUseCase.
   * @param actionPlanRepository Repository for action plans.
   * @param transactionRunner Transaction runner.
   * @returns UpdateActionPlanDetailsUseCase instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(
    private readonly actionPlanRepository: ActionPlanRepository,
    private readonly transactionRunner: TransactionRunner,
  ) {}

  /**
   * Update the title and description for an action plan.
   * @param command Update details command.
   * @returns UpdateActionPlanDetailsResult with identifier.
   * @throws {ActionPlanNotFound} If the action plan does not exist.
   */
  async execute(
    command: UpdateActionPlanDetailsCommand,
  ): Promise<UpdateActionPlanDetailsResult> {
    return this.transactionRunner.runInTransaction(async () => {
      const actionPlan = await this.actionPlanRepository.getById({
        organizationId: command.organizationId,
        actionPlanId: command.actionPlanId,
      });

      if (!actionPlan) {
        throw new ActionPlanNotFound(command.actionPlanId, command.organizationId);
      }

      actionPlan.updateDetails({
        actorRole: command.actorRole,
        title: command.title,
        description: command.description,
      });

      await this.actionPlanRepository.save(actionPlan);

      return { actionPlanId: command.actionPlanId };
    });
  }
}
