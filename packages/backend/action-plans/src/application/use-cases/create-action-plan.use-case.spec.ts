import { describe, expect, it } from 'vitest';

import { InMemoryTransactionRunner } from '@repo/backend/shared';

import { ActionPlan } from '../../domain/aggregates/action-plan';
import { UnauthorizedActionPlanCreation } from '../../domain/errors/unauthorized-action-plan-creation';
import { InMemoryActionPlanRepository } from '../../infrastructure/in-memory/in-memory-action-plan-repository';
import { ActionPlanAlreadyExists } from '../errors/action-plan-already-exists';
import { CreateActionPlanUseCase } from './create-action-plan.use-case';

describe('CreateActionPlanUseCase', () => {
  it('creates an action plan for an organization', async () => {
    const actionPlanRepository = new InMemoryActionPlanRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new CreateActionPlanUseCase(actionPlanRepository, transactionRunner);

    const result = await useCase.execute({
      organizationId: 'org-1',
      actorRole: 'ADMIN',
      createdByUserId: 'admin-1',
      actionPlanId: 'plan-1',
      title: 'Safety plan',
      description: 'Safety improvements',
    });

    const saved = await actionPlanRepository.getById({
      organizationId: 'org-1',
      actionPlanId: 'plan-1',
    });

    expect(result).toEqual({ actionPlanId: 'plan-1', organizationId: 'org-1' });
    expect(saved).not.toBeNull();
    expect(saved?.organizationId).toBe('org-1');
    expect(saved?.createdByUserId).toBe('admin-1');
  });

  it('rejects non-admin actors', async () => {
    const actionPlanRepository = new InMemoryActionPlanRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new CreateActionPlanUseCase(actionPlanRepository, transactionRunner);

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'MANAGER',
        createdByUserId: 'manager-1',
        actionPlanId: 'plan-1',
        title: 'Safety plan',
        description: 'Safety improvements',
      })
    ).rejects.toBeInstanceOf(UnauthorizedActionPlanCreation);
  });

  it('throws when action plan already exists within the organization', async () => {
    const actionPlanRepository = new InMemoryActionPlanRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new CreateActionPlanUseCase(actionPlanRepository, transactionRunner);

    await actionPlanRepository.save(
      ActionPlan.create({
        id: 'plan-1',
        organizationId: 'org-1',
        createdByUserId: 'admin-1',
        actorRole: 'ADMIN',
        title: 'Existing',
        description: 'Existing plan',
      })
    );

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'ADMIN',
        createdByUserId: 'admin-1',
        actionPlanId: 'plan-1',
        title: 'Safety plan',
        description: 'Safety improvements',
      })
    ).rejects.toBeInstanceOf(ActionPlanAlreadyExists);
  });

  it('allows same action plan id across organizations', async () => {
    const actionPlanRepository = new InMemoryActionPlanRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new CreateActionPlanUseCase(actionPlanRepository, transactionRunner);

    await actionPlanRepository.save(
      ActionPlan.create({
        id: 'plan-1',
        organizationId: 'org-a',
        createdByUserId: 'admin-1',
        actorRole: 'ADMIN',
        title: 'Existing',
        description: 'Existing plan',
      })
    );

    const result = await useCase.execute({
      organizationId: 'org-b',
      actorRole: 'ADMIN',
      createdByUserId: 'admin-2',
      actionPlanId: 'plan-1',
      title: 'New plan',
      description: 'New plan',
    });

    expect(result).toEqual({ actionPlanId: 'plan-1', organizationId: 'org-b' });
  });
});
