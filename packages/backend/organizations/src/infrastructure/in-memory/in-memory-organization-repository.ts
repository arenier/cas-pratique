import { Organization } from '../../domain/aggregates/organization';
import { OrganizationRepository } from '../../domain/ports/organization-repository';
import { OrganizationMembership } from '../../domain/value-objects/organization-membership';
import { Role } from '@repo/backend/kernel';

type MembershipSnapshot = {
  userId: string;
  email: string;
  role: Role;
  isActive: boolean;
};

type OrganizationSnapshot = {
  id: string;
  name: string;
  memberships: MembershipSnapshot[];
};

/**
 * Convert an Organization aggregate into a serializable snapshot.
 * @param organization Organization aggregate.
 * @returns Snapshot of organization properties.
 * @throws {Error} Never thrown in the current implementation.
 */
const toSnapshot = (organization: Organization): OrganizationSnapshot => ({
  id: organization.id,
  name: organization.name,
  memberships: organization.listMemberships().map((membership) => ({
    userId: membership.userId,
    email: membership.email,
    role: membership.role,
    isActive: membership.isActive,
  })),
});

/**
 * Rehydrate an Organization aggregate from a snapshot.
 * @param snapshot Snapshot to restore from.
 * @returns Rehydrated Organization aggregate.
 * @throws {Error} Never thrown in the current implementation.
 */
const fromSnapshot = (snapshot: OrganizationSnapshot): Organization =>
  Organization.rehydrate({
    id: snapshot.id,
    name: snapshot.name,
    memberships: snapshot.memberships.map((membership) =>
      OrganizationMembership.rehydrate({
        userId: membership.userId,
        email: membership.email,
        role: membership.role,
        isActive: membership.isActive,
      })
    ),
  });

export class InMemoryOrganizationRepository implements OrganizationRepository {
  private readonly store = new Map<string, OrganizationSnapshot>();

  /**
   * Fetch an organization by identifier.
   * @param params Lookup parameters.
   * @param params.organizationId Organization identifier.
   * @returns The matching organization or null when missing.
   * @throws {Error} Never thrown in the current implementation.
   */
  async getById(params: { organizationId: string }): Promise<Organization | null> {
    const snapshot = this.store.get(params.organizationId);

    return snapshot ? fromSnapshot(snapshot) : null;
  }

  /**
   * Persist an organization snapshot in memory.
   * @param organization Organization aggregate.
   * @returns void
   * @throws {Error} Never thrown in the current implementation.
   */
  async save(organization: Organization): Promise<void> {
    this.store.set(organization.id, toSnapshot(organization));
  }
}
