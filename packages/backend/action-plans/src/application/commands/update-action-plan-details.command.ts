import type { Role } from '@repo/backend/kernel';

/**
 * Input command for updating action plan details.
 */
export type UpdateActionPlanDetailsCommand = {
  /** Organization identifier from AuthUser. */
  organizationId: string;
  /** Actor role from AuthUser. */
  actorRole: Role;
  /** Action plan identifier. */
  actionPlanId: string;
  /** Updated title. */
  title: string;
  /** Updated description. */
  description: string;
};
