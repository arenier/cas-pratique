import type { OrganizationId } from '../../domain/value-objects/organization-id';
import type { UserId } from '../../domain/value-objects/user-id';

/**
 * Result returned after creating a new organization account.
 */
export type CreateAccountResult = {
  /** Created organization identifier. */
  organizationId: OrganizationId;
  /** Admin user identifier. */
  adminUserId: UserId;
};
