import type { Role } from '@repo/backend/kernel';

/**
 * Result returned after inviting a user into an organization.
 */
export type InviteUserResult = {
  /** Organization identifier. */
  organizationId: string;
  /** Invited user identifier. */
  userId: string;
  /** Assigned role. */
  role: Role;
};
