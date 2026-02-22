import { describe, expect, it } from 'vitest';

import { InMemoryTransactionRunner } from '@repo/backend/shared';

import { ActionPlan } from '../../domain/aggregates/action-plan';
import { UnauthorizedActionPlanUpdate } from '../../domain/errors/unauthorized-action-plan-update';
import { InMemoryActionPlanRepository } from '../../infrastructure/in-memory/in-memory-action-plan-repository';
import { ActionPlanNotFound } from '../errors/action-plan-not-found';
import { UpdateActionPlanDetailsUseCase } from './update-action-plan-details.use-case';

describe('UpdateActionPlanDetailsUseCase', () => {
  it('updates details as admin', async () => {
    const actionPlanRepository = new InMemoryActionPlanRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new UpdateActionPlanDetailsUseCase(actionPlanRepository, transactionRunner);

    await actionPlanRepository.save(
      ActionPlan.create({
        id: 'plan-1',
        organizationId: 'org-1',
        createdByUserId: 'admin-1',
        actorRole: 'ADMIN',
        title: 'Initial',
        description: 'Initial description',
      })
    );

    const result = await useCase.execute({
      organizationId: 'org-1',
      actorRole: 'ADMIN',
      actionPlanId: 'plan-1',
      title: 'Updated',
      description: 'Updated description',
    });

    const updated = await actionPlanRepository.getById({
      organizationId: 'org-1',
      actionPlanId: 'plan-1',
    });

    expect(result).toEqual({ actionPlanId: 'plan-1' });
    expect(updated?.title).toBe('Updated');
    expect(updated?.description).toBe('Updated description');
  });

  it('updates details as manager', async () => {
    const actionPlanRepository = new InMemoryActionPlanRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new UpdateActionPlanDetailsUseCase(actionPlanRepository, transactionRunner);

    await actionPlanRepository.save(
      ActionPlan.create({
        id: 'plan-1',
        organizationId: 'org-1',
        createdByUserId: 'admin-1',
        actorRole: 'ADMIN',
        title: 'Initial',
        description: 'Initial description',
      })
    );

    const result = await useCase.execute({
      organizationId: 'org-1',
      actorRole: 'MANAGER',
      actionPlanId: 'plan-1',
      title: 'Updated',
      description: 'Updated description',
    });

    const updated = await actionPlanRepository.getById({
      organizationId: 'org-1',
      actionPlanId: 'plan-1',
    });

    expect(result).toEqual({ actionPlanId: 'plan-1' });
    expect(updated?.title).toBe('Updated');
    expect(updated?.description).toBe('Updated description');
  });

  it('rejects users without permissions', async () => {
    const actionPlanRepository = new InMemoryActionPlanRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new UpdateActionPlanDetailsUseCase(actionPlanRepository, transactionRunner);

    await actionPlanRepository.save(
      ActionPlan.create({
        id: 'plan-1',
        organizationId: 'org-1',
        createdByUserId: 'admin-1',
        actorRole: 'ADMIN',
        title: 'Initial',
        description: 'Initial description',
      })
    );

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'USER',
        actionPlanId: 'plan-1',
        title: 'Updated',
        description: 'Updated description',
      })
    ).rejects.toBeInstanceOf(UnauthorizedActionPlanUpdate);
  });

  it('throws when action plan not found', async () => {
    const actionPlanRepository = new InMemoryActionPlanRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new UpdateActionPlanDetailsUseCase(actionPlanRepository, transactionRunner);

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'ADMIN',
        actionPlanId: 'missing',
        title: 'Updated',
        description: 'Updated description',
      })
    ).rejects.toBeInstanceOf(ActionPlanNotFound);
  });

  it('does not leak across organizations', async () => {
    const actionPlanRepository = new InMemoryActionPlanRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new UpdateActionPlanDetailsUseCase(actionPlanRepository, transactionRunner);

    await actionPlanRepository.save(
      ActionPlan.create({
        id: 'plan-1',
        organizationId: 'org-a',
        createdByUserId: 'admin-1',
        actorRole: 'ADMIN',
        title: 'Initial',
        description: 'Initial description',
      })
    );

    await expect(
      useCase.execute({
        organizationId: 'org-b',
        actorRole: 'ADMIN',
        actionPlanId: 'plan-1',
        title: 'Updated',
        description: 'Updated description',
      })
    ).rejects.toBeInstanceOf(ActionPlanNotFound);
  });
});
