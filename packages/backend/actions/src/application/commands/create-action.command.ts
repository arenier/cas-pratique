import type { Role } from '@repo/backend/kernel';

/**
 * Input command for creating an action.
 */
export type CreateActionCommand = {
  /** Organization identifier from AuthUser. */
  organizationId: string;
  /** Actor role from AuthUser. */
  actorRole: Role;
  /** Action identifier. */
  actionId: string;
  /** Action plan identifier. */
  actionPlanId: string;
  /** Creator user identifier from AuthUser. */
  createdByUserId: string;
  /** Action title. */
  title: string;
  /** Action description. */
  description: string;
};
