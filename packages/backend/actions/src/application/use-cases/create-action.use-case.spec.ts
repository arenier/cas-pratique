import { describe, expect, it } from 'vitest';

import { InMemoryTransactionRunner } from '@repo/backend/shared';
import { ActionPlan } from '@repo/backend/action-plans';
import { ActionPlanNotFound } from '@repo/backend/action-plans';

import { Action } from '../../domain/aggregates/action';
import { InMemoryActionRepository } from '../../infrastructure/in-memory/in-memory-action-repository';
import { ActionAlreadyExists } from '../errors/action-already-exists';
import { CreateActionUseCase } from './create-action.use-case';
import { InMemoryActionPlanRepository } from '@repo/backend/action-plans';

const createActionPlan = (organizationId: string, actionPlanId: string) =>
  ActionPlan.create({
    id: actionPlanId,
    organizationId,
    createdByUserId: 'admin-1',
    actorRole: 'ADMIN',
    title: 'Plan',
    description: 'Plan description',
  });

describe('CreateActionUseCase', () => {
  it('creates an action linked to an action plan', async () => {
    const actionRepository = new InMemoryActionRepository();
    const actionPlanRepository = new InMemoryActionPlanRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new CreateActionUseCase(
      actionRepository,
      actionPlanRepository,
      transactionRunner,
    );

    await actionPlanRepository.save(createActionPlan('org-1', 'plan-1'));

    const result = await useCase.execute({
      organizationId: 'org-1',
      actorRole: 'ADMIN',
      actionId: 'action-1',
      actionPlanId: 'plan-1',
      createdByUserId: 'admin-1',
      title: 'Action',
      description: 'Action description',
    });

    const saved = await actionRepository.getById({
      organizationId: 'org-1',
      actionId: 'action-1',
    });

    expect(result).toEqual(
      expect.objectContaining({
        actionId: 'action-1',
        actionPlanId: 'plan-1',
        state: 'TODO',
        version: 1,
        updatedAt: expect.any(Date),
      }),
    );
    expect(saved).not.toBeNull();
    expect(saved?.state).toBe('TODO');
    expect(saved?.actionPlanId).toBe('plan-1');
  });

  it('throws when action plan not found', async () => {
    const actionRepository = new InMemoryActionRepository();
    const actionPlanRepository = new InMemoryActionPlanRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new CreateActionUseCase(
      actionRepository,
      actionPlanRepository,
      transactionRunner,
    );

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'ADMIN',
        actionId: 'action-1',
        actionPlanId: 'missing',
        createdByUserId: 'admin-1',
        title: 'Action',
        description: 'Action description',
      }),
    ).rejects.toBeInstanceOf(ActionPlanNotFound);
  });

  it('throws when organization mismatch', async () => {
    const actionRepository = new InMemoryActionRepository();
    const actionPlanRepository = new InMemoryActionPlanRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new CreateActionUseCase(
      actionRepository,
      actionPlanRepository,
      transactionRunner,
    );

    await actionPlanRepository.save(createActionPlan('org-a', 'plan-1'));

    await expect(
      useCase.execute({
        organizationId: 'org-b',
        actorRole: 'ADMIN',
        actionId: 'action-1',
        actionPlanId: 'plan-1',
        createdByUserId: 'admin-1',
        title: 'Action',
        description: 'Action description',
      }),
    ).rejects.toBeInstanceOf(ActionPlanNotFound);
  });

  it('throws when action already exists', async () => {
    const actionRepository = new InMemoryActionRepository();
    const actionPlanRepository = new InMemoryActionPlanRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new CreateActionUseCase(
      actionRepository,
      actionPlanRepository,
      transactionRunner,
    );

    await actionPlanRepository.save(createActionPlan('org-1', 'plan-1'));
    await actionRepository.save(
      Action.create({
        id: 'action-1',
        organizationId: 'org-1',
        actionPlanId: 'plan-1',
        createdByUserId: 'admin-1',
        title: 'Action',
        description: 'Action description',
      }),
    );

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'ADMIN',
        actionId: 'action-1',
        actionPlanId: 'plan-1',
        createdByUserId: 'admin-1',
        title: 'Action',
        description: 'Action description',
      }),
    ).rejects.toBeInstanceOf(ActionAlreadyExists);
  });
});
