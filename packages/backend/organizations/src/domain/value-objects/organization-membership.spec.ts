import { describe, expect, it } from 'vitest';

import { InvalidRoleAssignment } from '../errors/invalid-role-assignment';
import { OrganizationMembership } from './organization-membership';

const baseParams = {
  userId: 'user-1',
  email: 'user@qualineo.test',
  role: 'USER' as const,
};

describe('OrganizationMembership', () => {
  it('creates an active membership', () => {
    const membership = OrganizationMembership.create(baseParams);

    expect(membership.userId).toBe('user-1');
    expect(membership.email).toBe('user@qualineo.test');
    expect(membership.role).toBe('USER');
    expect(membership.isActive).toBe(true);
  });

  it('rehydrates membership with provided state', () => {
    const membership = OrganizationMembership.rehydrate({
      ...baseParams,
      role: 'ADMIN',
      isActive: false,
    });

    expect(membership.role).toBe('ADMIN');
    expect(membership.isActive).toBe(false);
  });

  it('rejects invalid roles on rehydrate', () => {
    expect(() =>
      OrganizationMembership.rehydrate({
        ...baseParams,
        role: 'OWNER' as unknown as 'USER',
        isActive: true,
      }),
    ).toThrow(InvalidRoleAssignment);
  });
});
