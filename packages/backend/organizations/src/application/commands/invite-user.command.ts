import type { Role } from '@repo/backend/kernel';

/**
 * Input command for inviting a user into an organization.
 */
export type InviteUserCommand = {
  /** Organization identifier from AuthUser. */
  organizationId: string;
  /** Actor role from AuthUser. */
  actorRole: Role;
  /** Invited user identifier. */
  userId: string;
  /** Invited user email address. */
  email: string;
  /** Role to assign to the invited user. */
  role: Role;
};
