import { describe, expect, it } from 'vitest';

import { InMemoryTransactionRunner } from '@repo/backend/shared';

import { Action } from '../../domain/aggregates/action';
import { ConcurrencyConflict } from '../../domain/errors/concurrency-conflict';
import { InvalidStateTransition } from '../../domain/errors/invalid-state-transition';
import { UnauthorizedTransition } from '../../domain/errors/unauthorized-transition';
import { InMemoryActionRepository } from '../../infrastructure/in-memory/in-memory-action-repository';
import { ActionNotFound } from '../errors/action-not-found';
import { StartActionUseCase } from './start-action.use-case';

const createAction = (organizationId: string, actionId: string) =>
  Action.create({
    id: actionId,
    organizationId,
    actionPlanId: 'plan-1',
    createdByUserId: 'admin-1',
    title: 'Action',
    description: 'Action description',
  });

describe('StartActionUseCase', () => {
  it('starts an action', async () => {
    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new StartActionUseCase(actionRepository, transactionRunner);

    await actionRepository.save(createAction('org-1', 'action-1'));
    const before = await actionRepository.getById({ organizationId: 'org-1', actionId: 'action-1' });
    const beforeUpdatedAt = before?.updatedAt;

    await useCase.execute({
      organizationId: 'org-1',
      actorRole: 'MANAGER',
      actionId: 'action-1',
      expectedVersion: 1,
    });

    const updated = await actionRepository.getById({
      organizationId: 'org-1',
      actionId: 'action-1',
    });

    expect(updated?.state).toBe('IN_PROGRESS');
    expect(updated?.version).toBe(2);
    expect(updated?.updatedAt.getTime()).toBeGreaterThan(beforeUpdatedAt?.getTime() ?? 0);
  });

  it('throws when action not found', async () => {
    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new StartActionUseCase(actionRepository, transactionRunner);

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
    const useCase = new StartActionUseCase(actionRepository, transactionRunner);

    await actionRepository.save(createAction('org-1', 'action-1'));

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        actorRole: 'USER',
        actionId: 'action-1',
        expectedVersion: 1,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedTransition);
  });

  it('rejects invalid transitions', async () => {
    const actionRepository = new InMemoryActionRepository();
    const transactionRunner = new InMemoryTransactionRunner();
    const useCase = new StartActionUseCase(actionRepository, transactionRunner);

    const action = createAction('org-1', 'action-1');
    action.start({ role: 'ADMIN', expectedVersion: 1 });
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
    const useCase = new StartActionUseCase(actionRepository, transactionRunner);

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
    const useCase = new StartActionUseCase(actionRepository, transactionRunner);

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
