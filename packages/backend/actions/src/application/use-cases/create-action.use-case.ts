import type { TransactionRunner } from '@repo/backend/shared';

import { Action } from '../../domain/aggregates/action';
import type { ActionRepository } from '../../domain/ports/action-repository';
import type { ActionPlanRepository } from '@repo/backend/action-plans';
import type { CreateActionCommand } from '../commands/create-action.command';
import { ActionAlreadyExists } from '../errors/action-already-exists';
import type { CreateActionResult } from '../results/create-action.result';
import { ActionPlanNotFound } from '@repo/backend/action-plans';

export class CreateActionUseCase {
  /**
   * Create a new CreateActionUseCase.
   * @param actionRepository Repository for actions.
   * @param actionPlanRepository Repository for action plans.
   * @param transactionRunner Transaction runner.
   * @returns CreateActionUseCase instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(
    private readonly actionRepository: ActionRepository,
    private readonly actionPlanRepository: ActionPlanRepository,
    private readonly transactionRunner: TransactionRunner,
  ) {}

  /**
   * Create a new action linked to an action plan.
   * @param command Create action command.
   * @returns CreateActionResult with the action snapshot.
   * @throws {ActionPlanNotFound} If the action plan does not exist.
   * @throws {ActionAlreadyExists} If the action already exists.
   */
  async execute(command: CreateActionCommand): Promise<CreateActionResult> {
    return this.transactionRunner.runInTransaction(async () => {
      const actionPlan = await this.actionPlanRepository.getById({
        organizationId: command.organizationId,
        actionPlanId: command.actionPlanId,
      });

      if (!actionPlan) {
        throw new ActionPlanNotFound(command.actionPlanId, command.organizationId);
      }

      actionPlan.assertSameOrganization(command.organizationId);

      const existingAction = await this.actionRepository.getById({
        organizationId: command.organizationId,
        actionId: command.actionId,
      });

      if (existingAction) {
        throw new ActionAlreadyExists(command.actionId, command.organizationId);
      }

      const action = Action.create({
        id: command.actionId,
        organizationId: command.organizationId,
        actionPlanId: command.actionPlanId,
        createdByUserId: command.createdByUserId,
        title: command.title,
        description: command.description,
      });

      await this.actionRepository.save(action);

      return {
        actionId: action.id,
        actionPlanId: action.actionPlanId,
        state: action.state,
        version: action.version,
        updatedAt: action.updatedAt,
      };
    });
  }
}
