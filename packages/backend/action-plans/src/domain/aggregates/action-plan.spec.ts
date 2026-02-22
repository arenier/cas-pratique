import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OrganizationMismatch } from '../errors/organization-mismatch';
import { UnauthorizedActionPlanCreation } from '../errors/unauthorized-action-plan-creation';
import { UnauthorizedActionPlanUpdate } from '../errors/unauthorized-action-plan-update';
import { ActionPlan } from './action-plan';

const baseParams = {
  id: 'plan-1',
  organizationId: 'org-1',
  createdByUserId: 'user-1',
  title: 'Initial title',
  description: 'Initial description',
};

const at = (value: string): Date => new Date(value);

describe('ActionPlan', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(at('2026-02-22T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows ADMIN to create', () => {
    const actionPlan = ActionPlan.create({ ...baseParams, actorRole: 'ADMIN' });

    expect(actionPlan.title).toBe('Initial title');
    expect(actionPlan.description).toBe('Initial description');
    expect(actionPlan.organizationId).toBe('org-1');
    expect(actionPlan.createdByUserId).toBe('user-1');
    expect(actionPlan.createdAt.getTime()).toBe(at('2026-02-22T12:00:00.000Z').getTime());
    expect(actionPlan.updatedAt.getTime()).toBe(at('2026-02-22T12:00:00.000Z').getTime());
  });

  it('rejects creation by MANAGER', () => {
    expect(() => ActionPlan.create({ ...baseParams, actorRole: 'MANAGER' })).toThrow(
      UnauthorizedActionPlanCreation,
    );
  });

  it('rejects creation by USER', () => {
    expect(() => ActionPlan.create({ ...baseParams, actorRole: 'USER' })).toThrow(
      UnauthorizedActionPlanCreation,
    );
  });

  it('allows ADMIN to update details', () => {
    const actionPlan = ActionPlan.create({ ...baseParams, actorRole: 'ADMIN' });

    vi.setSystemTime(at('2026-02-22T12:10:00.000Z'));
    actionPlan.updateDetails({
      actorRole: 'ADMIN',
      title: 'Updated title',
      description: 'Updated description',
    });

    expect(actionPlan.title).toBe('Updated title');
    expect(actionPlan.description).toBe('Updated description');
    expect(actionPlan.updatedAt.getTime()).toBe(at('2026-02-22T12:10:00.000Z').getTime());
  });

  it('allows MANAGER to update details', () => {
    const actionPlan = ActionPlan.create({ ...baseParams, actorRole: 'ADMIN' });

    actionPlan.updateDetails({
      actorRole: 'MANAGER',
      title: 'Manager title',
      description: 'Manager description',
    });

    expect(actionPlan.title).toBe('Manager title');
    expect(actionPlan.description).toBe('Manager description');
  });

  it('rejects update by USER', () => {
    const actionPlan = ActionPlan.create({ ...baseParams, actorRole: 'ADMIN' });

    expect(() =>
      actionPlan.updateDetails({
        actorRole: 'USER',
        title: 'Nope',
        description: 'Nope',
      }),
    ).toThrow(UnauthorizedActionPlanUpdate);
  });

  it('asserts same organization', () => {
    const actionPlan = ActionPlan.create({ ...baseParams, actorRole: 'ADMIN' });

    expect(() => actionPlan.assertSameOrganization('org-1')).not.toThrow();
    expect(() => actionPlan.assertSameOrganization('org-2')).toThrow(OrganizationMismatch);
  });
});
