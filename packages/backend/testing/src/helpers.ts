import { ActionPlan, InMemoryActionPlanRepository } from '@repo/backend/action-plans';
import { Action, InMemoryActionRepository } from '@repo/backend/actions';
import { InMemoryOrganizationRepository, Organization } from '@repo/backend/organizations';
import { InMemoryTransactionRunner } from '@repo/backend/shared';

/**
 * Create a shared in-memory test context.
 * @returns Test context with repositories and transaction runner.
 * @throws {Error} Never thrown in the current implementation.
 */
export const createInMemoryTestContext = () => ({
  organizationRepository: new InMemoryOrganizationRepository(),
  actionPlanRepository: new InMemoryActionPlanRepository(),
  actionRepository: new InMemoryActionRepository(),
  transactionRunner: new InMemoryTransactionRunner(),
});

/**
 * Build an Organization with a single admin membership.
 * @param params Optional identifiers overrides.
 * @param params.organizationId Organization identifier.
 * @param params.adminUserId Admin user identifier.
 * @returns Organization aggregate.
 * @throws {Error} Never thrown in the current implementation.
 */
export const givenOrganizationWithAdmin = (params?: {
  organizationId?: string;
  adminUserId?: string;
}): Organization =>
  Organization.create({
    id: params?.organizationId ?? 'org-1',
    name: 'Qualineo',
    adminUser: {
      userId: params?.adminUserId ?? 'admin-1',
      email: 'admin@qualineo.test',
    },
  });

/**
 * Build an ActionPlan with default values.
 * @param params Optional identifiers overrides.
 * @param params.actionPlanId Action plan identifier.
 * @param params.organizationId Organization identifier.
 * @param params.createdByUserId Creator user identifier.
 * @returns ActionPlan aggregate.
 * @throws {Error} Never thrown in the current implementation.
 */
export const givenActionPlan = (params?: {
  actionPlanId?: string;
  organizationId?: string;
  createdByUserId?: string;
}): ActionPlan =>
  ActionPlan.create({
    id: params?.actionPlanId ?? 'plan-1',
    organizationId: params?.organizationId ?? 'org-1',
    createdByUserId: params?.createdByUserId ?? 'admin-1',
    actorRole: 'ADMIN',
    title: 'Action Plan',
    description: 'Plan description',
  });

/**
 * Build an Action with default values.
 * @param params Optional identifiers overrides.
 * @param params.actionId Action identifier.
 * @param params.organizationId Organization identifier.
 * @param params.actionPlanId Action plan identifier.
 * @param params.createdByUserId Creator user identifier.
 * @returns Action aggregate.
 * @throws {Error} Never thrown in the current implementation.
 */
export const givenAction = (params?: {
  actionId?: string;
  organizationId?: string;
  actionPlanId?: string;
  createdByUserId?: string;
}): Action =>
  Action.create({
    id: params?.actionId ?? 'action-1',
    organizationId: params?.organizationId ?? 'org-1',
    actionPlanId: params?.actionPlanId ?? 'plan-1',
    createdByUserId: params?.createdByUserId ?? 'admin-1',
    title: 'Action',
    description: 'Action description',
  });
