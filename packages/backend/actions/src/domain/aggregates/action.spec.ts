import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Action } from './action';
import { ConcurrencyConflict } from '../errors/concurrency-conflict';
import { InvalidActionStatus } from '../errors/invalid-action-status';
import { InvalidStateTransition } from '../errors/invalid-state-transition';
import { UnauthorizedActionDeletion } from '../errors/unauthorized-action-deletion';
import { UnauthorizedTransition } from '../errors/unauthorized-transition';

const baseParams = {
  id: 'action-1',
  organizationId: 'org-1',
  actionPlanId: 'plan-1',
  createdByUserId: 'user-1',
  title: 'Do the thing',
  description: 'Detailed description',
};

const at = (value: string): Date => new Date(value);

const createAction = (): Action => Action.create(baseParams);

const expectDateEquals = (value: Date, expected: Date): void => {
  expect(value.getTime()).toBe(expected.getTime());
};

describe('Action', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(at('2026-02-22T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates an action with initial state and version', () => {
    const action = createAction();

    expect(action.state).toBe('TODO');
    expect(action.version).toBe(1);
    expectDateEquals(action.createdAt, at('2026-02-22T10:00:00.000Z'));
    expectDateEquals(action.updatedAt, at('2026-02-22T10:00:00.000Z'));
  });

  it('rehydrates an action and validates state', () => {
    const action = Action.rehydrate({
      ...baseParams,
      state: 'IN_PROGRESS',
      version: 3,
      createdAt: at('2026-02-21T09:00:00.000Z'),
      updatedAt: at('2026-02-21T09:30:00.000Z'),
    });

    expect(action.state).toBe('IN_PROGRESS');
    expect(action.version).toBe(3);
  });

  it('throws when rehydrating an unknown state', () => {
    expect(() =>
      Action.rehydrate({
        ...baseParams,
        state: 'NOT_A_STATE' as Action['state'],
        version: 1,
        createdAt: at('2026-02-21T09:00:00.000Z'),
        updatedAt: at('2026-02-21T09:30:00.000Z'),
      })
    ).toThrow(InvalidActionStatus);
  });

  it('transitions TODO -> IN_PROGRESS with manager role', () => {
    const action = createAction();

    vi.setSystemTime(at('2026-02-22T10:05:00.000Z'));
    action.start({ role: 'MANAGER', expectedVersion: 1 });

    expect(action.state).toBe('IN_PROGRESS');
    expect(action.version).toBe(2);
    expectDateEquals(action.updatedAt, at('2026-02-22T10:05:00.000Z'));
  });

  it('transitions IN_PROGRESS -> TO_VALIDATE with admin role', () => {
    const action = createAction();

    action.start({ role: 'MANAGER', expectedVersion: 1 });
    vi.setSystemTime(at('2026-02-22T10:10:00.000Z'));
    action.requestValidation({ role: 'ADMIN', expectedVersion: 2 });

    expect(action.state).toBe('TO_VALIDATE');
    expect(action.version).toBe(3);
    expectDateEquals(action.updatedAt, at('2026-02-22T10:10:00.000Z'));
  });

  it('transitions TO_VALIDATE -> DONE with admin role', () => {
    const action = createAction();

    action.start({ role: 'ADMIN', expectedVersion: 1 });
    action.requestValidation({ role: 'MANAGER', expectedVersion: 2 });
    vi.setSystemTime(at('2026-02-22T10:15:00.000Z'));
    action.complete({ role: 'ADMIN', expectedVersion: 3 });

    expect(action.state).toBe('DONE');
    expect(action.version).toBe(4);
    expectDateEquals(action.updatedAt, at('2026-02-22T10:15:00.000Z'));
  });

  it('deletes an action with admin role', () => {
    const action = createAction();

    vi.setSystemTime(at('2026-02-22T10:20:00.000Z'));
    action.delete({ role: 'ADMIN', expectedVersion: 1 });

    expect(action.state).toBe('DELETED');
    expect(action.version).toBe(2);
    expectDateEquals(action.updatedAt, at('2026-02-22T10:20:00.000Z'));
  });

  it('prevents workflow transitions for insufficient roles', () => {
    const action = createAction();

    expect(() => action.start({ role: 'USER', expectedVersion: 1 })).toThrow(
      UnauthorizedTransition
    );
  });

  it('prevents completion for non-admin roles', () => {
    const action = createAction();

    action.start({ role: 'ADMIN', expectedVersion: 1 });
    action.requestValidation({ role: 'ADMIN', expectedVersion: 2 });

    expect(() => action.complete({ role: 'MANAGER', expectedVersion: 3 })).toThrow(
      UnauthorizedTransition
    );
  });

  it('prevents deletion for non-admin roles', () => {
    const action = createAction();

    expect(() => action.delete({ role: 'MANAGER', expectedVersion: 1 })).toThrow(
      UnauthorizedActionDeletion
    );
  });

  it('rejects invalid state transitions', () => {
    const action = createAction();

    expect(() =>
      action.requestValidation({ role: 'MANAGER', expectedVersion: 1 })
    ).toThrow(InvalidStateTransition);
  });

  it('rejects deletion when already deleted', () => {
    const action = createAction();

    action.delete({ role: 'ADMIN', expectedVersion: 1 });

    expect(() => action.delete({ role: 'ADMIN', expectedVersion: 2 })).toThrow(
      InvalidStateTransition
    );
  });

  it('enforces optimistic locking on transitions', () => {
    const action = createAction();

    expect(() => action.start({ role: 'MANAGER', expectedVersion: 2 })).toThrow(
      ConcurrencyConflict
    );

    expect(action.state).toBe('TODO');
    expect(action.version).toBe(1);
  });
});
