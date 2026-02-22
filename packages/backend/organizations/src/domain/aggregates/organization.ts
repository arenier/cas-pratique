import { LastAdminInvariantViolation } from '../errors/last-admin-invariant-violation';
import { UnauthorizedOrganizationOperation } from '../errors/unauthorized-organization-operation';
import { UserNotInOrganization } from '../errors/user-not-in-organization';
import { OrganizationMembership } from '../value-objects/organization-membership';
import { OrganizationId } from '../value-objects/organization-id';
import { Role, isAdmin, parseRole } from '../value-objects/role';
import { UserId } from '../value-objects/user-id';

export type OrganizationCreateParams = {
  id: OrganizationId;
  name: string;
  adminUser: { userId: UserId; email: string };
};

export type OrganizationProps = {
  id: OrganizationId;
  name: string;
  memberships: OrganizationMembership[];
};

export class Organization {
  public readonly id: string;
  public name: string;
  private memberships: OrganizationMembership[];

  private constructor(props: OrganizationProps) {
    this.id = props.id;
    this.name = props.name;
    this.memberships = props.memberships;
  }

  /**
   * Create a new organization with a single active admin membership.
   * @param params Organization creation parameters.
   * @returns A new Organization instance.
   */
  static create(params: OrganizationCreateParams): Organization {
    const membership = OrganizationMembership.create({
      userId: params.adminUser.userId,
      email: params.adminUser.email,
      role: 'ADMIN',
    });

    return new Organization({
      id: params.id,
      name: params.name,
      memberships: [membership],
    });
  }

  /**
   * Reconstitute an organization from persisted properties.
   * @param props Organization properties.
   * @returns A rehydrated Organization instance.
   */
  static rehydrate(props: OrganizationProps): Organization {
    return new Organization({
      ...props,
      memberships: props.memberships.map((membership) =>
        OrganizationMembership.rehydrate({
          userId: membership.userId,
          email: membership.email,
          role: membership.role,
          isActive: membership.isActive,
        })
      ),
    });
  }

  /**
   * List memberships for this organization.
   * @returns A shallow copy of memberships.
   */
  listMemberships(): OrganizationMembership[] {
    return [...this.memberships];
  }

  /**
   * Invite a user into the organization with a specific role.
   * @param params Invite parameters.
   * @returns void
   * @throws {UnauthorizedOrganizationOperation} If actor is not ADMIN.
   * @throws {InvalidRoleAssignment} If the role is not valid.
   */
  inviteUser(params: { actorRole: Role; userId: UserId; email: string; role: Role }): void {
    this.assertAdmin(params.actorRole);
    const role = parseRole(params.role);

    this.memberships.push(
      OrganizationMembership.create({
        userId: params.userId,
        email: params.email,
        role,
      })
    );
  }

  /**
   * Change a user's role within the organization.
   * @param params Role change parameters.
   * @returns void
   * @throws {UnauthorizedOrganizationOperation} If actor is not ADMIN.
   * @throws {UserNotInOrganization} If the user is not a member.
   * @throws {InvalidRoleAssignment} If the new role is not valid.
   * @throws {LastAdminInvariantViolation} If this would remove the last active admin.
   */
  changeUserRole(params: { actorRole: Role; userId: UserId; newRole: Role }): void {
    this.assertAdmin(params.actorRole);
    const membership = this.getMembershipOrThrow(params.userId);
    const nextRole = parseRole(params.newRole);

    if (membership.role === 'ADMIN' && !isAdmin(nextRole)) {
      this.assertNotLastActiveAdmin(membership.userId);
    }

    membership.role = nextRole;
  }

  /**
   * Deactivate a user within the organization.
   * @param params Deactivation parameters.
   * @returns void
   * @throws {UnauthorizedOrganizationOperation} If actor is not ADMIN.
   * @throws {UserNotInOrganization} If the user is not a member.
   * @throws {LastAdminInvariantViolation} If this would remove the last active admin.
   */
  deactivateUser(params: { actorRole: Role; userId: UserId }): void {
    this.assertAdmin(params.actorRole);
    const membership = this.getMembershipOrThrow(params.userId);

    if (membership.isActive && isAdmin(membership.role)) {
      this.assertNotLastActiveAdmin(membership.userId);
    }

    membership.isActive = false;
  }

  /**
   * Activate a user within the organization.
   * @param params Activation parameters.
   * @returns void
   * @throws {UnauthorizedOrganizationOperation} If actor is not ADMIN.
   * @throws {UserNotInOrganization} If the user is not a member.
   */
  activateUser(params: { actorRole: Role; userId: UserId }): void {
    this.assertAdmin(params.actorRole);
    const membership = this.getMembershipOrThrow(params.userId);

    membership.isActive = true;
  }

  /**
   * Ensure the actor is an ADMIN.
   * @param role Actor role.
   * @returns void
   * @throws {UnauthorizedOrganizationOperation} If actor is not ADMIN.
   */
  private assertAdmin(role: Role): void {
    if (!isAdmin(role)) {
      throw new UnauthorizedOrganizationOperation(role);
    }
  }

  /**
   * Fetch membership or throw when not present.
   * @param userId User identifier.
   * @returns The matching OrganizationMembership.
   * @throws {UserNotInOrganization} If the user is not a member.
   */
  private getMembershipOrThrow(userId: UserId): OrganizationMembership {
    const membership = this.memberships.find((item) => item.userId === userId);

    if (!membership) {
      throw new UserNotInOrganization(userId);
    }

    return membership;
  }

  /**
   * Ensure at least one active admin remains, excluding the specified user.
   * @param excludedUserId User identifier to exclude from the check.
   * @returns void
   * @throws {LastAdminInvariantViolation} If no other active admin exists.
   */
  private assertNotLastActiveAdmin(excludedUserId: UserId): void {
    const activeAdmins = this.memberships.filter(
      (membership) => membership.isActive && isAdmin(membership.role)
    );

    const remainingAdmins = activeAdmins.filter(
      (membership) => membership.userId !== excludedUserId
    );

    if (remainingAdmins.length === 0) {
      throw new LastAdminInvariantViolation();
    }
  }
}
