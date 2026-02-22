import { describe, expect, it } from 'vitest';
import { Organization } from './organization';
import { InvalidRoleAssignment } from '../errors/invalid-role-assignment';
import { LastAdminInvariantViolation } from '../errors/last-admin-invariant-violation';
import { UnauthorizedOrganizationOperation } from '../errors/unauthorized-organization-operation';
import { UserNotInOrganization } from '../errors/user-not-in-organization';
import { Role } from '@backend/kernel';

const createOrganization = () =>
  Organization.create({
    id: 'org-1',
    name: 'Qualineo',
    adminUser: {
      userId: 'admin-1',
      email: 'admin@qualineo.test',
    },
  });

describe('Organization', () => {
  it('creates organization with one active admin', () => {
    const organization = createOrganization();

    const memberships = organization.listMemberships();
    expect(memberships).toHaveLength(1);
    expect(memberships[0]?.userId).toBe('admin-1');
    expect(memberships[0]?.role).toBe('ADMIN');
    expect(memberships[0]?.isActive).toBe(true);
  });

  it('allows admin to invite users with any role', () => {
    const organization = createOrganization();

    organization.inviteUser({
      actorRole: 'ADMIN',
      userId: 'user-1',
      email: 'user@qualineo.test',
      role: 'USER',
    });

    organization.inviteUser({
      actorRole: 'ADMIN',
      userId: 'manager-1',
      email: 'manager@qualineo.test',
      role: 'MANAGER',
    });

    organization.inviteUser({
      actorRole: 'ADMIN',
      userId: 'admin-2',
      email: 'admin2@qualineo.test',
      role: 'ADMIN',
    });

    const roles = organization
      .listMemberships()
      .map((membership) => membership.role);

    expect(roles).toContain('USER');
    expect(roles).toContain('MANAGER');
    expect(roles).toContain('ADMIN');
  });

  it('rejects invites from non-admin users', () => {
    const organization = createOrganization();

    expect(() =>
      organization.inviteUser({
        actorRole: 'MANAGER',
        userId: 'user-1',
        email: 'user@qualineo.test',
        role: 'USER',
      })
    ).toThrow(UnauthorizedOrganizationOperation);
  });

  it('rejects invites with invalid role', () => {
    const organization = createOrganization();

    expect(() =>
      organization.inviteUser({
        actorRole: 'ADMIN',
        userId: 'user-1',
        email: 'user@qualineo.test',
        role: 'OWNER' as unknown as Role,
      })
    ).toThrow(InvalidRoleAssignment);
  });

  it('allows demoting an admin when another admin exists', () => {
    const organization = createOrganization();

    organization.inviteUser({
      actorRole: 'ADMIN',
      userId: 'admin-2',
      email: 'admin2@qualineo.test',
      role: 'ADMIN',
    });

    organization.changeUserRole({
      actorRole: 'ADMIN',
      userId: 'admin-2',
      newRole: 'USER',
    });

    const updated = organization
      .listMemberships()
      .find((membership) => membership.userId === 'admin-2');

    expect(updated?.role).toBe('USER');
  });

  it('rejects role change from non-admin users', () => {
    const organization = createOrganization();

    expect(() =>
      organization.changeUserRole({
        actorRole: 'MANAGER',
        userId: 'admin-1',
        newRole: 'USER',
      })
    ).toThrow(UnauthorizedOrganizationOperation);
  });

  it('rejects role changes with invalid role', () => {
    const organization = createOrganization();

    expect(() =>
      organization.changeUserRole({
        actorRole: 'ADMIN',
        userId: 'admin-1',
        newRole: 'OWNER' as unknown as Role,
      })
    ).toThrow(InvalidRoleAssignment);
  });

  it('rejects demoting the last active admin', () => {
    const organization = createOrganization();

    expect(() =>
      organization.changeUserRole({
        actorRole: 'ADMIN',
        userId: 'admin-1',
        newRole: 'MANAGER',
      })
    ).toThrow(LastAdminInvariantViolation);
  });

  it('deactivates a non-admin user', () => {
    const organization = createOrganization();

    organization.inviteUser({
      actorRole: 'ADMIN',
      userId: 'user-1',
      email: 'user@qualineo.test',
      role: 'USER',
    });

    organization.deactivateUser({ actorRole: 'ADMIN', userId: 'user-1' });

    const membership = organization
      .listMemberships()
      .find((item) => item.userId === 'user-1');

    expect(membership?.isActive).toBe(false);
  });

  it('rejects deactivation from non-admin users', () => {
    const organization = createOrganization();

    expect(() =>
      organization.deactivateUser({ actorRole: 'USER', userId: 'admin-1' })
    ).toThrow(UnauthorizedOrganizationOperation);
  });

  it('allows deactivating an admin when another admin exists', () => {
    const organization = createOrganization();

    organization.inviteUser({
      actorRole: 'ADMIN',
      userId: 'admin-2',
      email: 'admin2@qualineo.test',
      role: 'ADMIN',
    });

    organization.deactivateUser({ actorRole: 'ADMIN', userId: 'admin-2' });

    const membership = organization
      .listMemberships()
      .find((item) => item.userId === 'admin-2');

    expect(membership?.isActive).toBe(false);
  });

  it('rejects deactivating the last active admin', () => {
    const organization = createOrganization();

    expect(() =>
      organization.deactivateUser({ actorRole: 'ADMIN', userId: 'admin-1' })
    ).toThrow(LastAdminInvariantViolation);
  });

  it('rejects changing role for unknown user', () => {
    const organization = createOrganization();

    expect(() =>
      organization.changeUserRole({
        actorRole: 'ADMIN',
        userId: 'missing',
        newRole: 'USER',
      })
    ).toThrow(UserNotInOrganization);
  });

  it('rejects deactivating unknown user', () => {
    const organization = createOrganization();

    expect(() =>
      organization.deactivateUser({ actorRole: 'ADMIN', userId: 'missing' })
    ).toThrow(UserNotInOrganization);
  });
});
