import { describe, expect, it, vi } from 'vitest';

import { InMemoryTransactionRunner } from '@repo/backend/shared';

import { Action } from '../../domain/aggregates/action';
import { ConcurrencyConflict } from '../../domain/errors/concurrency-conflict';
import { InvalidStateTransition } from '../../domain/errors/invalid-state-transition';
import { UnauthorizedActionDeletion } from '../../domain/errors/unauthorized-action-deletion';
import { InMemoryActionRepository } from '../../infrastructure/in-memory/in-memory-action-repository';
import { ActionNotFound } from '../errors/action-not-found';
import { DeleteActionUseCase } from './delete-action.use-case';

const createAction = (organizationId: string, actionId: string) =>
  Action.create({
    id: actionId,
    organizationId,
    actionPlanId: 'plan-1',
    createdByUserId: 'admin-1',
    title: 'Action',
    description: 'Action description',
  });

describe('DeleteActionUseCase', () => {
  it('deletes an action', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new DeleteActionUseCase(actionRepository, transactionRunner);

    const action = createAction('org-1', 'action-1');
    await actionRepository.save(action);
    const beforeUpdatedAt = action.updatedAt;

    vi.advanceTimersByTime(1000);

    await useCase.execute({
      organizationId: 'org-1',
      actorRole: 'ADMIN',
      actionId: 'action-1',
      expectedVersion: 1,
    });

    const updated = await actionRepository.getById({
      organizationId: 'org-1',
      actionId: 'action-1',
    });

    expect(updated?.state).toBe('DELETED');
    expect(updated?.version).toBe(2);
    expect(updated?.updatedAt.getTime()).toBeGreaterThan(beforeUpdatedAt.getTime());

    vi.useRealTimers();
  });

  it('throws when action not found', async () => {
    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new DeleteActionUseCase(actionRepository, transactionRunner);

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'ADMIN',
        actionId: 'missing',
        expectedVersion: 1,
      }),
    ).rejects.toBeInstanceOf(ActionNotFound);
  });

  it('rejects unauthorized roles', async () => {
    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new DeleteActionUseCase(actionRepository, transactionRunner);

    const action = createAction('org-1', 'action-1');
    await actionRepository.save(action);

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'MANAGER',
        actionId: 'action-1',
        expectedVersion: 1,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedActionDeletion);
  });

  it('rejects invalid transitions', async () => {
    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new DeleteActionUseCase(actionRepository, transactionRunner);

    const action = createAction('org-1', 'action-1');
    action.delete({ role: 'ADMIN', expectedVersion: 1 });
    await actionRepository.save(action);

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'ADMIN',
        actionId: 'action-1',
        expectedVersion: 2,
      }),
    ).rejects.toBeInstanceOf(InvalidStateTransition);
  });

  it('rejects concurrency conflicts', async () => {
    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new DeleteActionUseCase(actionRepository, transactionRunner);

    await actionRepository.save(createAction('org-1', 'action-1'));

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'ADMIN',
        actionId: 'action-1',
        expectedVersion: 0,
      }),
    ).rejects.toBeInstanceOf(ConcurrencyConflict);
  });

  it('does not leak across organizations', async () => {
    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new DeleteActionUseCase(actionRepository, transactionRunner);

    await actionRepository.save(createAction('org-a', 'action-1'));

    await expect(
      useCase.execute({
        organizationId: 'org-b',
        actorRole: 'ADMIN',
        actionId: 'action-1',
        expectedVersion: 1,
      }),
    ).rejects.toBeInstanceOf(ActionNotFound);
  });
});
