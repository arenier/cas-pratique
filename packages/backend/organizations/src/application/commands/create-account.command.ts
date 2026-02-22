import type { OrganizationId } from '../../domain/value-objects/organization-id';
import type { UserId } from '../../domain/value-objects/user-id';

/**
 * Input command for creating a new organization account.
 */
export type CreateAccountCommand = {
  /** Organization display name. */
  organizationName: string;
  /** Admin user email address. */
  adminEmail: string;
  /** Admin user identifier from the auth provider. */
  adminUserId: UserId;
  /** Optional organization identifier override. */
  organizationId?: OrganizationId;
};
