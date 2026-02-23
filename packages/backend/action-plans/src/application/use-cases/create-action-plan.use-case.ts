import type { TransactionRunner } from '@repo/backend/shared';

import { ActionPlan } from '../../domain/aggregates/action-plan';
import type { ActionPlanRepository } from '../../domain/ports/action-plan-repository';
import type { CreateActionPlanCommand } from '../commands/create-action-plan.command';
import { ActionPlanAlreadyExists } from '../errors/action-plan-already-exists';
import type { CreateActionPlanResult } from '../results/create-action-plan.result';

export class CreateActionPlanUseCase {
  /**
   * Create a new CreateActionPlanUseCase.
   * @param actionPlanRepository Repository for action plans.
   * @param transactionRunner Transaction runner.
   * @returns CreateActionPlanUseCase instance.
   * @throws {Error} Never thrown in the current implementation.
   */
  constructor(
    private readonly actionPlanRepository: ActionPlanRepository,
    private readonly transactionRunner: TransactionRunner,
  ) {}

  /**
   * Create a new action plan for an organization.
   * @param command Create action plan command.
   * @returns CreateActionPlanResult with identifiers.
   * @throws {ActionPlanAlreadyExists} If the action plan already exists.
   */
  async execute(command: CreateActionPlanCommand): Promise<CreateActionPlanResult> {
    return this.transactionRunner.runInTransaction(async () => {
      const existing = await this.actionPlanRepository.getById({
        organizationId: command.organizationId,
        actionPlanId: command.actionPlanId,
      });

      if (existing) {
        throw new ActionPlanAlreadyExists(command.actionPlanId, command.organizationId);
      }

      const actionPlan = ActionPlan.create({
        id: command.actionPlanId,
        organizationId: command.organizationId,
        createdByUserId: command.createdByUserId,
        actorRole: command.actorRole,
        title: command.title,
        description: command.description,
      });

      await this.actionPlanRepository.save(actionPlan);

      return {
        actionPlanId: command.actionPlanId,
        organizationId: command.organizationId,
      };
    });
  }
}
