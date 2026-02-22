import { describe, expect, it, vi } from 'vitest';

import { InMemoryTransactionRunner } from '@repo/backend/shared';

import { Action } from '../../domain/aggregates/action';
import { ConcurrencyConflict } from '../../domain/errors/concurrency-conflict';
import { InvalidStateTransition } from '../../domain/errors/invalid-state-transition';
import { UnauthorizedTransition } from '../../domain/errors/unauthorized-transition';
import { InMemoryActionRepository } from '../../infrastructure/in-memory/in-memory-action-repository';
import { ActionNotFound } from '../errors/action-not-found';
import { RequestValidationActionUseCase } from './request-validation-action.use-case';

const createInProgressAction = (organizationId: string, actionId: string) => {
  const action = Action.create({
    id: actionId,
    organizationId,
    actionPlanId: 'plan-1',
    createdByUserId: 'admin-1',
    title: 'Action',
    description: 'Action description',
  });

  action.start({ role: 'ADMIN', expectedVersion: 1 });

  return action;
};

describe('RequestValidationActionUseCase', () => {
  it('moves action to TO_VALIDATE', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new RequestValidationActionUseCase(actionRepository, transactionRunner);

    const action = createInProgressAction('org-1', 'action-1');
    await actionRepository.save(action);
    const beforeUpdatedAt = action.updatedAt;

    vi.advanceTimersByTime(1000);

    await useCase.execute({
      organizationId: 'org-1',
      actorRole: 'MANAGER',
      actionId: 'action-1',
      expectedVersion: 2,
    });

    const updated = await actionRepository.getById({
      organizationId: 'org-1',
      actionId: 'action-1',
    });

    expect(updated?.state).toBe('TO_VALIDATE');
    expect(updated?.version).toBe(3);
    expect(updated?.updatedAt.getTime()).toBeGreaterThan(beforeUpdatedAt.getTime());

    vi.useRealTimers();
  });

  it('throws when action not found', async () => {
    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new RequestValidationActionUseCase(actionRepository, transactionRunner);

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'MANAGER',
        actionId: 'missing',
        expectedVersion: 1,
      }),
    ).rejects.toBeInstanceOf(ActionNotFound);
  });

  it('rejects unauthorized roles', async () => {
    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new RequestValidationActionUseCase(actionRepository, transactionRunner);

    const action = createInProgressAction('org-1', 'action-1');
    await actionRepository.save(action);

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'USER',
        actionId: 'action-1',
        expectedVersion: 2,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedTransition);
  });

  it('rejects invalid transitions', async () => {
    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new RequestValidationActionUseCase(actionRepository, transactionRunner);

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
        expectedVersion: 1,
      }),
    ).rejects.toBeInstanceOf(InvalidStateTransition);
  });

  it('rejects concurrency conflicts', async () => {
    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new RequestValidationActionUseCase(actionRepository, transactionRunner);

    const action = createInProgressAction('org-1', 'action-1');
    await actionRepository.save(action);

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'ADMIN',
        actionId: 'action-1',
        expectedVersion: 1,
      }),
    ).rejects.toBeInstanceOf(ConcurrencyConflict);
  });

  it('does not leak across organizations', async () => {
    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new RequestValidationActionUseCase(actionRepository, transactionRunner);

    const action = createInProgressAction('org-a', 'action-1');
    await actionRepository.save(action);

    await expect(
      useCase.execute({
        organizationId: 'org-b',
        actorRole: 'ADMIN',
        actionId: 'action-1',
        expectedVersion: 2,
      }),
    ).rejects.toBeInstanceOf(ActionNotFound);
  });
});
