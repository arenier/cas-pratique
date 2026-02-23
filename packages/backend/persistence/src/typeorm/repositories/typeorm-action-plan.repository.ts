import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ActionPlan } from '@repo/backend/action-plans';
import type { ActionPlanRepository } from '@repo/backend/action-plans';

import { ActionPlanEntity } from '../entities/action-plan.entity';
import { resolveEntityManager } from '../transaction/typeorm-transaction-runner';

const toDomain = (entity: ActionPlanEntity): ActionPlan =>
  ActionPlan.rehydrate({
    id: entity.id,
    organizationId: entity.organizationId,
    createdByUserId: entity.createdByUserId,
    title: entity.title,
    description: entity.description,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  });

@Injectable()
export class TypeOrmActionPlanRepository implements ActionPlanRepository {
  /**
   * Create a new TypeOrmActionPlanRepository.
   * @param dataSource DataSource for database access.
   */
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  /**
   * Fetch an action plan by organization and action plan identifiers.
   * @param params Lookup parameters.
   * @param params.organizationId Organization identifier.
   * @param params.actionPlanId Action plan identifier.
   * @returns The matching action plan or null when missing.
   */
  async getById(params: {
    organizationId: string;
    actionPlanId: string;
  }): Promise<ActionPlan | null> {
    const manager = resolveEntityManager(this.dataSource);
    const repository = manager.getRepository(ActionPlanEntity);

    const entity = await repository.findOne({
      where: { id: params.actionPlanId, organizationId: params.organizationId },
    });

    return entity ? toDomain(entity) : null;
  }

  /**
   * Persist an action plan aggregate.
   * @param actionPlan Action plan to persist.
   */
  async save(actionPlan: ActionPlan): Promise<void> {
    const manager = resolveEntityManager(this.dataSource);
    const repository = manager.getRepository(ActionPlanEntity);

    const existing = await repository.findOne({
      where: { id: actionPlan.id, organizationId: actionPlan.organizationId },
    });

    if (existing) {
      await repository.update(
        { id: actionPlan.id, organizationId: actionPlan.organizationId },
        {
          title: actionPlan.title,
          description: actionPlan.description,
          updatedAt: actionPlan.updatedAt,
        },
      );

      return;
    }

    await repository.insert({
      id: actionPlan.id,
      organizationId: actionPlan.organizationId,
      createdByUserId: actionPlan.createdByUserId,
      title: actionPlan.title,
      description: actionPlan.description,
      createdAt: actionPlan.createdAt,
      updatedAt: actionPlan.updatedAt,
    });
  }
}
