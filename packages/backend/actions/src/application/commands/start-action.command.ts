import type { Role } from '@repo/backend/kernel';

/**
 * Input command for starting an action.
 */
export type StartActionCommand = {
  /** Organization identifier from AuthUser. */
  organizationId: string;
  /** Actor role from AuthUser. */
  actorRole: Role;
  /** Action identifier. */
  actionId: string;
  /** Expected version for optimistic locking. */
  expectedVersion: number;
};
