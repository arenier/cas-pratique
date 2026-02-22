import type { Role } from '@repo/backend/kernel';

/**
 * Input command for creating an action plan.
 */
export type CreateActionPlanCommand = {
  /** Organization identifier from AuthUser. */
  organizationId: string;
  /** Actor role from AuthUser. */
  actorRole: Role;
  /** Creator user identifier from AuthUser. */
  createdByUserId: string;
  /** Action plan identifier (optional for deterministic tests). */
  actionPlanId: string;
  /** Title of the action plan. */
  title: string;
  /** Description of the action plan. */
  description: string;
};
