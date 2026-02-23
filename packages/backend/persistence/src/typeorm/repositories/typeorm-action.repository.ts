import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Action } from '@repo/backend/actions';
import type { ActionRepository } from '@repo/backend/actions';
import { ConcurrencyConflict } from '@repo/backend/actions';

import { ActionEntity } from '../entities/action.entity';
import { resolveEntityManager } from '../transaction/typeorm-transaction-runner';

const toDomain = (entity: ActionEntity): Action =>
  Action.rehydrate({
    id: entity.id,
    organizationId: entity.organizationId,
    actionPlanId: entity.actionPlanId,
    createdByUserId: entity.createdByUserId,
    title: entity.title,
    description: entity.description,
    state: entity.state,
    version: entity.version,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  });

@Injectable()
export class TypeOrmActionRepository implements ActionRepository {
  /**
   * Create a new TypeOrmActionRepository.
   * @param dataSource DataSource for database access.
   */
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Fetch an action by organization and action identifiers.
   * @param params Lookup parameters.
   * @param params.organizationId Organization identifier.
   * @param params.actionId Action identifier.
   * @returns The matching action or null when missing.
   */
  async getById(params: { organizationId: string; actionId: string }): Promise<Action | null> {
    const manager = resolveEntityManager(this.dataSource);
    const repository = manager.getRepository(ActionEntity);

    const entity = await repository.findOne({
      where: { id: params.actionId, organizationId: params.organizationId },
    });

    return entity ? toDomain(entity) : null;
  }

  /**
   * Persist an action aggregate.
   * @param action Action to persist.
   * @throws {ConcurrencyConflict} If optimistic locking fails.
   */
  async save(action: Action): Promise<void> {
    const manager = resolveEntityManager(this.dataSource);
    const repository = manager.getRepository(ActionEntity);

    const existing = await repository.findOne({
      where: { id: action.id, organizationId: action.organizationId },
    });

    if (!existing) {
      await repository.insert({
        id: action.id,
        organizationId: action.organizationId,
        actionPlanId: action.actionPlanId,
        createdByUserId: action.createdByUserId,
        title: action.title,
        description: action.description,
        state: action.state,
        version: action.version,
        createdAt: action.createdAt,
        updatedAt: action.updatedAt,
      });

      return;
    }

    const expectedVersion = action.version - 1;

    const updateResult = await repository.update(
      {
        id: action.id,
        organizationId: action.organizationId,
        version: expectedVersion,
      },
      {
        actionPlanId: action.actionPlanId,
        createdByUserId: action.createdByUserId,
        title: action.title,
        description: action.description,
        state: action.state,
        version: action.version,
        updatedAt: action.updatedAt,
      },
    );

    if (!updateResult.affected) {
      const current = await repository.findOne({
        where: { id: action.id, organizationId: action.organizationId },
      });

      throw new ConcurrencyConflict(expectedVersion, current?.version ?? expectedVersion);
    }
  }
}
